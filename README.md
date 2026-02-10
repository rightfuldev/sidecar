# GDPR Sidecar

A lightweight sidecar that deploys alongside your microservices to integrate them into GDPR processes. It communicates with the central GDPR Service via NATS and with your microservice via a simple REST contract.

## How It Works

The sidecar acts as a bridge between your microservice and the GDPR Service. On startup, it validates your microservice's GDPR endpoints, registers it in the central data catalog, and then listens for incoming GDPR requests (deletion, export). When a request arrives, the sidecar calls your microservice's REST endpoints and reports the result back.

Your microservice just needs to implement 5 REST endpoints — the sidecar handles all messaging infrastructure, contract validation, and process coordination.

## Required Microservice Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/gdpr/health` | Health check — confirms GDPR endpoints are operational |
| `GET` | `/gdpr/register` | Returns entity definitions and supported GDPR actions |
| `GET` | `/gdpr/data/{userId}` | Returns all personal data for a user |
| `DELETE` | `/gdpr/data/{userId}` | Deletes all personal data for a user |
| `POST` | `/gdpr/export` | Returns JSON dump of user data for export |

The full contract is defined as an OpenAPI spec in the [`gdpr-contracts`](https://github.com/your-org/gdpr-contracts) package. Use it to generate server stubs in any language.

## Configuration

All configuration is via environment variables.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NATS_URL` | Yes | — | NATS connection URL |
| `SERVICE_NAME` | Yes | — | Name this sidecar registers as |
| `MICROSERVICE_URL` | No | `http://localhost:3000` | Microservice base URL |
| `MICROSERVICE_TIMEOUT` | No | `5000` | Timeout for microservice REST calls (ms) |
| `HEALTH_CHECK_INTERVAL` | No | `30000` | Health check interval (ms) |
| `HEARTBEAT_INTERVAL` | No | `10000` | Heartbeat interval to GDPR Service (ms) |

## Deployment

Add the sidecar as a container alongside your microservice:

```yaml
# docker-compose.yaml
services:
  my-service:
    image: my-service:latest
    ports:
      - "3000:3000"

  gdpr-sidecar:
    image: gdpr-sidecar:latest
    environment:
      NATS_URL: nats://nats:4222
      SERVICE_NAME: my-service
      MICROSERVICE_URL: http://my-service:3000
    depends_on:
      - my-service
```

## Startup Behavior

1. Calls `GET /gdpr/health` to verify the microservice is reachable
2. Calls `GET /gdpr/register` to retrieve entity definitions and supported actions
3. Validates the response against the contract schema
4. Registers with the GDPR Service via NATS

If validation fails, the sidecar refuses to register. Your microservice never enters the data catalog in a broken state.

## Supported Actions

- **DELETE** — Receives a deletion request, calls `DELETE /gdpr/data/{userId}` on your microservice, and reports back what was deleted and what was retained (with reasons).
- **EXPORT** — Receives an export request with a presigned S3 upload URL, calls `POST /gdpr/export` on your microservice, uploads the data to S3, and reports back.