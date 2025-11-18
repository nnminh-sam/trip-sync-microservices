# Databases Deployment

---

## Create the Database VM (GCE instance)

This VM will run multiple MySQL containers — one per microservice — all reachable only inside your VPC.

What we’ll do:

- Create an e2-small or e2-medium VM (cheap, enough RAM for 6–7 small MySQL containers)
- Put it inside microservices-subnet
- Give it a private IP only (no public IP unless you need it for admin)
- Install Docker / Docker Compose
- Prepare folders for each DB
- Harden SSH and firewall

The VM is the backbone of your persistence layer, so set it up before touching Cloud Run.

---

## Install MySQL containers (one per service)

Once you SSH into the VM:

- Install Docker
- Create data directories like /data/mysql/users, /data/mysql/orders, etc.
- Run containers on different ports: 33061, 33062, 33063…

This sets up fully isolated databases — cheap but structured.

---

## Set up automated backups → GCS

A DB without backups is just a future regret machine.

You will:

- Create a GCS bucket (e.g., tripsync-db-backups)
- Create a service account for backup uploads
- Set up a nightly cron:

    ```
    mysqldump each-db | gzip | gsutil cp to GCS
    ```

Backups go to cheap storage automatically.

---

## Set up the Serverless VPC Connector routing

You already created the connector — now you’ll configure Cloud Run to use it when deployed.

This step comes after the DB is ready because Cloud Run services need working DB URLs.

---

## Deploy microservices to Cloud Run

After the DB VM is healthy:

- Build/push container images
- Deploy each service
- Configure Cloud Run:
	- VPC connector
	- Secrets from Secret Manager
	- DB host = VM’s private IP
	- DB port = per-service port

Now each service can talk to its dedicated MySQL over private network.

---

## Deploy your existing API Gateway

Your NestJS gateway will run on Cloud Run and do:

- Routing to other Cloud Run services
- Authentication / request validation
- OpenAPI docs

It’ll also use the VPC connector for any DB access it needs.

---

## Set up Pub/Sub (message broker)

Your microservices can now publish/subscribe events:

- Create topics
- Create subscriptions
- Configure microservices to publish domain events
- Add push subscriptions where needed

This replaces NATS in a fully managed way.

---

## Observability

Once services are deployed:

- Set up custom dashboards in Cloud Monitoring
- Alerts (high CPU, low memory on DB VM, backup failures)
- Logging sinks if desired

---

## CI/CD

Finally:

- Configure Cloud Build or GitHub Actions
- Build → push → deploy
- Store secrets in Secret Manager
- Automate database migration steps
