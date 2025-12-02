# Media Service - Standalone HTTP Server Implementation Guide

## Overview

This guide describes how to implement the Media Service as a **standalone HTTP REST server** with public APIs for uploading and fetching media files. The service exposes four main endpoints for media management.

**Location**: `media-service/src`

**Database**: MySQL (`media_service_db`)

**Server Type**: Standalone HTTP (REST) - Not via NATS RPC

### API Version History

**v1.2 (Current)** - Added Signed URL View Endpoint with Private GCS Bucket
- New endpoint: `GET /api/v1/media/{id}/view-url` - Generate signed URL for private GCS access
- GCS bucket is kept **privately** (not publicly readable)
- Signed URLs are time-limited and user-specific for security
- Only authenticated users can request signed URLs
- Authorization check: User must be the uploader or have admin permissions

**v1.1** - Updated Upload Endpoint with GnuPG Signature Verification
- Upload endpoint changed from `POST /api/v1/media?trip-id={tripId}` to `POST /api/v1/media?task-id={taskId}`
- Multipart form fields now include: `file`, `signature` (ASCII-armored), `originalFilename`, `mimetype`
- Signature verification is **synchronous** (blocking) - happens before upload
- Media status is set to `verified` upon successful signature verification
- Trip-based upload removed (task-based upload replaces it)
- GET endpoints for media remain unchanged and still support trip-based queries

**v1.0** - Initial Implementation
- Upload endpoint: `POST /api/v1/media?trip-id={tripId}`
- Async signature verification (non-blocking)

---

## Quick Reference: API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/media?task-id={taskId}` | Fetch multiple media files | Optional |
| GET | `/api/v1/media/{id}` | Fetch single media file by ID | Optional |
| GET | `/api/v1/media/{id}/view-url` | Generate signed URL for private GCS access | Required (JWT) |
| POST | `/api/v1/media?task-id={taskId}` | Upload new media file with GnuPG signature | Required (JWT) |
| DELETE | `/api/v1/media/{id}` | Delete media file by ID | Required (JWT) |

---

## Setup & Prerequisites

### 1.1 Environment Variables

Create `.env` file in `media-service/` root:

```bash
APP_PORT=3002
APP_NAME=media-service
NODE_ENV=development

NATS_SERVER=nats://localhost:4222

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=media_service_db

API_GATEWAY_BASE_URL=api-gateway-base-url

GCS_PROJECT_ID=your-gcp-project-id
GCS_BUCKET_NAME=your-gcs-bucket-name

LOG_LEVEL=debug

```

### 1.2 Install Dependencies

```bash
cd media-service
npm install

# Core dependencies
npm install @nestjs/core @nestjs/common @nestjs/config @nestjs/typeorm typeorm mysql2

# HTTP & File Upload
npm install @nestjs/platform-express multer

# JWT Authentication
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install -D @types/passport-jwt

# Validation
npm install joi class-validator class-transformer

# GPG Signature Verification
npm install openpgp

# HTTP Client (for calling external services)
npm install axios
```

---

## Architecture Overview

### 2.1 Directory Structure

```
media-service/src/
├── main.ts                              # Entry point (HTTP server)
├── app.module.ts                        # Root module
├── app.controller.ts                    # Health check endpoint
│
├── config/
│   ├── configuration.ts                 # Environment validation
│   └── index.ts
│
├── auth/
│   ├── jwt.strategy.ts                  # JWT authentication strategy
│   ├── jwt.guard.ts                     # JWT guard decorator
│   └── auth.module.ts
│
├── database/
│   └── database.module.ts               # TypeORM MySQL configuration
│
├── models/
│   ├── base.model.ts                    # Base entity
│   ├── media.model.ts                   # Media entity
│   └── index.ts
│
├── dtos/
│   ├── create-media.dto.ts              # Request DTO
│   ├── update-media.dto.ts              # Request DTO
│   ├── filter-media.dto.ts              # Query parameters DTO
│   ├── media-response.dto.ts            # Response DTO
│   └── index.ts
│
├── modules/
│   └── media/
│       ├── media.module.ts
│       ├── media.controller.ts          # HTTP request handlers
│       ├── media.service.ts             # Business logic
│       │
│       └── services/
│           ├── media-upload.service.ts  # File upload & GCS handling
│           ├── gcs-upload.service.ts    # Google Cloud Storage operations
│           ├── gnupg-verification.service.ts  # GPG signature validation
│           └── trip-service.client.ts   # Trip Service HTTP client
│
└── common/
    ├── filters/
    │   └── http-exception.filter.ts     # Global exception handling
    └── interceptors/
        └── response.interceptor.ts      # Response formatting
```

### 2.2 Data Model

