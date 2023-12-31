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
  const messageContent = req.body.messages[0].content;
  const isValidStart = EXPECTED_STARTS.some(start => messageContent.includes(start));

  if (!isValidStart) {
    return res.status(400).json({ error: "Invalid prompt content." });
  }
  try {
    const response = await openai.chat.completions.create({
      ...req.body,
    });
    res.status(200).send(response.data || response);
  } catch (error) {
    console.error("Error in /openai-completion route:", error);
    res.status(error.status).json({ error: error.name });
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
