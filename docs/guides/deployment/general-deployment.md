# Trip Sync GCP Deployment Guide

---

Target: 6–7 microservices + API gateway + message broker + separate MySQL databases
Budget: Use base GCP credits, keep architecture lean
Goal: Containerized microservice system deployed on GCP, maintainable and observable

---

## System Architecture Overview

Ingress → API Gateway → Microservices → DB Layer → Pub/Sub → Observability

In text form:

```
        Internet
            │
        HTTPS Load Balancer
            │
          Cloud Run
        (API Gateway)
            │
    -------------------
    |       |         |
Service A  Service B  Service C ... (Cloud Run Services)
    │       │         │
    └───────┴─────────┘
            │
       VPC Connector
            │
    ----------------------
    | GCE VM (multi-db) |
    | Pub/Sub broker    |
    ----------------------
            │
         Cloud SQL (optional)
            │
          GCS bucket
```

---

## Component-by-Component Explanation

### API Gateway (existing NestJS gateway)

You keep everything exactly as is:

- Routes incoming requests
- Hosts OpenAPI docs
- Performs auth / rate limit / routing
- Makes internal HTTP calls to backend services

You deploy it as:
Cloud Run instance + HTTPS Load Balancer + Custom Domain (optional)

No need for GCP’s built-in API Gateway or ESPv2 proxy.

Compatibility: 100%.

### Microservices (6–7 NestJS services)

Each microservice becomes its own Cloud Run service.

Reasons Cloud Run fits microservices:

- Containerized
- Dynamic auto-scale
- Zero-scale (scale to 0 = free when idle)
- Works perfectly with Pub/Sub
- Simple IAM-per-service

You give each service:

- Its own environment variables
- Its own CPU/memory
- Its own Cloud Run URL
- Its own Pub/Sub topics/subscriptions

### Message Broker – GCP Pub/Sub

Your NestJS microservices subscribe to Pub/Sub the same way NestJS supports Kafka/NATS.

Integration pattern:
- API Gateway → publishes event
- Microservice A/B/C → consumes using Pub/Sub subscriber
- Idempotency handled inside service logic

Pub/Sub is cheap and scales beautifully.

### Database Layer

Your priority: dedicated DB per service while staying under budget.

Cloud SQL is too expensive for 6–7 MySQL instances (expect ~$35–60/mo each).

The adjusted cost-optimized plan:

Tier 1: GCE Shared MySQL Host (99% of your DBs)

Deploy a single, small VM (e2-micro or e2-small)
Inside it, run multiple MySQL Docker containers:

```
mysql-orders
mysql-users
mysql-payments
mysql-notifications
mysql-catalog
mysql-analytics
... etc
```

Each container binds to a different port.

This gives:
- DB-per-service isolation
- Dirt-cheap cost (VM = ~$7–10/mo)
- Easy snapshot/backup scripts
- Quick portability
- No Cloud SQL lock-in

Tier 2: Cloud SQL (optional — only for critical DBs)

If one service requires high reliability (e.g., financial transactions), place only that DB on Cloud SQL.

Most services won’t need this for MVP.

### Networking – VPC + Serverless Connector

Cloud Run needs a path to your VM-hosted databases.

Configure:

- VPC network
- Serverless VPC Connector (minimum size)
- Cloud Run routes private DB traffic over VPC
- Public traffic only hits the API Gateway

Microservices never expose public IPs — they all sit behind the gateway.

### Observability

GCP gives you the essentials:

- Cloud Logging
- Cloud Monitoring (dashboards)
- Error Reporting
- Cloud Trace (latency analysis)

Attach logs for all Cloud Run services + Pub/Sub subscribers + VM.

Prometheus/Grafana can be added later, but not required for MVP.

### Storage – GCS Buckets

Use one bucket for:

- file uploads
- service artifacts
- logs
- backups from your VM-MySQL containers

Bucket tiers:

- REGIONAL for hot access
- NEARLINE for backups

---

## Deployment Steps (End-to-end)

### Prepare Repository Structure

```
repo/
  api-gateway/
  services/
     orders/
     users/
     auth/
     catalog/
     payment/
     notifications/
     ...
  infra/
     docker/
     terraform/ (optional)
     mysql/
```

Each service has Dockerfile + .env.

### Build & Push Images to Artifact Registry

For each service:

```
gcloud builds submit --tag=asia-docker.pkg.dev/<project>/microservices/service-x
```

### Deploy API Gateway on Cloud Run

```
gcloud run deploy api-gateway \
  --image=asia-docker.pkg.dev/<project>/microservices/api-gateway \
  --platform=managed \
  --memory=512Mi \
  --max-instances=3 \
  --ingress=all \
  --allow-unauthenticated
```

### Deploy Microservices

Each service:

```
gcloud run deploy service-orders \
  --image=asia-docker.pkg.dev/<project>/microservices/service-orders \
  --platform=managed \
  --memory=512Mi \
  --no-allow-unauthenticated \
  --vpc-connector=my-vpc-connector
```

### Create Pub/Sub Topics & Subscriptions

```
gcloud pubsub topics create order.created
gcloud pubsub subscriptions create order.created.sub --topic order.created
```

Bind subscription to Cloud Run services.

### Create the Shared MySQL VM

```
gcloud compute instances create mysql-host \
  --machine-type=e2-micro \
  --boot-disk-size=30GB \
  --tags=mysql-vm
```

SSH into VM, install Docker, run MySQL containers:

```
docker run -d --name users-db -p 3306:3306 -e MYSQL_ROOT_PASSWORD=...
docker run -d --name orders-db -p 3307:3306 ...
docker run -d --name catalog-db -p 3308:3306 ...
```

### Connect Cloud Run → VM

Assign Cloud Run services private IPs using Serverless VPC Connector.

### Logging and Monitoring Setup

Attach alerts:

- CPU spike
- 5xx errors from any service
- Pub/Sub backlog
- VM crash

### Credential & Secret Management

Store MySQL passwords in Secret Manager:

```
gcloud secrets create users-db-password --data-file=pass.txt
```

Inject into Cloud Run via environment variables.

---

## Cost Breakdown (Realistic Estimate)

| Component                       | Est. Monthly Cost       |
|:--------------------------------|:------------------------|
| Cloud Run (7–8 services idling) | ~$0–$10 (scale-to-zero) |
| API Gateway                     | part of Cloud Run       |
| Pub/Sub                         | <$1                     |
| GCE VM (multi-MySQL)            | ~$7–10                  |
| GCS Bucket                      | ~$1–5                   |
| VPC Serverless Connector        | ~$7                     |
| Cloud Monitoring                | free for basic          |
| Cloud SQL (if using 1 instance) | ~$35–40                 |

Total for MVP (no Cloud SQL): $15–25/mo
With 1 Cloud SQL DB: ~$55–65/mo

This fits nicely in your $300 GCP credits.

---

## Summary

This blueprint gives you:

- Multi-service design
- Dedicated DB per service
- Your existing NestJS API gateway
- Message broker
- Cheap, scalable infrastructure
- Clear deployment path
- Clear networking design
- Full GCP-native observability
