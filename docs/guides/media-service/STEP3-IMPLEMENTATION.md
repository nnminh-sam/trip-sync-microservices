# Step 3 Implementation: Media Service with GCS Upload + GnuPG Verification

**Status:** COMPLETED ✅

---

## Overview

This document details the implementation of Step 3 from the GnuPG Integration Guide: "Update MEDIA SERVICE with GCS UPLOAD + GnuPG VERIFICATION logic".

The Media Service has been updated with:
1. GPG signature verification using openpgp.js
2. Google Cloud Storage (GCS) file upload integration
3. Complete media upload workflow with validation
4. Message pattern handlers for microservice communication

---

## Architecture & Design

### Service Layer Structure

The media module now includes three specialized services:

#### 1. GnuPG Verification Service
**File:** `src/modules/media/services/gnupg-verification.service.ts`

- Verifies detached GPG signatures against file data
- Uses openpgp.js library for pure JavaScript signature verification
- Validates signatures with user's public key
- Returns verification result with signer key ID

**Key Methods:**
- `verifyDetachedSignature(fileData, signatureArmored, publicKeyArmored)` - Main verification method
- `verifyTextSignature(messageText, signatureArmored, publicKeyArmored)` - For text-based verification

#### 2. GCS Upload Service
**File:** `src/modules/media/services/gcs-upload.service.ts`

- Handles file uploads to Google Cloud Storage
- Supports both authentication methods:
  - Service account key file path
  - Embedded credentials (client email + private key)
- Generates public URLs for uploaded files
- Provides file deletion and existence checking

**Key Methods:**
- `uploadFile(fileBuffer, filename, metadata)` - Upload file to GCS
- `deleteFile(filename)` - Remove file from GCS
- `fileExists(filename)` - Check file existence
- `sanitizeFilename(filename)` - Safe filename handling

#### 3. Media Upload Service
**File:** `src/modules/media/services/media-upload.service.ts`

- Orchestrates the complete media upload workflow
- Validates uploads with GPG signature verification
- Fetches user's public key from User Service via NATS RPC
- Uploads verified files to GCS
- Saves media metadata to database
- Supports task-based media organization

**Key Methods:**
- `validateMediaUpload(fileBuffer, signatureArmored, uploaderId)` - Validates GPG signature
- `uploadMedia(fileBuffer, filename, signatureArmored, uploadRequest)` - Complete upload workflow
- `fetchPublicKey(userId)` - RPC call to User Service for public key

---

## Validation Flow

### Media Upload Validation Process

```
1. Receive file + signature from API Gateway
   ↓
2. Validate Media Upload
   ├─ Fetch user's public key from User Service (RPC: user.find.public-key)
   ├─ If public key not found → Return error
   └─ Verify GPG signature using openpgp.js
      ├─ Parse signature (armored format)
      ├─ Parse public key (armored format)
      ├─ Create message from file binary data
      ├─ Verify signature matches public key
      └─ If verification fails → Return error with details
   ↓
3. If validation passes
   ├─ Upload file to GCS
   ├─ Generate GCS URL and public URL
   └─ Save media metadata to database
      ├─ Set status: "verified"
      ├─ Set signatureVerified: true
      └─ Store original signature data
   ↓
4. Return saved media record to caller
```

---

## Configuration

### Environment Variables

The media-service now supports GCS configuration via environment variables:

```env
# Google Cloud Storage Configuration
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name

# Authentication Option 1: Service Account Key File
GCS_KEY_FILENAME=/path/to/service-account-key.json

# Authentication Option 2: Embedded Credentials
GCS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GCS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

**Configuration file:** `src/config/configuration.ts`

The configuration supports optional GCS fields. If not configured, the service logs warnings but continues operating.

---

## Database Schema

### Media Entity Updates

Added new fields to support GCS integration:

```typescript
@Column({ type: 'varchar', length: 500 })
gcsUrl: string;  // GCS storage URL (gs://bucket/path)

@Column({ type: 'varchar', length: 500 })
publicUrl: string;  // Public HTTPS URL for file access

@Column({ type: 'boolean', default: false })
signatureVerified: boolean;  // GPG signature verification status

