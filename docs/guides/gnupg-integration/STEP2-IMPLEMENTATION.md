# Step 2: Update User Service - Implementation Summary

**Date**: November 30, 2025
**Status**: ✅ COMPLETE

---

## Overview

Step 2 involves updating the User Service to store and manage GPG public keys for each user. This enables the Media Service to later retrieve public keys for signature verification.

---

## Changes Made

### 1. User Entity Update

**File**: `user-micro/src/models/user.model.ts`

Added public key field:

```typescript
@Column({ type: 'text', nullable: true })
publicKey?: string; // GPG public key for signature verification
```

**Details**:
- Field type: `text` (to accommodate full PEM-formatted GPG keys)
- Optional: `nullable: true`
- Will be auto-created in database on service startup (TypeORM sync)

---

### 2. User Service Enhancement

**File**: `user-micro/src/modules/user/user.service.ts`

Added two new methods:

#### A. `updatePublicKey(userId: string, publicKey: string)`

Updates the current user's public key:

```typescript
async updatePublicKey(userId: string, publicKey: string) {
  // Validates that publicKey is not empty
  // Retrieves user by ID
  // Updates publicKey field
  // Returns user without password
}
```

**Features**:
- Validates non-empty public key
- Throws 404 if user not found
- Logs all operations
- Removes password from response

#### B. `getPublicKeyById(userId: string)`

Retrieves a user's public key (used by Media Service for verification):

```typescript
async getPublicKeyById(userId: string) {
  // Selects only: user.id, user.email, user.publicKey
  // Throws 404 if user not found
  // Throws 404 if publicKey not set
  // Returns: { id, email, publicKey }
}
```

**Features**:
- Minimal query (only needed fields)
- Used by Media Service for GPG verification
- Proper error handling

---

### 3. User Controller RPC Handlers

**File**: `user-micro/src/modules/user/user.controller.ts`

Added two new RPC message handlers:

#### A. `updatePublicKey()`

**Pattern**: `user.update.public-key`

```typescript
@MessagePattern(UserMessagePattern.updatePublicKey)
async updatePublicKey(@Payload() payload: MessagePayloadDto<{ publicKey: string }>) {
  // Extracts publicKey from request body
  // Calls service.updatePublicKey(claims.sub, publicKey)
  // Logs audit trail
  // Returns updated user
}
```

**Request Flow**:
```
API Gateway (PATCH /users/my/public-key)
    ↓
RPC Call: user.update.public-key
    ↓
User Controller Handler
    ↓
User Service (updatePublicKey)
    ↓
Database Update
```

#### B. `findPublicKey()`

**Pattern**: `user.find.public-key`

```typescript
@MessagePattern(UserMessagePattern.findPublicKey)
async findPublicKey(@Payload() payload: MessagePayloadDto) {
  // Extracts userId from claims.sub
  // Calls service.getPublicKeyById(claims.sub)
  // Logs audit trail
  // Returns { id, email, publicKey }
}
```

**Request Flow**:
```
API Gateway (GET /users/my/public-key)
    ↓
RPC Call: user.find.public-key
    ↓
User Controller Handler
    ↓
User Service (getPublicKeyById)
    ↓
Database Query
```

---

### 4. Message Patterns Update

**File**: `user-micro/src/modules/user/user-message.pattern.ts`

Added new patterns:

```typescript
export const UserMessagePattern = {
  // ... existing patterns ...
  updatePublicKey: 'user.update.public-key',
  findPublicKey: 'user.find.public-key',
} as const;
```

---

### 5. API Gateway Service Enhancement

**File**: `api-gateway/src/modules/user/user.service.ts`

Added two new methods for delegating to user-micro:

#### A. `updatePublicKey(claims: TokenClaimsDto, publicKey: string)`

Delegates to RPC pattern `user.update.public-key`:

