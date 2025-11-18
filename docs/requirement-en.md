# Trip Sync Project Requirement

---

## Official Project Name

"Building a business trip management system using microservices architecture with monitoring and verification"

## Theory

- Research the out-of-office business trip process and its business requirements.
- Study React Native/Flutter (mobile app) and ReactJS (web app).
- Study Node.js, Express.js, and MySQL in a microservices architecture.
- Study Leaflet.js and OpenStreetMap to display maps and travel routes.
- Study WebSocket/Firebase for real-time GPS monitoring and alerts when deviating from the planned route.
- Study GnuPG mechanisms to verify the integrity of evidence (photos, videos).
- Study watermarking techniques to embed timestamp + GPS information into photos/videos.
- Study deploying microservices on Docker/Kubernetes.

## Practice

### Develop the system following a microservices architecture:

- User management service.
- Business trip management service.
- GPS/Tracking service.
- Evidence storage service (using Google Cloud Storage or MinIO).
- GnuPG and watermark verification service.

### Design and build applications for the system:

**Mobile application (for employees):**

- Log in with a provisioned account (with Public Key).
- Propose business trips (objective, time, destination, work schedule).
- Receive notifications for new trips; view trip history and statuses.
- Check in/out at business trip locations.
- Real-time GPS tracking with alerts when leaving the assigned area.
- Report and discuss work items with evidence (photos with timestamp + GPS watermark, verified by GnuPG).

**Web application (for managers):**

- Provision accounts for their employees.
- Define new business trips (objective, time, destination, work schedule).
- Assign trips and approve trip proposals.
- Monitor employee locations on the map in real time.
- View trip reports with verified evidence and issue directives/guidance.
- View trip history and statuses; generate statistics by month and year.