**Media Entity** (`media-service/src/models/media.model.ts`):

```typescript
@Entity('media')
export class Media extends BaseModel {
  @Column({ type: 'varchar', length: 255 })
  filename: string;                       // Storage filename on GCS

  @Column({ type: 'varchar', length: 255 })
  originalName: string;                   // Original uploaded filename

  @Column({ type: 'varchar', length: 100 })
  mimetype: string;                       // MIME type (image/jpeg, etc)

  @Column({ type: 'int' })
  size: number;                           // File size in bytes

  @Column({ type: 'varchar', length: 500 })
  gcsUrl: string;                         // GCS storage URL

  @Column({ type: 'varchar', length: 500 })
  publicUrl: string;                      // Public accessible URL

  @Column({ type: 'uuid' })
  uploaderId: string;                     // User who uploaded (from JWT)

  @Column({ type: 'uuid', nullable: true })
  taskId?: string;                        // Associated task ID

  @Column({ type: 'varchar', length: 50 })
  status: string;                         // 'uploaded', 'verified', 'failed'

  @Column({ type: 'text', nullable: true })
  description?: string;                   // Optional description

  @Column({ type: 'boolean', default: false })
  signatureVerified: boolean;              // GPG signature verification status

  @Column({ type: 'text', nullable: true })
  signatureData?: string;                 // GPG signature (detached)
}
```

---

## HTTP Endpoints Implementation

### 3.1 Main Controller - Media HTTP Handler

Create `media-service/src/modules/media/media.controller.ts`:

---

## Service & Support Classes

### 4.1 Media Service (Business Logic)

File path: `media-service/src/modules/media/media.service.ts`


### 4.2 Media Upload Service

File path: `media-service/src/modules/media/services/media-upload.service.ts`

This service orchestrates the upload process including GCS upload and signature verification:

