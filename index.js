const express = require("express");
const OpenAI = require("openai");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const fs = require("fs");
const https = require("https"); // Import the 'https' module
require("dotenv").config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EXPECTED_STARTS = process.env.EXPECTED_STARTS.split(","); // Split into an array
const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || 3000;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || null; // Path to your SSL key file
const SSL_PEM_PATH = process.env.SSL_PEM_PATH || null; // Path to your SSL PEM file
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5";
const MAX_COMPLETION_TOKENS = process.env.MAX_COMPLETION_TOKENS || 1000;

const app = express();

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));

// Add a route for the home page ("/") to return "Hello, World!"
app.get("/", (req, res) => {
  res.status(200).send("Hello, World!");
});

app.post("/openai-completion", async (req, res) => {

  // Check if the received prompt starts with any of the expected starting strings
  const rawContent = (req.body && req.body.messages && req.body.messages[0] && req.body.messages[0].content) || "";
  const messageContent = String(rawContent)
    .replace(/<[^>]*>/g, " ") // strip HTML tags
    .replace(/&nbsp;/gi, " ") // convert nbsp to spaces
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
  // DEBUG LOGS (only when npm script is 'debug' or DEBUG=true)
  const IS_DEBUG = process.env.npm_lifecycle_event === 'debug' || process.env.DEBUG === 'true';
  if (IS_DEBUG) {
    try {
      console.log("DEBUG rawContent:", rawContent);
      console.log("DEBUG normalizedContent:", messageContent);
      console.log("DEBUG EXPECTED_STARTS:", EXPECTED_STARTS);
      const debugIncludes = EXPECTED_STARTS.map(start => ({ start, includes: messageContent.includes(start) }));
      console.log("DEBUG includes per start:", debugIncludes);
    } catch (_) {
      // no-op if console/logging fails for any reason
    }
  }
  const isValidStart = EXPECTED_STARTS.some(start => messageContent.includes(start));

  if (!isValidStart) {
    return res.status(400).json({ error: "Invalid prompt content." });
  }
  try {
    const { max_tokens, temperature, ...restBody } = req.body || {};
    const requestBody = {
      ...restBody,
      model: OPENAI_MODEL,
      max_completion_tokens: MAX_COMPLETION_TOKENS,
    };

    const response = await openai.chat.completions.create(requestBody);
    res.status(200).send(response.data || response);
  } catch (error) {
    console.error("Error in /openai-completion route:", error);
    res.status(error.status).json({ error: error });
  }
});

// Handle 404 (Not Found) errors for any other routes
app.use((req, res, next) => {
  res.status(404).json({ error: "Not Found" });
});

// Create an HTTPS server with the provided key and PEM files
if (SSL_KEY_PATH && SSL_PEM_PATH) {
  const privateKey = fs.readFileSync(SSL_KEY_PATH, "utf8");
  const certificate = fs.readFileSync(SSL_PEM_PATH, "utf8");
  const credentials = { key: privateKey, cert: certificate };
  const httpsServer = https.createServer(credentials, app);

  httpsServer.listen(PORT, HOST, () => {
    console.log(`Server is running on https://${HOST}:${PORT}`);
  });
} else {
  // If key and PEM file paths are not provided, fall back to HTTP
  app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
}