```typescript
async updatePublicKey(claims: TokenClaimsDto, publicKey: string) {
  // Sends RPC call with claims and publicKey
  // Includes error handling via @CatchErrors decorator
  // Returns updated user data
}
```

#### B. `getPublicKey(claims: TokenClaimsDto)`

Delegates to RPC pattern `user.find.public-key`:

```typescript
async getPublicKey(claims: TokenClaimsDto) {
  // Sends RPC call with claims
  // Includes error handling via @CatchErrors decorator
  // Returns { id, email, publicKey }
}
```

---

### 6. API Gateway Controller Endpoints

**File**: `api-gateway/src/modules/user/user.controller.ts`

Added two new HTTP endpoints:

#### A. PATCH `/api/v1/users/my/public-key`

Updates current user's public key:

```typescript
@Patch('my/public-key')
@ApiBearerAuth()
@ApiOperation({ summary: 'Update current user public key' })
async updatePublicKey(
  @RequestUserClaims() claims: TokenClaimsDto,
  @Body('publicKey') publicKey: string,
)
```

**Request**:
```json
{
  "publicKey": "-----BEGIN PGP PUBLIC KEY BLOCK-----\n...\n-----END PGP PUBLIC KEY BLOCK-----"
}
```

**Response** (HTTP 200):
```json
{
  "id": "user-uuid",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "publicKey": "-----BEGIN PGP PUBLIC KEY...",
  // ... other user fields ...
}
```

#### B. GET `/api/v1/users/my/public-key`

Retrieves current user's public key:

```typescript
@Get('my/public-key')
@ApiBearerAuth()
@ApiOperation({ summary: 'Get current user public key' })
async getPublicKey(@RequestUserClaims() claims: TokenClaimsDto)
```

**Response** (HTTP 200):
```json
{
  "id": "user-uuid",
  "email": "john@example.com",
  "publicKey": "-----BEGIN PGP PUBLIC KEY BLOCK-----\n...\n-----END PGP PUBLIC KEY BLOCK-----"
}
```

---

## Database Schema

The `users` table automatically gains a new column:

```sql
ALTER TABLE users ADD COLUMN publicKey LONGTEXT NULL;
```

**Details**:
- Column name: `publicKey`
- Type: LONGTEXT (to support full PEM-formatted GPG keys)
- Nullable: YES (not all users have keys)
- Created automatically by TypeORM synchronization

---

## Integration Points

### 1. User Service → Database

**Operation**: Store/Retrieve public keys
- **Method**: TypeORM Repository
- **Auto-sync**: Enabled (no migrations needed)

### 2. User Controller → User Service

**Communication**: RPC via NATS
- **Patterns**: `user.update.public-key`, `user.find.public-key`
- **Payload**: MessagePayloadDto with claims + data

### 3. API Gateway → User Service

**Communication**: RPC via NATS
- **Delegation**: HTTP requests → RPC calls
- **Error Handling**: @CatchErrors decorator with user-friendly messages

### 4. Media Service → User Service (Future)

**Communication**: RPC via NATS
- **Use Case**: Media Service fetches public key for signature verification
- **Pattern**: `user.find.public-key`
- **Response**: `{ id, email, publicKey }`

---

## Error Handling

### Update Public Key

| Scenario | Status | Message |
|----------|--------|---------|
| Empty public key | 400 | "Public key cannot be empty" |
| User not found | 404 | "User Not Found" |
| Service unavailable | 500 | "User service unavailable" |

### Get Public Key

| Scenario | Status | Message |
|----------|--------|---------|
| User not found | 404 | "User Not Found" |
| No public key set | 404 | "Public Key Not Set" |
| Service unavailable | 500 | "User service unavailable" |

---

## Audit Logging

Both endpoints log to the audit trail:

**Update Public Key**:
- Action: UPDATE
- Entity: user
- Description: `Updated public key for user with ID: {id}`

**Get Public Key**:
- Action: READ
- Entity: user
- Description: `Retrieved public key for user with ID: {id}`