```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { GcsUploadService } from './gcs-upload.service';
import { GnuPgVerificationService } from './gnupg-verification.service';
import { TripServiceClient } from './trip-service.client';
import { MediaService } from '../media.service';

export interface MediaUploadRequest {
  uploaderId: string;
  taskId: string;
  signature?: string;
}

@Injectable()
export class MediaUploadService {
  private readonly logger = new Logger(MediaUploadService.name);

  constructor(
    private readonly mediaService: MediaService,
    private readonly gcsUploadService: GcsUploadService,
    private readonly gnupgService: GnuPgVerificationService,
    private readonly tripServiceClient: TripServiceClient,
  ) {}

  /**
   * Upload media with GnuPG signature verification (synchronous).
   *
   * Process:
   * 1. Validate file and signature
   * 2. Verify GnuPG signature against file buffer
   * 3. Upload file to GCS
   * 4. Create media record in database
   * 5. Mark signature as verified
   * 6. Return created media object
   *
   * Note: Signature verification happens BEFORE upload to ensure file authenticity.
   */
  async uploadMediaWithSignature(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
    fileSize: number,
    uploadRequest: MediaUploadRequest,
  ): Promise<{ success: boolean; media?: any; error?: string }> {
    try {
      // Validate file
      this.validateFile(fileBuffer, fileSize, mimetype);

      if (!uploadRequest.signature) {
        return {
          success: false,
          error: 'GnuPG signature is required for verification',
        };
      }

      // Verify GnuPG signature (blocking - must succeed before upload)
      const signatureValidation = await this.gnupgService.verifySignature(
        fileBuffer,
        uploadRequest.signature,
      );

      if (!signatureValidation.isValid) {
        return {
          success: false,
          error: `Signature verification failed: ${signatureValidation.error}`,
        };
      }

      // Upload file to GCS
      const gcsResult = await this.gcsUploadService.uploadFile(fileBuffer, filename);

      if (!gcsResult.success) {
        return {
          success: false,
          error: `GCS upload failed: ${gcsResult.error}`,
        };
      }

      // Create media record with signature verified flag
      const media = await this.mediaService.create({
        filename: gcsResult.filename,
        originalName: filename,
        mimetype,
        size: fileSize,
        gcsUrl: gcsResult.gcsUrl,
        publicUrl: gcsResult.publicUrl,
        uploaderId: uploadRequest.uploaderId,
        taskId: uploadRequest.taskId,
        status: 'verified',
        signatureVerified: true,
        signatureData: uploadRequest.signature,
      });

      return {
        success: true,
        media,
      };
    } catch (error) {
      this.logger.error(`Upload with signature verification failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Legacy: Upload media without signature verification (async).
   *
   * Deprecated - use uploadMediaWithSignature() instead.
   * Kept for backward compatibility.
   */
  async uploadMedia(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
    fileSize: number,
    uploadRequest: MediaUploadRequest,
  ): Promise<{ success: boolean; media?: any; error?: string }> {
    try {
      // Validate file
      this.validateFile(fileBuffer, fileSize, mimetype);

      // Upload file to GCS
      const gcsResult = await this.gcsUploadService.uploadFile(fileBuffer, filename);

      if (!gcsResult.success) {
        return {
          success: false,
          error: `GCS upload failed: ${gcsResult.error}`,
        };
      }

      // Create media record
      const media = await this.mediaService.create({
        filename: gcsResult.filename,
        originalName: filename,
        mimetype,
        size: fileSize,
        gcsUrl: gcsResult.gcsUrl,
        publicUrl: gcsResult.publicUrl,
        uploaderId: uploadRequest.uploaderId,
        taskId: uploadRequest.taskId,
        status: 'uploaded',
        signatureVerified: false,
      });

      // Verify signature asynchronously (non-blocking)
      if (uploadRequest.signature) {
        this.verifySignatureAsync(media.id, fileBuffer, uploadRequest.signature);
      }

      return {
        success: true,
        media,
      };
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Find media by trip ID:
   * 1. Query trip data from Trip Service
   * 2. Get all tasks in the trip
   * 3. Find all media for those tasks
   * 4. Return with pagination
   */
  async findMediaByTripId(tripId: string): Promise<any> {
    try {
      const tasks = await this.tripServiceClient.getTasksByTripId(tripId);

      if (!tasks || tasks.length === 0) {
        return { data: [], total: 0 };
      }

      const taskIds = tasks.map(t => t.id);
      const mediaList = [];

      for (const taskId of taskIds) {
        const media = await this.mediaService.findByTaskId(taskId);
        mediaList.push(...media);
      }

      return {
        data: mediaList,
        total: mediaList.length,
      };
    } catch (error) {
      this.logger.error(`Failed to find media by trip: ${error.message}`);
      return { data: [], total: 0 };
    }
  }

  /**
   * Delete media from GCS storage
   */
  async deleteFromGCS(filename: string): Promise<void> {
    try {
      await this.gcsUploadService.deleteFile(filename);
    } catch (error) {
      this.logger.warn(`Failed to delete from GCS: ${error.message}`);
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(buffer: Buffer, size: number, mimetype: string): void {
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (size > maxSize) {
      throw new BadRequestException(`File size exceeds maximum of 50MB`);
    }

    // Check file type (images and videos)
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
    ];

    if (!allowedMimes.includes(mimetype)) {
      throw new BadRequestException(
        `File type ${mimetype} not allowed. Allowed: ${allowedMimes.join(', ')}`,
      );
    }
  }

  /**
   * Verify GPG signature asynchronously (non-blocking, legacy)
   */
  private async verifySignatureAsync(mediaId: string, fileBuffer: Buffer, signature: string): Promise<void> {
    try {
      // This runs in background without blocking response
      setImmediate(async () => {
        const validation = await this.gnupgService.verifySignature(
          fileBuffer,
          signature,
        );

        if (validation.isValid) {
          await this.mediaService.update(mediaId, {
            signatureVerified: true,
            status: 'verified',
            signatureData: signature,
          });
        }
      });
    } catch (error) {
      this.logger.warn(`Signature verification failed: ${error.message}`);
    }
  }
}
```

### 4.3 GCS Upload Service

File path: `media-service/src/modules/media/services/gcs-upload.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class GcsUploadService {
  private readonly logger = new Logger(GcsUploadService.name);
  private readonly gcs: Storage;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    const keyFilePath = this.configService.get('GCS_KEY_FILE_PATH');
    const projectId = this.configService.get('GCS_PROJECT_ID');

    this.gcs = new Storage({
      projectId,
      keyFilename: keyFilePath,
    });

    this.bucketName = this.configService.get('GCS_BUCKET_NAME');
  }

  async uploadFile(
    buffer: Buffer,
    originalFilename: string,
  ): Promise<{ success: boolean; filename?: string; gcsUrl?: string; publicUrl?: string; error?: string }> {
    try {
      const bucket = this.gcs.bucket(this.bucketName);

      // Generate unique filename
      const filename = `${Date.now()}-${originalFilename}`;
      const file = bucket.file(filename);

      await file.save(buffer);

      // Make file public (if needed)
      await file.makePublic();

      const gcsUrl = `gs://${this.bucketName}/${filename}`;
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${filename}`;

      this.logger.debug(`Uploaded file to GCS: ${publicUrl}`);

      return {
        success: true,
        filename,
        gcsUrl,
        publicUrl,
      };
    } catch (error) {
      this.logger.error(`GCS upload failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const bucket = this.gcs.bucket(this.bucketName);
      const file = bucket.file(filename);
      await file.delete();
      this.logger.debug(`Deleted file from GCS: ${filename}`);
    } catch (error) {
      this.logger.error(`GCS delete failed: ${error.message}`);
      throw error;
    }
  }

  async getFileUrl(filename: string): Promise<string> {
    return `https://storage.googleapis.com/${this.bucketName}/${filename}`;
  }
}
```

Note: Install GCS client:
```bash
npm install @google-cloud/storage
```

### 4.5 GnuPG Verification Service

File path: `media-service/src/modules/media/services/gnupg-verification.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as openpgp from 'openpgp';

@Injectable()
export class GnuPgVerificationService {
  private readonly logger = new Logger(GnuPgVerificationService.name);

  constructor(private readonly userServiceUrl: string) {}

  /**
   * Verify GnuPG signature on uploaded media file
   *
   * Process:
   * 1. Receive file buffer and ASCII-armored signature
   * 2. Read the signature using openpgp.js
   * 3. Verify signature against file buffer
   * 4. Return validation result with signer key ID
   *
   * Note: Requires openpgp.js library for signature verification.
   * Public keys are fetched from User Service during verification.
   */
  async verifySignature(
    fileBuffer: Buffer,
    armoredSignature: string,
  ): Promise<{ isValid: boolean; signerKeyId?: string; error?: string }> {
    try {
      this.logger.debug(`Verifying GnuPG signature for uploaded file`);

      // Parse the ASCII-armored signature
      const signature = await openpgp.readSignature({
        armoredSignature: armoredSignature,
      });

      // Read the file as a message
      const message = await openpgp.readMessage({
        binaryMessage: fileBuffer,
      });

      // Extract signer key ID from signature
      const signerKeyId = signature.getSigningKeyIDs()[0]?.toHex() || 'unknown';

      // Fetch signer's public key from User Service
      // Note: Implement getUserPublicKey() to fetch from user-micro service
      const publicKeys = await this.fetchPublicKeysForVerification(signerKeyId);

      if (!publicKeys || publicKeys.length === 0) {
        return {
          isValid: false,
          error: `No public key found for signer ${signerKeyId}`,
        };
      }

      // Verify the signature
      const verificationResult = await openpgp.verify({
        message,
        signature,
        verificationKeys: publicKeys,
      });

      const verified = verificationResult.signatures.some(sig => sig.valid);

      if (!verified) {
        return {
          isValid: false,
          signerKeyId,
          error: 'Signature verification failed - invalid signature',
        };
      }

      this.logger.debug(`Signature verified successfully for key ${signerKeyId}`);

      return {
        isValid: true,
        signerKeyId,
      };
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error.message}`);
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Fetch public keys for a specific signer from User Service
   */
  private async fetchPublicKeysForVerification(signerKeyId: string): Promise<any[]> {
    try {
      // Call User Service endpoint to fetch public key
      // GET /api/v1/users/public-keys/{keyId}
      // Returns: { publicKey: string, keyId: string, userId: string, ... }

      // For now, return empty - implement based on user-micro API
      return [];
    } catch (error) {
      this.logger.error(`Failed to fetch public key for ${signerKeyId}: ${error.message}`);
      return [];
    }
  }
}
```

---

## Request/Response DTOs

### 5.1 Query Parameters DTO

File path: `media-service/src/dtos/filter-media.dto.ts`

```typescript
export class FilterMediaDto {
  taskId?: string;        // Filter by task ID
  uploaderId?: string;    // Filter by uploader
  status?: string;        // Filter by status
  page?: number;          // Pagination page
  pageSize?: number;      // Pagination size
}
```

### 5.2 Response DTO

File path: `media-service/src/dtos/media-response.dto.ts`

```typescript
export class MediaResponseDto {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  gcsUrl: string;
  publicUrl: string;
  uploaderId: string;
  taskId?: string;
  status: string;
  description?: string;
  signatureVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Authentication & Authorization

### 6.1 API Gateway Authentication Flow

The Media Service authenticates and authorizes requests through the API Gateway. The flow works as follows:

1. **Client sends request** with Bearer JWT token in `Authorization` header
2. **API Gateway authorization** - Forward token to API Gateway's `/api/v1/auth/authorize-request` endpoint
3. **Authorization check** - Gateway verifies roles and permissions
4. **User attached to request** - User info (sub, email, roles) attached to request context

### 6.2 Environment Configuration

Add to `.env`:
```env
API_GATEWAY_BASE_URL=http://localhost:80
```

### 6.3 API Gateway Client Service

File: `media-service/src/auth/api-gateway.client.ts`

This service handles HTTP communication with the API Gateway for authorization verification.

```typescript
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ApiGatewayClient {
  private readonly logger = new Logger(ApiGatewayClient.name);
  private readonly authorizationEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    const apiGatewayUrl = this.configService.get('auth.apiGatewayUrl');
    this.authorizationEndpoint = `${apiGatewayUrl}/api/v1/auth/authorize-request`;
  }

  async authorizeRequest(
    token: string,
    authRequest: { roles: string[]; action: string; resource: string }
  ): Promise<any> {
    try {
      const response = await axios.post(this.authorizationEndpoint, authRequest, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        throw new UnauthorizedException('Unauthorized: Invalid or expired token');
      }
      throw new UnauthorizedException('Authorization service unavailable');
    }
  }
}
```

### 6.4 API Gateway Guard

File: `media-service/src/auth/api-gateway.guard.ts`

This guard verifies JWT tokens and authorizes requests via the API Gateway.

### 6.6 Global Exception Filter

File: `media-service/src/common/filters/http-exception.filter.ts`

Handles all HTTP exceptions and returns consistent error responses.

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      statusCode: status,
      message: exception.message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url}`, exception);
    } else if (status >= 400) {
      this.logger.warn(`${request.method} ${request.url} - ${status}`);
    }

    response.status(status).json(errorResponse);
  }
}
```

Register in `app.module.ts`:
```typescript
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  // ...
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

