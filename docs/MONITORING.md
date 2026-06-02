# Monitoring & Observability

## Observability Strategy

- **Approach**: Structured JSON logs + health endpoints + metrics
- **Tooling**: Prometheus metrics endpoint, Sentry for error tracking, Grafana for visualization
- **Critical paths**: API endpoints, database connectivity, authentication flow
- **Healthy state**: All health checks return 200, error rate < 1%, P95 latency < 2s
- **Known failure modes**: DB connection exhaustion, unhandled promise rejections, memory leaks in long-running processes

## Health Checks

| Endpoint   | Interval | Expected Response | Purpose                        |
|------------|----------|-------------------|--------------------------------|
| `/healthz` | 30s      | `200 OK`          | Basic liveness check           |
| `/readyz`  | 30s      | `200 OK`          | Readiness — DB + deps healthy  |
| `/metrics` | 60s      | Prometheus text   | Scrapable metrics for Grafana |

### Health endpoint response shape

```json
// GET /healthz → 200
{ "status": "ok" }

// GET /readyz → 200 (all healthy) or 503 (degraded)
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "cache": "ok"
  }
}
```

## Error Tracking

- **Tool**: Sentry (or equivalent — configure once chosen)
- **DSN**: Set via `SENTRY_DSN` environment variable
- **Sampling**: 100% for errors, 10% for transactions in production
- **Filtering rules**:
  - Ignore: HTTP 4xx client errors (except auth-related)
  - Ignore: `NavigationDuplicated` (Vue/React router noise)
  - Group by: `ingerprint` = exception type + stack frame module
- **Alerting**: Page on-call when error rate > 1% over 5 minutes

## Logging

All services emit structured JSON to stdout. Log level controlled by `LOG_LEVEL` env var.

```json
{
  "timestamp": "2026-04-05T12:00:00.000Z",
  "level": "info",
  "service": "docustract-api",
  "correlationId": "req-abc123",
  "message": "Request completed",
  "method": "GET",
  "path": "/api/users",
  "statusCode": 200,
  "durationMs": 45
}
```

| Field          | Type     | Description                                    |
|----------------|----------|------------------------------------------------|
| `timestamp`    | ISO 8601 | UTC time of log emission                       |
| `level`        | string   | `debug`, `info`, `warn`, `error`, `fatal`     |
| `service`      | string   | Service name (e.g. `docustract-api`)          |
| `correlationId`| string   | Request trace ID — links all logs in a request|
| `message`      | string   | Human-readable log message                     |
| `...context`   | any      | Additional structured fields per log site     |

## Alerting Rules

| Metric               | Threshold              | Action                          |
|----------------------|------------------------|---------------------------------|
| Error rate           | > 1% over 5 min        | Page on-call engineer           |
| P95 request latency  | > 2000ms over 5 min    | Page on-call engineer           |
| Health check failure | 3 consecutive failures  | Page on-call engineer           |
| CPU usage            | > 90% over 5 min       | Slack alert (non-critical)       |
| Memory usage         | > 85% over 5 min       | Slack alert (non-critical)       |
| Database connections  | > 80% of pool used     | Slack alert (non-critical)       |

## Dashboards

| Dashboard         | Covers                                  | Tool       |
|-------------------|-----------------------------------------|------------|
| API Performance   | Request rate, latency percentiles, error rate | Grafana |
| Infrastructure    | CPU, memory, disk, network              | Grafana    |
| Business Metrics  | Active users, sign-ups, key events     | Grafana    |
| Error Overview    | Error volume, top errors, new issues   | Sentry     |

## Setup Instructions

Once hosting and error-tracking tools are chosen:

1. Add `/healthz`, `/readyz` endpoints to the API server
2. Wire structured JSON logger (e.g. Pino for Node.js)
3. Create Grafana dashboard with Prometheus data source
4. Configure Sentry DSN via environment variable
5. Set up PagerDuty/Grafana Alerting integration for on-call
