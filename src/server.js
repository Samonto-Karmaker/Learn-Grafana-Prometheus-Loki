const express = require("express")
const client = require("prom-client")
const responseTime = require("response-time")
const { createLogger, transports } = require("winston")
const LokiTransport = require("winston-loki")

// Configure Winston logger with Loki transport
const options = {
    transports: [
        new LokiTransport({
            host: "http://127.0.0.1:3100",
            labels: { app: "express-server" },
            onConnectionError: (err) =>
                console.error("Loki connection error:", err),
        }),
    ],
}

const logger = createLogger(options)

const app = express()
const PORT = process.env.PORT || 3000

// Initialize Prometheus client
const collectDefaultMetrics = client.collectDefaultMetrics
collectDefaultMetrics({ register: client.register })

// Setting up custom metrics
const reqResTimeHistogram = new client.Histogram({
    name: "request_response_time_seconds",
    help: "Histogram of request response time in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.1, 0.5, 1, 2, 3, 5, 10], // Buckets for response time in seconds
})

// Middleware to measure request/response time
app.use(
    responseTime((req, res, time) => {
        reqResTimeHistogram
            .labels({
                method: req.method,
                route: req.url,
                status_code: res.statusCode,
            })
            .observe(time / 1000) // time in seconds

        // Log response time metrics
        logger.info("Request processed", {
            method: req.method,
            route: req.url,
            status_code: res.statusCode,
            response_time_ms: time,
            response_time_seconds: time / 1000,
        })
    })
)

// Middleware to parse JSON
app.use(express.json())

// Middleware to log requests
app.use((req, res, next) => {
    logger.info("Incoming request", {
        method: req.method,
        path: req.path,
        url: req.url,
        user_agent: req.get("User-Agent"),
        ip: req.ip,
        timestamp: new Date().toISOString(),
    })
    next()
})

// Simulate a slow operation with random delay and potential failure
function simulateSlowOperation() {
    return new Promise((resolve, reject) => {
        // Random delay between 500ms and 3000ms
        const delay = Math.floor(Math.random() * 2500) + 500

        logger.debug("Simulating slow operation", { delay_ms: delay })

        setTimeout(() => {
            // 20% chance of failure to simulate real-world errors
            const shouldFail = Math.random() < 0.2

            if (shouldFail) {
                logger.warn("Simulated operation failed", { delay_ms: delay })
                reject(new Error("Random server error occurred"))
            } else {
                logger.debug("Simulated operation completed successfully", {
                    delay_ms: delay,
                })
                resolve(delay)
            }
        }, delay)
    })
}

// Health check endpoint
app.get("/", (req, res) => {
    logger.info("Health check endpoint accessed")

    res.status(200).json({
        status: "healthy",
        message: "Server is running properly",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    })
})

// Slow endpoint that simulates processing time and potential failures
app.get("/slow", async (req, res) => {
    const startTime = Date.now()
    logger.info("Slow endpoint accessed", { start_time: startTime })

    try {
        const timeTaken = await simulateSlowOperation()
        const actualTime = Date.now() - startTime

        logger.info("Slow endpoint completed successfully", {
            simulated_time_ms: timeTaken,
            actual_time_ms: actualTime,
            start_time: startTime,
        })

        res.status(200).json({
            status: "success",
            message: "Operation completed successfully",
            simulatedTime: timeTaken,
            actualTime: actualTime,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        const actualTime = Date.now() - startTime

        logger.error("Error in slow endpoint", {
            error_message: error.message,
            actual_time_ms: actualTime,
            start_time: startTime,
            stack: error.stack,
        })

        res.status(500).json({
            status: "error",
            message: error.message,
            actualTime: actualTime,
            timestamp: new Date().toISOString(),
        })
    }
})

// Metrics endpoint for Prometheus
app.get("/metrics", async (req, res) => {
    logger.debug("Metrics endpoint accessed")

    res.setHeader("Content-Type", client.register.contentType)
    res.end(await client.register.metrics())
})

// 404 handler
app.use("*", (req, res) => {
    logger.warn("404 - Endpoint not found", {
        method: req.method,
        path: req.path,
        url: req.url,
        user_agent: req.get("User-Agent"),
        ip: req.ip,
    })

    res.status(404).json({
        status: "error",
        message: "Endpoint not found",
        timestamp: new Date().toISOString(),
    })
})

// Error handler
app.use((error, req, res, next) => {
    logger.error("Unhandled error occurred", {
        error_message: error.message,
        stack: error.stack,
        method: req.method,
        path: req.path,
        url: req.url,
    })

    res.status(500).json({
        status: "error",
        message: "Internal server error",
        timestamp: new Date().toISOString(),
    })
})

// Start the server
app.listen(PORT, () => {
    logger.info("Server started successfully", {
        port: PORT,
        health_check_url: `http://localhost:${PORT}/`,
        slow_endpoint_url: `http://localhost:${PORT}/slow`,
        metrics_url: `http://localhost:${PORT}/metrics`,
        environment: process.env.NODE_ENV || "development",
    })
})

module.exports = app