### 6.7 Error Response Examples

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized: Invalid or expired token",
  "path": "/api/v1/media",
  "method": "POST",
  "timestamp": "2025-11-30T16:51:37.418Z"
}
```

**403 Forbidden (Ownership Check):**
```json
{
  "statusCode": 403,
  "message": "You do not have permission to delete this media",
  "path": "/api/v1/media/123",
  "method": "DELETE",
  "timestamp": "2025-11-30T16:51:37.418Z"
}
```

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "No file uploaded. Expected form field: \"file\"",
  "path": "/api/v1/media",
  "method": "POST",
  "timestamp": "2025-11-30T16:51:37.418Z"
}
```


---

## Module Configuration

### 7.1 Update Media Module

File path: `media-service/src/modules/media/media.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from '../../models';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import {
  GnuPgVerificationService,
  GcsUploadService,
  MediaUploadService,
  TripServiceClient,
} from './services';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media]),
    AuthModule,
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
    GnuPgVerificationService,
    GcsUploadService,
    MediaUploadService,
    TripServiceClient,
  ],
  exports: [MediaService],
})
export class MediaModule {}
```

### 7.2 Update App Module

File path: `media-service/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { validationSchema, configuration } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { MediaModule } from './modules/media/media.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      validationSchema,
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    MediaModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
```

