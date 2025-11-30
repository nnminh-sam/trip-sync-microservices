# GnuPG Integration Guide For Backend

---

## SYSTEM OVERVIEW (BACKEND ONLY)

Architecture: Microservices

**User Service**

- Stores user info + GPG public key
- Add user's public key into existing API: /api/v1/users/my
- Database: user_service_db

**Media Service**

- Accepts uploads
- Verifies GPG signature
- Stores media metadata + file
- Database: mediadb

**Flow**

Use Case 1 — Employee Signs Media

1. Postman simulates mobile app
1. Postman signs image/video using its own GPG private key
1. `POST /api/v1/media?trip-id={tripId}&signature={signature}` with:
    Auth: JWT Bearer token
    Payload:
    - file

Use Case 2 — Media Service Verifies Signature

1. Media Service fetches public key from User Service
1. Media Service verifies GPG signature using gpgme or openpgp
1. If valid → save media
1. If invalid → reject

---

## TECHNOLOGY STACK

Backend:

- NestJS
- TypeORM
- MySQL
- openpgp.js (pure JS, simple for verification)
- Multer (file upload)

Database: Use TypeORM syncronization for quick schema update mapping BE's code to DB's schema

GCS integration: Implement GCS upload, add necessary ENV into `example.env` file for Media Service, and will be added later.

Testing: Postman with

- Local GPG keypair
- Pre-request scripts to sign data

---

## FULL IMPLEMENTATION GUIDE (STEP-BY-STEP)

### [DONE] STEP 1 — Create Repos & NestJS Skeletons

Document step 1 at `docs/knowledge`

1.1 Understand User Service codebase at `user-micro`

- Document your knowledge for User Service at `docs/knowledge/user-micro`

1.2 Understand API gateway codebase at `api-gateway`

- Document your knowledge for API Gateway at `docs/knowledge/api-gateway`

1.3 Understand how API is sent to API gateway and then go to User Service as a standard way to communicate in the microservices system

- Document your knowledge for API flow at `docs/knowledge/api-request`

1.4 Initialize codebase for Media Service at `media-service` following the User Service codebase

- Create a guiding document for this task at `docs/guides/media-service/index.md`
- Implement the Create Media Service Guide at `docs/guides/media-service/index.md`

### [DONE] STEP 2 — Update USER SERVICE

Target: Update User Service to store user's public key in `user_service_db` via an API: `PATCH /api/v1/users/my/public-key` with public key is attached inside the API payload. External services can request for the public key via API: `GET /api/v1/users/my` including user's information + public key.

2.1 Update User Entity with public key

Model path: `user-micro/src/models/user.model.ts`

```ts
@Entity()
export class User {
  // Existing properties

  @Column({ type: 'text' })
  publicKey: string;
}
```

2.2 Understand User Service and API gateway:

User Service knowledge: `docs/knowledge/user-micro`
API Gateway knowledge: `docs/knowledge/api-gateway`
API Flow in microservices system: `docs/knowledge/api-request`

2.3 Update User Repository for adding new field into `users` table

2.4 Update User Service for retrieving user's public key

2.5 Update User Controller if necessary


### [PEDNING] STEP 3 — Update MEDIA SERVICE with GCS UPLOAD + GnuPG VERIFICATION logic

3.0 Understand how User Service at `user-micro` communicate with API gateway at `api-gateway` through NATS server

3.1 Initialize Media Service at `media-service` similar to User Service

3.2 Create Media Entity

File path: `media-service/src/models/media.entity.ts`

```ts
@Entity()
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  taskId: string;

  @Column()
  uploaderId: number;

  @Column()
  filename: string;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', length: 100 })
  mimetype: string;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: 'varchar', length: 500 })
  gcsUrl: string;

  @Column({ type: 'varchar', length: 500 })
  publicUrl: string;

  @Column()
  status: string;

  @Column({ type: 'text', nullable: true })
  description?: string;
}
```

3.3 Create Media Upload Service

3.3.3 Implement Media Validation Flow

- Validate owner ship
- Validate role level
- Validate digital signature using GnuPG

3.3.3 Implement Media Upload To GCS Flow

3.4 Create Media Controller

- `GET /api/v1/media?trip-id={tripId}&task-id={taskId}`: Fetch many media files base on the trip ID or the task ID. Since Trip's ID is not stored inside the media model, therefore when trip ID is provided, query trip data from Trip Service for the list of task, check task existence in trip and then check ownership.
- `GET /api/v1/media/{id}`: Fetch media file by it's ID.
- `POST /api/v1/media?trip-id={tripId}`: Upload a media to the the media service.
  - Auth: JWT Bearer token
  - Payload: media file of key `file`

- `DELETE /api/v1/media/{id}`: Delete media by it's ID.

---

## POSTMAN: MOCK MOBILE CLIENT + GPG SIMULATION

Postman can run Node.js inside Pre-Request Script. Use openpgp.js CDN in Postman.

### [PENDING] STEP 4.1 — PREPARE GPG KEYPAIR (IN POSTMAN)

Pre-Request Script

```js
const openpgp = require('openpgp');

pm.environment.set("file", "raw-binary-file-here");

(async () => {
  const { privateKey, publicKey } = await openpgp.generateKey({
    type: 'rsa',
    rsaBits: 2048,
    userIDs: [{ name: 'Employee' }]
  });

  pm.environment.set("pgp_private", privateKey);
  pm.environment.set("pgp_public", publicKey);
})();
```

Run once.

---

### [PENDING] STEP 4.2 — SIGN BEFORE UPLOAD (Pre-request script)

```js
const openpgp = require('openpgp');

(async () => {
  const privateKey = await openpgp.readPrivateKey({ armoredKey: pm.environment.get("pgp_private") });
  const fileBytes = pm.request.body?.file || "dummy";

  const signed = await openpgp.sign({
    message: await openpgp.createMessage({ binary: fileBytes }),
    signingKeys: privateKey,
    detached: true
  });

  pm.variables.set("pgp_signature", signed);
})();
```

Create MOCK API call for testing the upload media file API

---

### [PENDING] STEP 4.3 — End-to-End Test Steps

1. Generate mock private, public key for simulating user's key pair
2. Upload media through Media Service using Postman with
3. Media Service requests `api/v1/users/my/public-key`
4. Media Service verifies signature
5. Store file + DB record
6. Return API response
