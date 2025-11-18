# VPC Design

We need:

1. A custom VPC
2. At least one subnet (regional)
3. A Serverless VPC Connector (lets Cloud Run -> VM/MySQL traffic flow privately)
4. Firewall rules (so Cloud Run can talk to your DB VM)

This is enough to host:

- Cloud Run (API Gateway + microservices)
- GCE VM (multi-MySQL setup)
- Pub/Sub (serverless)
- Private communication

---

## Create the VPC

Choose a region: you’re using ap-southeast-2 (Sydney).
We will use CIDRs that avoid accidental overlap.

Run:

```
gcloud compute networks create microservices-vpc \
    --subnet-mode=custom
```

---

## Create the primary subnet

Pick a CIDR block.
Safe default: 10.10.0.0/24

```
gcloud compute networks subnets create microservices-subnet \
    --network=microservices-vpc \
    --region=ap-southeast-2 \
    --range=10.10.0.0/24
```

This subnet will host:

- The GCE database VM
- Anything else server-side running inside the VPC

---

## Create firewall rules

We need the VM to accept MySQL traffic internally from services going through the VPC connector.

Allow internal connections inside VPC:

```
gcloud compute firewall-rules create allow-internal \
    --network=microservices-vpc \
    --allow=tcp,udp,icmp \
    --source-ranges=10.10.0.0/24
```

Allow SSH into your VM (administration)

```
gcloud compute firewall-rules create allow-ssh \
    --network=microservices-vpc \
    --allow=tcp:22 \
    --source-ranges=0.0.0.0/0
```

(If you want to restrict SSH later, we can lock it to your IP.)

---

## Create the Serverless VPC Connector

This is the bridge Cloud Run uses to reach internal resources (your MySQL VM).

Pick a connector IP range separate from the VPC subnet.
Example: 10.8.0.0/28

This doesn’t host machines; it’s just reserved for the connector.

```
gcloud compute networks vpc-access connectors create microservices-connector \
    --region=ap-southeast-2 \
    --network=microservices-vpc \
    --range=10.8.0.0/28 \
    --min-instances=2 \
    --max-instances=3
```

This gives your Cloud Run services a private “adapter” into your subnet.

---

## (Optional but recommended) Restrict outbound egress for Cloud Run

Once your system matures, you’ll want Cloud Run services to route all DB traffic through the connector.

Example Cloud Run deployment with VPC connector + all egress:

```
gcloud run deploy service-users \
    --image=gcr.io/<project>/service-users \
    --region=ap-southeast-2 \
    --vpc-connector=microservices-connector \
    --vpc-egress=all-traffic \
    --no-allow-unauthenticated
```

This forces DB connections to go through your VPC.

---

## Verify the setup

You should now see:

VPC: microservices-vpc
Subnet: microservices-subnet (10.10.0.0/24)
Firewall:
  - allow-internal
  - allow-ssh
VPC Connector: microservices-connector (10.8.0.0/28)

That’s the network wiring finished.