---

## Running the Service

### 8.1 Start Media Service

```bash
cd media-service
npm run start:dev
```

Expected output:
```
[NestFactory] Starting Nest application...
[InstanceLoader] AuthModule dependencies initialized
[InstanceLoader] DatabaseModule dependencies initialized
[InstanceLoader] MediaModule dependencies initialized
[RoutesResolver] AppController {...}
[RoutesResolver] MediaController {...}
[NestApplication] Nest application successfully started
Media Service listening on port 3002
```

### 8.2 Verify Service Health

```bash
curl http://localhost:3002/health
# Response: {"status":"ok","service":"media-service"}
```

### 8.3 Test API Endpoints

#### Upload Media with GnuPG Signature (POST)
```bash
curl -X POST http://localhost:3002/api/v1/media?task-id=task-456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "signature=@/path/to/image.jpg.asc" \
  -F "originalFilename=image.jpg" \
  -F "mimetype=image/jpeg"
```

Note: The signature should be an ASCII-armored GnuPG detached signature (`.asc` file).

#### Fetch Single Media (GET)
```bash
curl http://localhost:3002/api/v1/media/media-id-123
```

#### Fetch by Task ID (GET)
```bash
curl "http://localhost:3002/api/v1/media?task-id=task-456"
```

#### Fetch by Trip ID (GET)
```bash
curl "http://localhost:3002/api/v1/media?trip-id=trip-123"
```

#### Delete Media (DELETE)
```bash
curl -X DELETE http://localhost:3002/api/v1/media/media-id-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Signed URL for Private Media (GET)
```bash
curl -X GET http://localhost:3002/api/v1/media/media-id-123/view-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response (200 OK):
```json
{
  "id": "media-id-123",
  "filename": "1234567890-image.jpg",
  "originalName": "image.jpg",
  "mimetype": "image/jpeg",
  "size": 2048576,
  "signedUrl": "https://storage.googleapis.com/bucket-name/1234567890-image.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=...",
  "expiresIn": 3600,
  "expiresAt": "2025-12-01T04:14:19.533Z",
  "message": "Signed URL valid for 1 hour"
}
```

