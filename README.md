# Chat Test Frontend

This is a React application containerized using Docker.

## Prerequisites

- Docker

## Building the Docker Image

To build the Docker image, run the following command in the directory containing the Dockerfile:

```
docker build -t chat-test-app .
```

## Running the Docker Container

To run the Docker container, use the following command:

```
docker run -p 8080:80 -e FASTAPI_URL=http://your-api-url chat-test-app
```

The application will be accessible at `http://localhost:8080`.

## Development

For local development without Docker, you can use the standard npm commands:

```
npm install
npm start
```

This will start the development server at `http://localhost:3000`.