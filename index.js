const express = require("express");
const OpenAI = require("openai");
const cors = require("cors");
const morgan = require("morgan");
const bodyParser = require("body-parser");
require("dotenv").config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EXPECTED_START = process.env.EXPECTED_START;

const app = express();

const PORT = process.env.PORT || 3000;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));


app.post("/openai-completion", async (req, res) => {
  console.log("Received request:", req.body);
  if (!req.body.prompt || !req.body.prompt.startsWith(EXPECTED_START)) {
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