---

## Signed URL Endpoint (GET /api/v1/media/{id}/view-url)

### Overview

The signed URL endpoint generates temporary, authenticated URLs for accessing private media files stored in GCS. This approach provides several security benefits:

1. **Private Bucket** - GCS bucket is not publicly readable
2. **Time-Limited** - URLs expire after a configurable time (default 1 hour)
3. **User-Specific** - Only authenticated users can request signed URLs
4. **Authorization Checks** - User must own the media or have admin permissions
5. **Audit Trail** - All signed URL requests can be logged for security monitoring

### Request

**Endpoint**: `GET /api/v1/media/{id}/view-url`

**Authentication**: Required (JWT Bearer token)

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Path Parameters**:
- `id` (required, string) - Media file ID (UUID)

**Query Parameters** (optional):
- `expiresIn` (optional, number) - URL expiration time in seconds (default: 3600, max: 86400)

### Response

**Success (200 OK)**:
```json
{
  "id": "146171cb-7fd9-40c1-b0ea-050f6859cbff",
  "filename": "1702520059424-sample-image.jpg",
  "originalName": "sample-image.jpg",
  "mimetype": "image/jpeg",
  "size": 2048576,
  "signedUrl": "https://storage.googleapis.com/trip-sync-media/1702520059424-sample-image.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=...&X-Goog-Date=20251201T031419Z&X-Goog-Expires=3600&X-Goog-SignedHeaders=host&X-Goog-Signature=...",
  "expiresIn": 3600,
  "expiresAt": "2025-12-01T04:14:19.533Z",
  "message": "Signed URL valid for 1 hour. Use this URL to access the media file."
}
```

**Authorization Error (403 Forbidden)**:
```json
{
  "statusCode": 403,
  "message": "You do not have permission to access this media",
  "path": "/api/v1/media/media-id-123/view-url",
  "method": "GET",
  "timestamp": "2025-12-01T03:14:19.533Z"
}
```

**Not Found (404)**:
```json
{
  "statusCode": 404,
  "message": "Media with ID media-id-123 not found",
  "path": "/api/v1/media/media-id-123/view-url",
  "method": "GET",
  "timestamp": "2025-12-01T03:14:19.533Z"
}
```

### Implementation Details

#### Controller Method

File: `media-service/src/modules/media/media.controller.ts`

```typescript
@Get(':id/view-url')
@UseGuards(ApiGatewayGuard)
async getSignedUrl(
  @Param('id') id: string,
  @Query('expiresIn') expiresIn?: number,
  @Req() req: any,
) {
  this.logger.debug(`Requesting signed URL for media ${id}`);

  // Get media by ID
  const media = await this.mediaService.findById(id);

  if (!media) {
    throw new NotFoundException(`Media with ID ${id} not found`);
  }

  // Authorization check: User must be uploader or admin
  // Extract user role from JWT claims (via API Gateway Guard)
  if (media.uploaderId !== req.user.sub && req.user.role !== 'admin') {
    throw new ForbiddenException('You do not have permission to access this media');
  }

  // Generate signed URL
  const result = await this.mediaUploadService.generateSignedUrl(
    media.filename,
    expiresIn || 3600, // Default 1 hour
  );

  if (!result.success) {
    throw new BadRequestException(`Failed to generate signed URL: ${result.error}`);
  }

  return {
    id: media.id,
    filename: media.filename,
    originalName: media.originalName,
    mimetype: media.mimetype,
    size: media.size,
    signedUrl: result.signedUrl,
    expiresIn: result.expiresIn,
    expiresAt: result.expiresAt,
    message: `Signed URL valid for ${result.expiresIn / 3600} hour(s). Use this URL to access the media file.`,
  };
}
```

#### Media Upload Service Method

File: `media-service/src/modules/media/services/media-upload.service.ts`

```typescript
/**
 * Generate a signed URL for accessing private GCS files
 *
 * @param filename - Storage filename in GCS
 * @param expiresIn - URL expiration time in seconds (default 3600)
 * @returns Signed URL with expiration info
 */
async generateSignedUrl(
  filename: string,
  expiresIn: number = 3600,
): Promise<{
  success: boolean;
  signedUrl?: string;
  expiresIn?: number;
  expiresAt?: string;
  error?: string;
}> {
  try {
    // Validate expiration time (max 24 hours)
    const maxExpiry = 86400; // 24 hours in seconds
    if (expiresIn > maxExpiry) {
      expiresIn = maxExpiry;
    }

    if (expiresIn < 60) {
      expiresIn = 60; // Minimum 1 minute
    }

    // Generate signed URL via GCS service
    const result = await this.gcsUploadService.generateSignedUrl(
      filename,
      expiresIn,
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      signedUrl: result.signedUrl,
      expiresIn,
      expiresAt: result.expiresAt,
    };
  } catch (error) {
    this.logger.error(`Failed to generate signed URL: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}
