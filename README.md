# ChatGPT Proxy

The ChatGPT Proxy is a Node.js application that acts as a proxy for interacting with OpenAI's ChatGPT API. It provides a simple HTTP server that listens to incoming requests, validates the requests, and forwards them to the ChatGPT API, returning the responses to the clients.

## Prerequisites

Before using the ChatGPT Proxy, you need to have the following prerequisites set up:

1. Node.js: Make sure you have Node.js installed on your system. You can download it from [nodejs.org](https://nodejs.org/).

2. OpenAI API Key: You must have an OpenAI API key to authenticate your requests to the ChatGPT API. You can obtain an API key from the OpenAI platform.

3. Environment Variables: Create a `.env` file in the project directory or configure environment variables in your deployment environment with the following variables:

   - `OPENAI_API_KEY`: Your OpenAI API key.
   - `EXPECTED_STARTS`: Comma-separated list of strings expected in the first message content to validate requests.
   - `OPENAI_MODEL` (optional): Default model to use when the client request omits `model` (default: `gpt-5`).
   - `HOST` (optional): The hostname to bind to (default: "localhost").
   - `PORT` (optional): The port to listen on (default: 3000).
   - `SSL_KEY_PATH` (optional): Path to your SSL key file for HTTPS (required if running with SSL).
   - `SSL_PEM_PATH` (optional): Path to your SSL PEM file for HTTPS (required if running with SSL).

## Installation

1. Clone this repository to your local machine:

   ```
   git clone https://github.com/your-username/chargpt-proxy.git
   ```

2. Navigate to the project directory:

   ```
   cd chargpt-proxy
   ```

3. Install the required Node.js packages using npm:

   ```
   npm install
   ```

## Usage

1. Set up the required environment variables by creating a `.env` file in the project directory or configuring them in your deployment environment.

   ```
   OPENAI_API_KEY=your_openai_api_key
   EXPECTED_STARTS=desired_start_string_one,another_start
   OPENAI_MODEL=gpt-5
   HOST=localhost
   PORT=3000
   SSL_KEY_PATH=/path/to/your/keyfile.key (required for HTTPS)
   SSL_PEM_PATH=/path/to/your/pemfile.pem (required for HTTPS)
   ```

2. Start the ChatGPT Proxy server:

   ```
   npm start
   ```

3. The server will now be running and listening for incoming requests. You can send POST requests to `http://localhost:3000/openai-completion` with a JSON payload containing your messages. If you omit `model`, the server will inject the default from `OPENAI_MODEL`.

   Example POST request:

   ```json
   {
     "messages": [
       { "role": "user", "content": "Your expected start ... actual prompt" }
     ]
   }
   ```

   Or explicitly specify a model to override the default:

   ```json
   {
     "model": "gpt-4o-mini",
     "messages": [
       { "role": "user", "content": "Your expected start ... actual prompt" }
     ]
   }
   ```

4. The proxy will validate that the first message `content` includes one of `EXPECTED_STARTS`, then forward the request to the OpenAI API, returning the response.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- This project uses the [OpenAI Node.js library](https://github.com/openai/openai-node) for API communication.
- Special thanks to OpenAI for providing the ChatGPT API.

Feel free to customize and extend this README.md to provide more detailed information or additional usage instructions if necessary.
```

Please make sure to replace `"your-username"` with your actual GitHub username in the clone URL and update any other placeholders with your specific information as needed.