---

## Testing

### Test Update Endpoint

```bash
curl -X PATCH http://localhost:3000/api/v1/users/my/public-key \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "publicKey": "-----BEGIN PGP PUBLIC KEY BLOCK-----\n...\n-----END PGP PUBLIC KEY BLOCK-----"
  }'
```

### Test Get Endpoint

```bash
curl -X GET http://localhost:3000/api/v1/users/my/public-key \
  -H "Authorization: Bearer <TOKEN>"
```

### Test via Swagger

1. Go to: `http://localhost:3000/api-document`
2. Authorize with JWT token
3. Test endpoints under "User" section

---

## Files Modified

| File | Changes |
|------|---------|
| `user-micro/src/models/user.model.ts` | Added `publicKey` field |
| `user-micro/src/modules/user/user.service.ts` | Added `updatePublicKey()`, `getPublicKeyById()` |
| `user-micro/src/modules/user/user.controller.ts` | Added RPC handlers for public key ops |
| `user-micro/src/modules/user/user-message.pattern.ts` | Added two new message patterns |
| `api-gateway/src/modules/user/user.service.ts` | Added delegation methods |
| `api-gateway/src/modules/user/user.controller.ts` | Added two HTTP endpoints |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Client (Web/Mobile)                    │
└─────────────────────────────────────────────────────────┘
                            │
                 HTTP PATCH/GET
                            │
┌─────────────────────────────────────────────────────────┐
│             API Gateway (Port 3000)                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │ UserController                                     │ │
│  │  • updatePublicKey()  → PATCH /users/my/public-key│ │
│  │  • getPublicKey()     → GET  /users/my/public-key │ │
│  └────────────────────────────────────────────────────┘ │
│                     │                                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │ UserService                                        │ │
│  │  • updatePublicKey()  → RPC delegation            │ │
│  │  • getPublicKey()     → RPC delegation            │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                 RPC via NATS (user.update.public-key)
                            │
┌─────────────────────────────────────────────────────────┐
│          User Service (Port 3001)                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │ UserController                                     │ │
│  │  • updatePublicKey()  → @MessagePattern            │ │
│  │  • findPublicKey()    → @MessagePattern            │ │
│  └────────────────────────────────────────────────────┘ │
│                     │                                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │ UserService                                        │ │
│  │  • updatePublicKey()  → Updates DB                │ │
│  │  • getPublicKeyById() → Queries DB                │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                        MySQL
                            │
                    users.publicKey
```

---

## Next Steps

### Step 3: Media Service Implementation

The Media Service will:

1. Accept file uploads with GPG signature
2. Call `user.find.public-key` RPC to fetch user's public key
3. Verify the signature using OpenPGP.js
4. Mark media as `signatureVerified: true/false`

### Step 4: API Gateway Media Integration

Add media endpoints to API Gateway:

1. `POST /api/v1/media` - Upload media with signature
2. `GET /api/v1/media/{id}` - Retrieve media
3. `DELETE /api/v1/media/{id}` - Delete media

---

## Summary

✅ **All Step 2 tasks completed**:

1. ✅ User entity updated with `publicKey` field
2. ✅ User Service has public key management methods
3. ✅ User Controller exposes RPC handlers
4. ✅ User message patterns defined
5. ✅ API Gateway delegates to User Service
6. ✅ API Gateway exposes HTTP endpoints
7. ✅ Proper error handling throughout
8. ✅ Audit logging for all operations
9. ✅ Database schema auto-synced

The User Service is now ready to support public key management for GPG signature verification in the Media Service!

---

## References

- GnuPG Integration Guide: `docs/guides/gnupg-integration/gnupg-integration-backend.md`
- User Service Docs: `docs/knowledge/user-micro/index.md`
- API Gateway Docs: `docs/knowledge/api-gateway/index.md`
- API Request Flow: `docs/knowledge/api-request/index.md`
