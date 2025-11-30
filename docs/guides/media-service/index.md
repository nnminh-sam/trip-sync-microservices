# Media Service Implementation Guide

## Overview

The Media Service is a NestJS microservice responsible for:
- Accepting file uploads from authenticated users
- Storing media metadata in MySQL database
- Verifying GPG digital signatures on uploaded files
- Managing media files and providing retrieval endpoints

**Location**: `media-service/src`

**Database**: MySQL (`media_service_db`)

**Communication**: HTTP (REST) + NATS (RPC)

---

## Step 1: Setup & Prerequisites

### 1.1 Environment Variables

Create `.env` file in `media-service/` root:

```env
APP_PORT=3002
APP_NAME=media-service
NODE_ENV=development

NATS_SERVER=nats://localhost:4222

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=media_service_db

LOG_LEVEL=debug
```

### 1.2 Install Dependencies

```bash
cd media-service
npm install
npm install @nestjs/core @nestjs/common @nestjs/microservices @nestjs/config @nestjs/typeorm typeorm mysql2 joi class-validator class-transformer
```

### 1.3 Optional: GPG/OpenPGP Dependencies (for Step 3.3.3)

```bash
npm install openpgp multer
npm install -D @types/express
```

---

## Step 2: Architecture Overview

### 2.1 Directory Structure

The media-service follows the same pattern as user-micro:

```
media-service/src/
├── main.ts                           # Entry point
├── app.module.ts                     # Root module
├── app.controller.ts                 # Health check
├── config/
│   ├── configuration.ts              # Joi validation
│   └── index.ts
├── client/
│   ├── client.module.ts
│   └── clients.ts
├── database/
│   └── database.module.ts
├── models/
│   ├── base.model.ts               # Base entity
│   ├── media.model.ts              # Media entity
│   └── index.ts
├── dtos/
│   └── message-payload.dto.ts
├── modules/
│   └── media/
│       ├── media.module.ts
│       ├── media.controller.ts      # RPC handlers
│       ├── media.service.ts         # Business logic
│       ├── media-message.pattern.ts
│       └── dtos/
│           ├── create-media.dto.ts
│           ├── update-media.dto.ts
│           ├── filter-media.dto.ts
│           └── index.ts
└── utils/
```

### 2.2 Data Model

**Media Entity** (`media-service/src/models/media.model.ts`):

The Media entity extends BaseModel to inherit UUID ID, timestamps, and soft delete support. Key fields include:
- `filename`: Storage filename
- `originalName`: Original uploaded filename
- `mimetype`: MIME type (image/jpeg, video/mp4, etc)
- `uploaderId`: User who uploaded the file
- `taskId`: Optional associated task
- `status`: 'uploaded', 'verified', or 'failed'
- `signatureVerified`: GPG signature verification status
- `signatureData`: GPG signature (detached)

---

## Step 3: RPC Endpoints

The Media Service exposes RPC endpoints via NATS for API Gateway to call.

### 3.1 Message Patterns Defined

Located in `media-message.pattern.ts`:
- `media.find.id`: Get media by ID
- `media.find`: Get all media (filtered)
- `media.find.task`: Get media by task ID
- `media.create`: Create new media record
- `media.update`: Update media record
- `media.delete`: Delete media (soft delete)
- `media.signature.verify`: Verify GPG signature

### 3.2 Controller Implementation

All handlers in `media.controller.ts` use `@MessagePattern` decorator to handle RPC calls from API Gateway:

```typescript
@MessagePattern(MediaMessagePattern.findById)
async findById(@Payload() payload: MessagePayloadDto) { ... }

@MessagePattern(MediaMessagePattern.create)
async create(@Payload() payload: MessagePayloadDto<CreateMediaDto>) { ... }
```

### 3.3 Service Implementation

