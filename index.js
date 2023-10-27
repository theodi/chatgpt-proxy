const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
require("dotenv").config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const app = express();

const PORT = process.env.PORT || 3000;


const openai = new OpenAI({apiKey: OPENAI_API_KEY});

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));  // Logging middleware

// Endpoint for OpenAI completions

app.post('/openai-completion', async (req, res) => {
    console.log('Received request:', req.body);
    try {
      const response = await openai.chat.completions.create({
        ...req.body,
      });
     res.status(200).send(response.data || response);
    } catch (error) {
        console.error('Error in /openai-completion route:', error);
        res.status(error.status).json({ error: error.name });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