```

#### GCS Upload Service Method

File: `media-service/src/modules/media/services/gcs-upload.service.ts`

```typescript
/**
 * Generate a signed URL for accessing private GCS files
 *
 * Signed URLs provide time-limited access to private files without exposing credentials.
 * This allows clients to download files directly from GCS without going through our server.
 *
 * @param filename - Storage filename in GCS
 * @param expiresIn - URL expiration time in seconds
 * @returns Signed URL with metadata
 */
async generateSignedUrl(
  filename: string,
  expiresIn: number = 3600,
): Promise<{
  success: boolean;
  signedUrl?: string;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const bucket = this.gcs.bucket(this.bucketName);
    const file = bucket.file(filename);

    // Generate signed URL with expiration
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresIn * 1000,
    });

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    this.logger.debug(`Generated signed URL for ${filename}, expires in ${expiresIn}s`);

    return {
      success: true,
      signedUrl,
      expiresAt,
    };
  } catch (error) {
    this.logger.error(`Failed to generate signed URL for ${filename}: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### GCS Bucket Configuration (Private)

To keep the GCS bucket private, follow these steps:

**1. Create Private Bucket**:
```bash
gsutil mb -c STANDARD -l us-central1 gs://trip-sync-media
```

**2. Remove Public Access**:
```bash
gsutil iam ch -d allUsers gs://trip-sync-media
gsutil iam ch -d allAuthenticatedUsers gs://trip-sync-media
```

**3. Grant Service Account Access**:
```bash
# Get your service account email
SERVICE_ACCOUNT="your-service-account@project.iam.gserviceaccount.com"

# Grant Storage Object Admin role
gsutil iam ch serviceAccount:$SERVICE_ACCOUNT:objectAdmin gs://trip-sync-media
```

**4. Verify Bucket is Private**:
```bash
# This should fail with 403 Forbidden
curl "https://storage.googleapis.com/trip-sync-media/test.txt"

# This should work with signed URL
curl "<SIGNED_URL>"
```

### Security Considerations

1. **Time Limits** - URLs expire after configured time (default 1 hour, max 24 hours)
2. **User Authorization** - Only media owners or admins can request signed URLs
3. **Private Bucket** - Files are not publicly accessible without valid signed URL
4. **Audit Trail** - Log all signed URL requests for compliance
5. **IP Restrictions** (Optional) - Add IP whitelist to signed URL generation for additional security
6. **Rate Limiting** - Implement rate limiting on signed URL requests to prevent abuse

### Usage Examples

#### JavaScript/Node.js
```javascript
// Get signed URL from Media Service
const response = await fetch(
  'http://localhost:3002/api/v1/media/media-id-123/view-url',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
    },
  }
);

const data = await response.json();

// Use signed URL directly (no auth needed)
const mediaResponse = await fetch(data.signedUrl);
const file = await mediaResponse.blob();

// Display in image element
const imageUrl = data.signedUrl;
document.getElementById('image').src = imageUrl;
```

#### cURL
```bash
# Request signed URL
SIGNED_URL=$(curl -s -X GET http://localhost:3002/api/v1/media/media-id-123/view-url \
  -H "Authorization: Bearer $JWT_TOKEN" | jq -r '.signedUrl')

