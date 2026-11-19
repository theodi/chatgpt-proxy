const express = require("express");
const Anthropic = require("@anthropic-ai/sdk");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const fs = require("fs");
const https = require("https");
require("dotenv").config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const EXPECTED_STARTS = String(process.env.EXPECTED_STARTS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || null;
const SSL_PEM_PATH = process.env.SSL_PEM_PATH || null;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const MAX_COMPLETION_TOKENS = Number(process.env.MAX_COMPLETION_TOKENS) || 4096;

const app = express();

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).send("Hello, World!");
});

function toTextContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      })
      .join("");
  }
  return content == null ? "" : String(content);
}

function mapResponseFormat(responseFormat) {
  if (!responseFormat || typeof responseFormat !== "object") return null;

  if (responseFormat.type === "json_schema") {
    const jsonSchema = responseFormat.json_schema || {};
    const schema = jsonSchema.schema || responseFormat.schema;
    if (!schema || typeof schema !== "object") return null;

    return {
      format: {
        type: "json_schema",
        schema,
      },
    };
  }

  return null;
}

function buildAnthropicRequest(body) {
  const { temperature, messages = [], response_format, output_config, ...rest } =
    body || {};
  const systemParts = [];
  const anthropicMessages = [];

  for (const message of messages) {
    if (!message || !message.role) continue;
    const text = toTextContent(message.content);
    if (message.role === "system") {
      if (text) systemParts.push(text);
      continue;
    }
    if (message.role !== "user" && message.role !== "assistant") continue;
    anthropicMessages.push({ role: message.role, content: text });
  }

  const request = {
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_COMPLETION_TOKENS,
    messages: anthropicMessages,
  };

  if (systemParts.length) {
    request.system = systemParts.join("\n\n");
  }

  // Client model / max_tokens / n / stop / aiAPIKey are intentionally ignored.
  for (const key of ["stop_sequences", "top_p", "top_k", "metadata"]) {
    if (rest[key] !== undefined) request[key] = rest[key];
  }

  if (output_config && typeof output_config === "object") {
    request.output_config = output_config;
  } else {
    const mapped = mapResponseFormat(response_format);
    if (mapped) {
      request.output_config = mapped;
    }
  }

  // Anthropic rejects temperature (and similar sampling knobs) with structured outputs.
  if (!request.output_config && temperature !== undefined) {
    request.temperature = temperature;
  }

  return request;
}

function toOpenAiStyleResponse(message) {
  const text = (message.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    id: message.id,
    object: "chat.completion",
    model: message.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: text,
        },
        finish_reason: message.stop_reason || "stop",
      },
    ],
    usage: {
      prompt_tokens: message.usage && message.usage.input_tokens,
      completion_tokens: message.usage && message.usage.output_tokens,
      total_tokens:
        message.usage &&
        (message.usage.input_tokens || 0) + (message.usage.output_tokens || 0),
    },
    anthropic: message,
  };
}

function normalizeError(error) {
  const status = error.status || error.statusCode || 500;
  const message =
    (error.error && error.error.message) ||
    error.message ||
    "Unexpected error from AI provider.";
  const type =
    (error.error && error.error.type) || error.type || error.name || "api_error";

  return {
    status,
    body: {
      error: {
        message,
        type,
        status,
      },
    },
  };
}

app.post("/openai-completion", async (req, res) => {
  const rawContent =
    (req.body &&
      req.body.messages &&
      req.body.messages[0] &&
      req.body.messages[0].content) ||
    "";
  const messageContent = String(rawContent)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const IS_DEBUG =
    process.env.npm_lifecycle_event === "debug" || process.env.DEBUG === "true";
  if (IS_DEBUG) {
    try {
      console.log("DEBUG rawContent:", rawContent);
      console.log("DEBUG normalizedContent:", messageContent);
      console.log("DEBUG EXPECTED_STARTS:", EXPECTED_STARTS);
      const debugIncludes = EXPECTED_STARTS.map((start) => ({
        start,
        includes: messageContent.includes(start),
      }));
      console.log("DEBUG includes per start:", debugIncludes);
    } catch (_) {
      // no-op if console/logging fails for any reason
    }
  }

  const isValidStart = EXPECTED_STARTS.some((start) =>
    messageContent.includes(start)
  );

  if (!isValidStart) {
    return res.status(400).json({
      error: {
        message: "Invalid prompt content.",
        type: "invalid_request_error",
        status: 400,
      },
    });
  }

  try {
    const requestBody = buildAnthropicRequest(req.body);
    const response = await anthropic.messages.create(requestBody);
    res.status(200).send(toOpenAiStyleResponse(response));
  } catch (error) {
    console.error("Error in /openai-completion route:", error);
    const { status, body } = normalizeError(error);
    res.status(status).json(body);
  }
});

app.use((req, res, next) => {
  res.status(404).json({
    error: {
      message: "Not Found",
      type: "not_found",
      status: 404,
    },
  });
});

if (SSL_KEY_PATH && SSL_PEM_PATH) {
  const privateKey = fs.readFileSync(SSL_KEY_PATH, "utf8");
  const certificate = fs.readFileSync(SSL_PEM_PATH, "utf8");
  const credentials = { key: privateKey, cert: certificate };
  const httpsServer = https.createServer(credentials, app);

  httpsServer.listen(PORT, HOST, () => {
    console.log(`Server is running on https://${HOST}:${PORT}`);
  });
} else {
  app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
}
