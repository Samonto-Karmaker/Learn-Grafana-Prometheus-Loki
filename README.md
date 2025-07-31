# LGP Stack Setup (Loki + Grafana + Prometheus)

Complete monitoring and observability stack setup with Express.js application for learning and testing.

## Stack Overview

-   **Loki**: Log aggregation system
-   **Grafana**: Visualization and dashboards
-   **Prometheus**: Metrics collection and monitoring
-   **Express App**: Sample application with metrics and logging

## Quick Start

1. **Install dependencies:**

    ```bash
    npm install
    ```

2. **Start monitoring stack:**

    ```bash
    # Start Prometheus
    docker-compose up -d

    # Start Loki
    docker run -d --name=loki -p 3100:3100 grafana/loki

    # Start Grafana
    docker run -d -p 3001:3000 --name=grafana grafana/grafana-oss
    ```

3. **Start Express application:**
    ```bash
    npm start
    ```

### Alternative: Complete Docker Compose Setup

To run everything with docker-compose, update your `docker-compose.yaml`:

```yaml
version: "3"

services:
    prom-server:
        image: prom/prometheus
        ports:
            - 9090:9090
        volumes:
            - ./prometheus-config.yml:/etc/prometheus/prometheus.yml

    loki:
        image: grafana/loki:latest
        ports:
            - "3100:3100"
        command: -config.file=/etc/loki/local-config.yaml

    grafana:
        image: grafana/grafana:latest
        ports:
            - "3001:3000"
        environment:
            - GF_SECURITY_ADMIN_PASSWORD=admin
        volumes:
            - grafana-storage:/var/lib/grafana

volumes:
    grafana-storage:
```

Then simply run: `docker-compose up -d`

## Access Points

-   **Express App**: http://localhost:3000
-   **Prometheus**: http://localhost:9090
-   **Grafana**: http://localhost:3001 (admin/admin)
-   **Loki API**: http://localhost:3100

## Configuration Files

-   `docker-compose.yaml` - Container orchestration
-   `prometheus-config.yml` - Prometheus scraping configuration
-   `src/server.js` - Express app with metrics and logging

## Verification Steps

1. **Check Prometheus targets:**

    - Go to http://localhost:9090/targets
    - Verify Express app metrics are being scraped

2. **Setup Grafana:**

    - Login to http://localhost:3001
    - Add Prometheus data source: `http://prometheus:9090` | `http://host.docker.internal:9090`
    - Add Loki data source: `http://loki:3100` | `http://host.docker.internal:3100`

3. **Test logging and metrics:**
    ```bash
    curl http://localhost:3000/
    curl http://localhost:3000/slow
    curl http://localhost:3000/metrics
    ```

## Grafana Dashboard Queries

**Prometheus Queries:**

-   Request rate: `rate(http_requests_total[5m])`
-   Response time: `histogram_quantile(0.95, rate(request_response_time_seconds_bucket[5m]))`

**Loki Queries:**

-   All logs: `{app="express-server"}`
-   Error logs: `{app="express-server"} |= "error"`

## Cleanup

```bash
# Stop and remove individual containers
docker stop grafana loki
docker rm grafana loki
docker-compose down

# Or if using complete docker-compose setup
docker-compose down -v
```