@Column({ type: 'text', nullable: true })
signatureData?: string;  // Original GPG signature (armored format)
```

---

## API Integration

### Message Patterns

The media module supports the following NATS RPC message patterns:

| Pattern | Handler | Purpose |
|---------|---------|---------|
| `media.find.id` | `findById()` | Fetch media by ID |
| `media.find` | `findAll()` | Query media with filters |
| `media.find.task` | `findByTaskId()` | Fetch media by task ID |
| `media.create` | `create()` | Upload new media with signature verification |
| `media.update` | `update()` | Update media metadata |
| `media.delete` | `delete()` | Soft delete media |
| `media.signature.verify` | `verifySignature()` | Verify GPG signature without uploading |

### Create Media Endpoint Payload

The `media.create` message expects:

```json
{
  "claims": {
    "sub": "user-uuid"  // User ID from JWT token
  },
  "request": {
    "body": {
      "fileBuffer": "binary-file-data",
      "filename": "original-filename.jpg",
      "signature": "-----BEGIN PGP SIGNATURE-----\n...\n-----END PGP SIGNATURE-----",
      "taskId": "optional-task-uuid",
      "description": "optional-media-description"
    }
  }
}
```

---

## File Storage Structure

### GCS Directory Organization

Uploaded files are organized by user and task:

```
gs://media-bucket/
├── media/
│   ├── {uploaderId}/
│   │   ├── {taskId}/
│   │   │   ├── 1701234567890.jpg
│   │   │   ├── 1701234567891.mp4
│   │   │   └── ...
│   │   └── 1701234567892.pdf  (no task)
│   └── {anotherUserId}/
│       └── ...
```

**Filename Format:** `media/{uploaderId}/{taskId}/{timestamp}.{extension}`

---

## Error Handling

### Signature Verification Errors

- **No public key found**: User must first update their public key via User Service
- **Invalid signature**: Signature doesn't match file or public key
- **Corrupted signature/key**: Parsing error in armored format
- **Network timeout**: RPC call to User Service timed out (10 second timeout)

### GCS Upload Errors

- **Bucket not initialized**: GCS configuration missing or invalid
- **File buffer empty**: No file data provided
- **Invalid filename**: Filename is empty or too long
- **Authentication failed**: Service account credentials invalid
- **Network error**: Connection failure to GCS

### All errors are logged and returned with descriptive messages

---

## Testing Considerations

### Prerequisites for Testing

1. **GCS Configuration:**
   - Valid GCP project with Storage API enabled
   - Service account with Storage Object Admin role
   - Credentials (key file or embedded format)

2. **GPG Keys:**
   - User's public key stored in User Service
   - Test file and corresponding detached signature
   - Signature generated with user's private key

3. **NATS Server:**
   - Running and accessible
   - User Service connected and responding to RPC calls

### Test Scenarios

1. **Valid Signature Upload:**
   - Upload file with valid GPG signature
   - Verify file stored in GCS
   - Check database record created with `signatureVerified: true`

2. **Invalid Signature:**
   - Upload file with tampered signature
   - Verify rejection with appropriate error message
   - No database record created

3. **Missing Public Key:**
   - Upload with user having no public key
   - Verify error message about missing public key
   - User should update public key first

4. **Corrupted Signature Format:**
   - Upload with malformed signature armored text
   - Verify parsing error handling
   - Descriptive error returned

---

## Integration with API Gateway

### HTTP Endpoint at API Gateway

The API Gateway will handle HTTP file uploads and delegate to Media Service:

```
POST /api/v1/media?trip-id={tripId}
Authorization: Bearer {jwt-token}
Content-Type: multipart/form-data

file: [binary file]
signature: [armored PGP signature]
description: [optional description]
```

**API Gateway responsibilities:**
1. Parse multipart form data
2. Extract file buffer and signature
3. Validate JWT and extract user ID (sub claim)
4. Call Media Service via NATS RPC with `media.create` pattern
5. Return response to client

---

## Logging

The services provide detailed logging:

- **GnuPG Verification Service:** Signature verification attempts and results
- **GCS Upload Service:** File upload progress and URLs
- **Media Upload Service:** Complete workflow progress and decisions
- **Media Controller:** Request/response handling

Log levels configured via `LOG_LEVEL` environment variable.

---

## Dependencies

### Core Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `@google-cloud/storage` | ^7.0.0 | GCS client library |
| `openpgp` | ^5.11.1 | GPG signature verification |
| `@nestjs/microservices` | ^10.4.19 | NATS RPC communication |
| `nats` | ^2.29.3 | NATS client |
| `@nestjs/typeorm` | ^11.0.0 | Database ORM |
| `mysql2` | ^3.14.2 | MySQL driver |

---

## Future Enhancements

1. **Batch Uploads:** Support uploading multiple files with a single signature
2. **Compression:** Compress files before GCS upload
3. **CDN Integration:** Serve public URLs through CDN for faster access
4. **Retry Logic:** Automatic retry for failed GCS uploads
5. **File Validation:** Add file size limits, type validation
6. **Metadata Extraction:** Extract image/video metadata during upload
7. **Thumbnail Generation:** Generate thumbnails for image files
8. **Virus Scanning:** Integrate malware scanning before storage

---

## Implementation Summary

| Task | Status | File |
|------|--------|------|
| GnuPG Verification Service | ✅ DONE | `src/modules/media/services/gnupg-verification.service.ts` |
| GCS Upload Service | ✅ DONE | `src/modules/media/services/gcs-upload.service.ts` |
| Media Upload Service | ✅ DONE | `src/modules/media/services/media-upload.service.ts` |
| Media Controller Updates | ✅ DONE | `src/modules/media/media.controller.ts` |
| Media Module Updates | ✅ DONE | `src/modules/media/media.module.ts` |
| Configuration Updates | ✅ DONE | `src/config/configuration.ts` |
| CreateMediaDto Updates | ✅ DONE | `src/modules/media/dtos/create-media.dto.ts` |
| Build Verification | ✅ DONE | `npm run build` succeeds |

---

## Related Documentation

- **Step 1:** `docs/guides/media-service/index.md` - NestJS skeleton and setup
- **Step 2:** `docs/guides/gnupg-integration/STEP2-IMPLEMENTATION.md` - User Service GPG key storage
- **Integration Guide:** `docs/guides/gnupg-integration/gnupg-integration-backend.md`
- **Knowledge Docs:** `docs/knowledge/` - Architecture understanding