# Download media using signed URL
curl "$SIGNED_URL" -o downloaded-media.jpg
```

#### Using with Images
```html
<img src="<SIGNED_URL>" alt="Media from GCS">
```

---

## Error Handling

The service returns standard HTTP status codes:

| Status | Scenario |
|--------|----------|
| 200 | Success |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (validation, ownership) |
| 401 | Unauthorized (missing/invalid JWT) |
| 403 | Forbidden (permission denied) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Internal Server Error |

---

## Database Schema

The `media` table includes:

```sql
CREATE TABLE media (
  id UUID PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  originalName VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  size INT NOT NULL,
  gcsUrl VARCHAR(500) NOT NULL,
  publicUrl VARCHAR(500) NOT NULL,
  uploaderId UUID NOT NULL,
  taskId UUID,
  status VARCHAR(50) NOT NULL,
  description TEXT,
  signatureVerified BOOLEAN DEFAULT FALSE,
  signatureData TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP,
  INDEX idx_uploaderId (uploaderId),
  INDEX idx_taskId (taskId),
  INDEX idx_status (status)
);
```

---

## Common Issues & Solutions

### Port Already in Use
```bash
# Kill process on port 3002
lsof -i :3002
kill -9 <PID>
```

### JWT Authentication Fails
- Verify JWT_SECRET matches between services
- Check Bearer token format in Authorization header
- Ensure token is not expired

### GCS Upload Fails
- Verify GCS_KEY_FILE_PATH is correct
- Check service account has Storage admin permissions
- Ensure GCS_BUCKET_NAME exists

### Trip Service Connection Failed
- Verify TRIP_SERVICE_URL is correct
- Check Trip Service is running
- Test connectivity: `curl $TRIP_SERVICE_URL/health`

---

## Implementation Checklist

### Core Endpoints (5 endpoints)
- [ ] GET `/api/v1/media?task-id={taskId}` - List media by task
- [ ] GET `/api/v1/media/{id}` - Get single media by ID
- [ ] POST `/api/v1/media?task-id={taskId}` - Upload with GnuPG signature
- [ ] DELETE `/api/v1/media/{id}` - Delete media
- [ ] GET `/api/v1/media/{id}/view-url` - Generate signed URL for private access

### Authentication & Authorization
- [ ] Implement JWT authentication guard via API Gateway
- [ ] Add ownership checks (user can only delete/view-url their own media)
- [ ] Add admin role support for elevated permissions
- [ ] Validate Authorization header and extract user info

### GnuPG Signature Verification
- [ ] Implement GnuPG signature verification service
  - [ ] Parse ASCII-armored signatures
  - [ ] Integrate with User Service for public key fetching via JWT
  - [ ] Verify signatures synchronously before upload (blocking)
- [ ] Update upload endpoint to accept multipart fields: file, signature, originalFilename, mimetype
- [ ] Change upload query parameter from `trip-id` to `task-id`
- [ ] Create error handling for signature verification failures

### Signed URL Endpoint (Private GCS Access)
- [ ] Implement signed URL generation in GCS service
- [ ] Add time-limited URL expiration (default 1 hour, max 24 hours)
- [ ] Support optional `expiresIn` query parameter
- [ ] Add authorization check (owner or admin only)
- [ ] Keep GCS bucket private (not publicly readable)
- [ ] Test signed URL access to private files
- [ ] Verify expired URLs are rejected by GCS

### GCS Storage Configuration
- [ ] Set up Google Cloud Storage bucket
- [ ] Configure bucket as private (no public access)
- [ ] Grant service account Storage Object Admin role
- [ ] Update GCS service to NOT make files public after upload
- [ ] Test that direct bucket URLs are not accessible
- [ ] Test that signed URLs provide access

### Data & DTOs
- [ ] Create request/response DTOs with signature fields
- [ ] Add signatureVerified and signatureData to Media model
- [ ] Create signed URL response DTO with expiresAt and expiresIn

### Input Validation
- [ ] Validate multipart form fields are present (file, signature, originalFilename, mimetype)
- [ ] Validate signature format (ASCII-armored PGP)
- [ ] Validate file size (max 50MB)
- [ ] Validate MIME type (images, videos only)
- [ ] Validate taskId is provided as query parameter
- [ ] Validate media ID format (UUID)
- [ ] Validate optional expiresIn is within allowed range

### Testing
- [ ] Test all 5 endpoints with valid requests
- [ ] Test signature verification (valid and invalid signatures)
- [ ] Test ownership/authorization checks
- [ ] Test multipart form data handling
- [ ] Test signed URL generation and expiration
- [ ] Test private bucket access (direct URL should fail, signed URL should work)
- [ ] Test expired signed URL rejection
- [ ] Test optional expiresIn query parameter with boundary values
- [ ] Test with invalid media IDs and missing resources
- [ ] Load test with concurrent uploads
- [ ] Test rate limiting on signed URL requests

### Documentation
- [ ] Document all 5 API endpoints in Postman/OpenAPI
- [ ] Document signed URL security considerations
- [ ] Document GCS bucket private configuration
- [ ] Document JWT authentication flow
- [ ] Provide cURL examples for all endpoints
- [ ] Provide JavaScript/Node.js integration examples
- [ ] Document error codes and responses

---

## File Reference

| File | Purpose |
|------|---------|
| `main.ts` | HTTP server bootstrap |
| `app.module.ts` | Root module with Auth & Media |
| `media.controller.ts` | HTTP endpoint handlers |
| `media.service.ts` | Database operations |
| `media-upload.service.ts` | Upload orchestration |
| `gcs-upload.service.ts` | Google Cloud Storage |
| `gnupg-verification.service.ts` | GPG signature validation |
| `trip-service.client.ts` | Trip Service integration |
| `jwt.strategy.ts` | Passport JWT strategy |
| `jwt.guard.ts` | JWT authentication decorator |
