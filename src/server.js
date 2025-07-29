const express = require("express")
const client = require("prom-client")

const app = express()
const PORT = process.env.PORT || 3000

// Initialize Prometheus client
const collectDefaultMetrics = client.collectDefaultMetrics
collectDefaultMetrics({ register: client.register })

// Middleware to parse JSON
app.use(express.json())

// Middleware to log requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
    next()
})

// Simulate a slow operation with random delay and potential failure
function simulateSlowOperation() {
    return new Promise((resolve, reject) => {
        // Random delay between 500ms and 3000ms
        const delay = Math.floor(Math.random() * 2500) + 500

        setTimeout(() => {
            // 20% chance of failure to simulate real-world errors
            const shouldFail = Math.random() < 0.2

            if (shouldFail) {
                reject(new Error("Random server error occurred"))
            } else {
                resolve(delay)
            }
        }, delay)
    })
}

// Health check endpoint
app.get("/", (req, res) => {
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

    try {
        const timeTaken = await simulateSlowOperation()
        const actualTime = Date.now() - startTime

        res.status(200).json({
            status: "success",
            message: "Operation completed successfully",
            simulatedTime: timeTaken,
            actualTime: actualTime,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        const actualTime = Date.now() - startTime

        console.error(`Error in /slow endpoint: ${error.message}`)

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
    res.setHeader("Content-Type", client.register.contentType)
    res.end(await client.register.metrics())
})

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        status: "error",
        message: "Endpoint not found",
        timestamp: new Date().toISOString(),
    })
})

// Error handler
app.use((error, req, res, next) => {
    console.error("Unhandled error:", error)
    res.status(500).json({
        status: "error",
        message: "Internal server error",
        timestamp: new Date().toISOString(),
    })
})

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
    console.log(`Health check: http://localhost:${PORT}/`)
    console.log(`Slow endpoint: http://localhost:${PORT}/slow`)
})

module.exports = app
