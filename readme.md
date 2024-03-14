# Readme.md for SendBird Channel Expiry Management

## Overview

This Node.js application uses Express.js, Redis, Axios, and node-cron to manage the expiration of channels in a messaging platform, specifically SendBird. It listens for incoming messages, stores channel information in Redis, and periodically checks for expired channels to close and freeze them.

## Getting Started

### Prerequisites

- Node.js
- Redis server
- Access to SendBird API with valid credentials

### Installation

1. Clone the repository to your local machine.
2. Install the necessary packages using npm:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and populate it with the following environment variables:
    - `PORT`: The port number on which the server will listen (default is 3000)
    - `REDIS_PASSWORD`: Password for Redis server
    - `REDIS_HOST`: Hostname of the Redis server
    - `REDIS_PORT`: Port number of the Redis server
    - `SENDBIRD_BASE_URL`: Base URL of the SendBird API
    - `API_TOKEN`: Authentication token for SendBird API

### Running the Application

1. Start the Redis server.
2. Run the application with the following command:
   ```bash
   npm start
   ```

## Features

- **Message Handling**: Listens for incoming messages through the `/sendbird_message` endpoint and stores channel information in Redis.
- **Channel Expiry Management**: Uses a scheduled cron job to periodically check for expired channels and processes them by sending closure messages, closing conversations, and freezing channels.
- **Error Handling**: Implements error handling to log and manage issues during API requests and Redis operations.

## API Endpoints

- `POST /sendbird_message`: Endpoint to receive messages. It expects a JSON payload containing message details, including category, type, channel information, sender, and message payload.

## Scheduled Jobs

- A cron job runs every 40 seconds to check for expired channels and process them accordingly.

## Configuration

- All configurations are managed through environment variables for easy deployment and management.

## Logging

- Console logging is used for basic output of server status and error reporting.

## Error Handling

- The application logs errors to the console and rethrows them when necessary to ensure proper error management in calling contexts.

## Future Enhancements

- Implement a queuing mechanism to handle API rate limits more efficiently.
- Add more detailed logging and monitoring for production readiness.
- Enhance security by implementing additional authentication and authorization checks.

## License

Specify your licensing information here.
