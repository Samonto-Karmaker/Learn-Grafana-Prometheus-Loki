# Express Monitoring Server

A basic Express.js server designed for testing monitoring tools like Grafana, Prometheus, and Loki.

## Features

-   **Health Check Endpoint** (`/`): Returns server status and uptime
-   **Slow Endpoint** (`/slow`): Simulates real-world scenarios with:
    -   Random response times (500ms - 3000ms)
    -   20% chance of random failures
    -   Detailed timing information

## Installation

1. Install dependencies:
    ```bash
    npm install
    ```

## Usage

### Development Mode (with auto-restart)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on port 3000 by default (or the port specified in the `PORT` environment variable).

## Endpoints

### GET /

Health check endpoint that returns:

-   Server status
-   Uptime information
-   Current timestamp

**Example Response:**

```json
{
    "status": "healthy",
    "message": "Server is running properly",
    "timestamp": "2025-07-29T10:30:00.000Z",
    "uptime": 123.45
}
```

### GET /slow

Simulates a slow operation with random timing and potential failures:

-   Random delay between 500ms and 3000ms
-   20% chance of failure
-   Returns timing information

**Success Response:**

```json
{
    "status": "success",
    "message": "Operation completed successfully",
    "simulatedTime": 1500,
    "actualTime": 1502,
    "timestamp": "2025-07-29T10:30:00.000Z"
}
```

**Error Response:**

```json
{
    "status": "error",
    "message": "Random server error occurred",
    "actualTime": 1200,
    "timestamp": "2025-07-29T10:30:00.000Z"
}
```

## Testing

You can test the endpoints using curl or any HTTP client:

```bash
# Health check
curl http://localhost:3000/

# Slow endpoint (may succeed or fail randomly)
curl http://localhost:3000/slow
```

## Use Cases

This server is perfect for:

-   Testing monitoring and observability tools
-   Demonstrating error handling and logging
-   Load testing with realistic response patterns
-   Learning about distributed systems behavior