The `media.service.ts` contains business logic:
- `findById()`: Query by media ID
- `findAll()`: Query with filtering, pagination
- `findByTaskId()`: Query by task ID
- `create()`: Create new media record
- `update()`: Update existing media
- `delete()`: Soft delete media

---

## Step 3.3.3: GPG Signature Verification (Future Implementation)

The signature verification feature will involve:

1. **Get User's Public Key**: Call user-micro via NATS to fetch uploader's public key
2. **Verify Signature**: Use openpgp.js library to verify digital signature
3. **Update Status**: Mark media as verified or failed

Prerequisites:
- User Service must store and expose public keys
- openpgp.js dependency installed
- File binary data accessible for verification

---

## Step 4: API Gateway Integration

When implemented, the API Gateway will:

1. Expose HTTP endpoints at `/api/v1/media`
2. Receive requests from clients
3. Send RPC calls to media-service via NATS
4. Return wrapped responses to clients

Gateway modules:
- `MediaService`: Handles RPC delegation
- `MediaController`: Exposes HTTP endpoints

---

## Step 5: Running the Service

### 5.1 Start Media Service

```bash
cd media-service
npm run start:dev
```

Expected output:
```
Media Service running on port 3002
NATS Server: nats://localhost:4222
```

### 5.2 Verify Service Health

```bash
curl http://localhost:3002/health
# Response: {"status":"ok","service":"media-service"}
```

### 5.3 Verify Database

Check MySQL for `media` table:
```bash
mysql -u root -p media_service_db
mysql> SHOW TABLES;
mysql> DESC media;
```

---

## Database Schema

The `media` table includes:
- **id** (UUID, Primary Key)
- **filename** (varchar)
- **originalName** (varchar)
- **mimetype** (varchar)
- **size** (int)
- **gcsUrl** (varchar)
- **publicUrl** (varchar)
- **uploaderId** (uuid, Foreign Key to users.id)
- **taskId** (uuid, optional)
- **status** (varchar)
- **description** (text, nullable)
- **signatureVerified** (boolean)
- **signatureData** (text, nullable)
- **createdAt** (timestamp)
- **updatedAt** (timestamp)
- **deletedAt** (timestamp, nullable - soft delete)

---

## Common Issues & Solutions

### NATS Connection Failed
- Verify NATS server is running
- Check `NATS_SERVER` environment variable
- Ensure correct host and port

### Media Table Not Found
- TypeORM auto-sync is enabled (`synchronize: true`)
- Tables should be created on startup
- Check MySQL logs if creation failed

### RPC Timeout
- Media service is not responding
- Check service logs for errors
- Verify database connection

---

## File Structure Reference

| File | Purpose |
|------|---------|
| `main.ts` | Entry point with HTTP + NATS bootstrap |
| `app.module.ts` | Root NestJS module |
| `app.controller.ts` | Health check endpoint |
| `config/configuration.ts` | Environment validation with Joi |
| `client/clients.ts` | NATS client configuration |
| `database/database.module.ts` | TypeORM MySQL setup |
| `models/media.model.ts` | Media entity definition |
| `modules/media/media.controller.ts` | RPC message handlers |
| `modules/media/media.service.ts` | Business logic and queries |
| `modules/media/media-message.pattern.ts` | RPC pattern definitions |

---

## Key Implementation Notes

1. **RPC Pattern**: Uses `@MessagePattern` decorators with NATS
2. **Message Envelope**: All RPC calls wrapped in `MessagePayloadDto`
3. **Soft Delete**: Uses TypeORM's `softDelete()` to preserve audit trail
4. **Repository Pattern**: `@InjectRepository()` for database access
5. **Module System**: Each feature encapsulated in its own module

---

## Next Implementation Steps

1. Install dependencies (`npm install`)
2. Set up `.env` file with database credentials
3. Start service and verify NATS connection
4. Create migration scripts if needed
5. Implement API Gateway integration
6. Add file upload handling with Multer
7. Integrate Google Cloud Storage
8. Implement GPG signature verification
