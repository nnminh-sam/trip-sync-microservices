# API Gateway Deployment Guide

---

## Containerize your API Gateway

Your gateway needs to be a stateless NestJS service, so Redis is your only state layer. A typical Dockerfile:

```dockerfile
# Stage 1: Install dependencies and build the app
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies (only package*.json for better cache)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy only the built files and production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Start the app
CMD ["node", "dist/main"]

```

---

## Push the image to Artifact Registry

Enable API + create a registry:

```
gcloud services enable artifactregistry.googleapis.com
gcloud artifacts repositories create apigw-repo \
  --repository-format=docker \
  --location=asia-southeast1
```

Tag + push:

```
docker tag apigw asia-southeast1-docker.pkg.dev/<PROJECT_ID>/apigw-repo/apigw:v1
docker push asia-southeast1-docker.pkg.dev/<PROJECT_ID>/apigw-repo/apigw:v1
```

Now your image is ready for any compute resource.

---

## Deploy API Gateway to Cloud Run

Enable APIs:

```
gcloud services enable run.googleapis.com vpcaccess.googleapis.com
```

Create a Serverless VPC Connector:

```
gcloud compute networks vpc-access connectors create apigw-conn \
  --network=main-vpc \
  --region=asia-southeast1 \
  --range=10.8.0.0/28
```

This connector allows Cloud Run → Redis VPC → MySQL VPC access.

Deploy:

```
gcloud run deploy apigateway \
  --image=asia-southeast1-docker.pkg.dev/<PROJECT_ID>/apigw-repo/apigw:v1 \
  --region=asia-southeast1 \
  --platform=managed \
  --vpc-connector=apigw-conn \
  --vpc-egress=all \
  --memory=512Mi \
  --cpu=1 \
  --port=3000 \
  --allow-unauthenticated
```

The `--allow-unauthenticated` depends on whether the gateway itself enforces access control; usually yes.

---

## Configure environment variables

You give Cloud Run everything your API Gateway needs:

Env vars:
- REDIS_HOST
- REDIS_PORT
- DATABASE_HOST (if API gateway needs one)
- BROKER_URL (NATS / PubSub)
- JWT_SECRET
- JWT_BLACKLIST_ENABLED=true

From CLI:

```
gcloud run services update apigateway \
  --set-env-vars=REDIS_HOST=10.7.0.5,REDIS_PORT=6379 \
  --set-env-vars=JWT_SECRET=xyz
```

If Redis is a managed GCE VM or Memorystore instance, adjust host accordingly.

---

## Connect API Gateway → Redis

Your gateway likely uses ioredis or redis client:

```
new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
});
```

As long as the VPC connector is working, Cloud Run can hit Redis private IP.

---

## Connect API Gateway → internal microservices

You probably have 6–7 services behind the gateway. They sit on Cloud Run as well or GCE VM. In both cases:

Use private internal URLs using Cloud Run’s internal ingress:

Deploy internal-only service:

```
gcloud run deploy users-service \
  --image=... \
  --ingress=internal \
  --no-allow-unauthenticated \
  --vpc-connector=shared-conn
```

Your gateway calls them via:

https://users-service-xxxxx.run.app
but your IAM service account must have access via:

```
gcloud run services add-iam-policy-binding users-service \
  --member=serviceAccount:apigateway@<PROJECT_ID>.iam.gserviceaccount.com \
  --role=roles/run.invoker
```

This locks them behind the gateway.

---

## Logging & Monitoring

Two layers:
1. Cloud Run logs (stdout & stderr)
1. Cloud Logging queries

Example query:

```
resource.type="cloud_run_revision"
resource.labels.service_name="apigateway"
```

You also get built-in request logging and request-level metrics.

---

## CI/CD (optional but highly recommended)

Fastest path is Cloud Build:

`cloudbuild.yaml`:

```yaml
steps:
  - name: gcr.io/cloud-builders/docker
    args: ["build", "-t", "asia-southeast1-docker.pkg.dev/$PROJECT_ID/apigw-repo/apigw:$SHORT_SHA", "."]
  - name: gcr.io/cloud-builders/docker
    args: ["push", "asia-southeast1-docker.pkg.dev/$PROJECT_ID/apigw-repo/apigw:$SHORT_SHA"]
  - name: gcr.io/google.com/cloudsdktool/cloud-sdk
    args:
      [
        "run",
        "deploy",
        "apigateway",
        "--image=asia-southeast1-docker.pkg.dev/$PROJECT_ID/apigw-repo/apigw:$SHORT_SHA",
        "--region=asia-southeast1",
        "--platform=managed",
      ]

images:
  - asia-southeast1-docker.pkg.dev/$PROJECT_ID/apigw-repo/apigw:$SHORT_SHA
```

Tie this to GitHub Actions or GitLab CI.

---
