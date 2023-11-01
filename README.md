# ChatGPT Proxy

The ChatGPT Proxy is a Node.js application that acts as a proxy for interacting with OpenAI's ChatGPT API. It provides a simple HTTP server that listens to incoming requests, validates the requests, and forwards them to the ChatGPT API, returning the responses to the clients.

## Prerequisites

Before using the ChatGPT Proxy, you need to have the following prerequisites set up:

1. Node.js: Make sure you have Node.js installed on your system. You can download it from [nodejs.org](https://nodejs.org/).

2. OpenAI API Key: You must have an OpenAI API key to authenticate your requests to the ChatGPT API. You can obtain an API key from the OpenAI platform.

3. Environment Variables: Create a `.env` file in the project directory or configure environment variables in your deployment environment with the following variables:

   - `OPENAI_API_KEY`: Your OpenAI API key.
   - `EXPECTED_START`: A string that should be present at the start of the prompt to validate incoming requests.
   - `HOST` (optional): The hostname to bind to (default: "localhost").
   - `PORT` (optional): The port to listen on (default: 3000).

## Installation

1. Clone this repository to your local machine:

   ```
   git clone https://github.com/theodi/chatgpt-proxy.git
   ```

2. Navigate to the project directory:

   ```
   cd chatgpt-proxy
   ```

3. Install the required Node.js packages using npm:

   ```
   npm install
   ```

## Usage

1. Set up the required environment variables by creating a `.env` file in the project directory or configuring them in your deployment environment.

   ```
   OPENAI_API_KEY=your_openai_api_key
   EXPECTED_START=desired_start_string
   HOST=localhost
   PORT=3000
   ```

2. Start the ChatGPT Proxy server:

   ```
   npm start
   ```

3. The server will now be running and listening for incoming requests. You can send POST requests to `http://localhost:3000/openai-completion` with a JSON payload containing your prompt.

   Example POST request:

   ```json
   {
     "prompt": "Translate the following English text to French: 'Hello, world.'"
   }
   ```

4. The proxy will validate the request and forward it to the ChatGPT API, returning the response to the client.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- This project uses the [OpenAI Node.js library](https://github.com/openai/openai-node) for API communication.
- Special thanks to OpenAI for providing the ChatGPT API.
