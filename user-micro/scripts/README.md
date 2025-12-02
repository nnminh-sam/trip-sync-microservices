# Utility Scripts

This directory contains utility scripts for managing GPG keys and testing the GPG signature verification feature in the Media Service.

## Available Scripts

1. **sign-media.js** - Sign media files with GPG private key
2. **update-public-key.js** - Upload public key to API Gateway

## Sign Media Script

**Location:** `scripts/sign-media.js`

This Node.js script handles GPG key generation and signing of media files for testing purposes. It uses the openpgp.js library to create detached signatures compatible with the Media Service.

### Prerequisites

- Node.js installed
- openpgp package (automatically installed with `npm install`)

### Quick Start

#### 1. Display Public Key for Setup

```bash
npm run sign-media -- --show-key
```

This displays the public key in the console. Copy this entire text (including the `-----BEGIN PGP PUBLIC KEY BLOCK-----` and `-----END PGP PUBLIC KEY BLOCK-----` lines) to set up in the User Service.

The script uses GPG keys pre-generated in the `gpg-keys/` directory:
- `gpg-keys/admin_private.asc` - Private key for signing
- `gpg-keys/admin_pubkey.asc` - Public key for verification

#### 2. Sign All Media Files

```bash
npm run sign-media -- --sign-all
```

This command:
- Finds all files in `test/resources/media/`
- Signs each file with the private key from `test/resources/keys/private-key.asc`
- Saves detached signatures to `test/resources/signed-media/`
- Creates metadata files with signature information
- Generates a summary file

**Output Example:**
```
🎯 Found 2 media file(s) to sign

📄 Signing file: sample-image.jpg
✅ Signature saved: /path/to/user-micro/test/resources/signed-media/sample-image.sig
✅ Signature metadata saved: /path/to/user-micro/test/resources/signed-media/sample-image.json

📄 Signing file: test-video.mp4
✅ Signature saved: /path/to/user-micro/test/resources/signed-media/test-video.sig
✅ Signature metadata saved: /path/to/user-micro/test/resources/signed-media/test-video.json

✅ Summary saved: /path/to/user-micro/test/resources/signed-media/SIGNATURE_SUMMARY.md

✨ All files signed successfully!
```

#### 3. Sign a Single File

```bash
npm run sign-media -- --sign <file-path>
```

Example:
```bash
npm run sign-media -- --sign test/resources/media/my-image.png
```

### Directory Structure

```
user-micro/
├── gpg-keys/                  (Pre-generated GPG keys)
│   ├── admin_private.asc      (Private key for signing)
│   └── admin_pubkey.asc       (Public key for verification)
├── scripts/
│   ├── sign-media.js          (This script)
│   └── README.md              (This documentation)
└── test/
    └── resources/
        ├── media/             (Input: media files to sign)
        │   └── sample-image.jpg
        └── signed-media/      (Output: signatures)
            ├── sample-image.sig
            ├── sample-image.json
            └── SIGNATURE_SUMMARY.md
```

### Workflow for Testing Media Service

#### Step 1: Setup - Copy Public Key

```bash
# Display and copy the public key to User Service
npm run sign-media -- --show-key
# (Use the displayed key to create/update a user in User Service)
```

#### Step 2: Sign Media Files

```bash
# Add your media files to test/resources/media/
# Then sign them all:
npm run sign-media -- --sign-all
```

#### Step 3: Get Signature for Postman

```bash
# Read the signature file:
cat test/resources/signed-media/sample-image.sig
```

Copy the entire signature output (multi-line armored PGP signature).

#### Step 4: Test in Postman

1. Create a POST request to `/api/v1/media?trip-id={tripId}`
2. Set headers:
   ```
   Authorization: Bearer <JWT_TOKEN>
   Content-Type: multipart/form-data
   ```
3. Add form data:
   - **file**: (select your media file)
   - **signature**: (paste the signature from step 3)
   - **description**: (optional)

### Output Files

#### Signature File (`.sig`)
Contains the detached PGP signature in armored (text) format:
```
-----BEGIN PGP SIGNATURE-----

iQIzBAEBCAAdFiEE...
...
-----END PGP SIGNATURE-----
```

#### Metadata File (`.json`)
Contains information about the signature:
```json
{
  "originalFile": "sample-image.jpg",
  "originalPath": "/path/to/test/resources/media/sample-image.jpg",
  "signedAt": "2024-11-30T10:30:45.123Z",
  "signatureFile": "sample-image.sig",
  "hashAlgorithm": "SHA256",
  "usage": "Use this signature with Postman to test media upload API"
}
```

#### Summary File (SIGNATURE_SUMMARY.md)
Contains a markdown summary of all signed files and usage instructions.

### Using Signatures in API Calls

#### cURL Example

```bash
SIGNATURE=$(cat test/resources/signed-media/sample-image.sig)

curl -X POST http://localhost:3000/api/v1/media?trip-id=my-trip-123 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@test/resources/media/sample-image.jpg" \
  -F "signature=$SIGNATURE" \
  -F "description=Test media file"
```

#### JavaScript/Node.js Example

```javascript
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('file', fs.createReadStream('test/resources/media/sample-image.jpg'));
form.append('signature', fs.readFileSync('test/resources/signed-media/sample-image.sig', 'utf-8'));
form.append('description', 'Test media file');

const response = await fetch('http://localhost:3000/api/v1/media?trip-id=my-trip-123', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  },
  body: form
});
```

#### Postman Example

1. Create new POST request
2. URL: `{{API_GATEWAY_URL}}/api/v1/media?trip-id={{TRIP_ID}}`
3. Headers tab:
   ```
   Authorization: Bearer {{JWT_TOKEN}}
   ```
4. Body tab → form-data:
   | Key | Type | Value |
   |-----|------|-------|
   | file | File | (select from test/resources/media/) |
   | signature | Text | (paste contents of .sig file) |
   | description | Text | Test upload |

### Troubleshooting

#### Error: "Private key not found"
```
❌ Private key not found at: /path/to/user-micro/gpg-keys/admin_private.asc
   Expected location: @user-micro/gpg-keys/admin_private.asc
```
**Solution:** Ensure the file exists at `user-micro/gpg-keys/admin_private.asc`. This file should be pre-generated.

#### Error: "File not found"
```
❌ File not found: /path/to/file
```
**Solution:** Verify the file path exists. Use `npm run sign-media -- --sign-all` to sign all files in the media folder.

#### Error: "Media directory not found"
```
❌ Media directory not found: /path/to/user-micro/test/resources/media
```
**Solution:** The directory is auto-created during setup. Place media files in that directory and try again.

### Testing Different Scenarios

#### Valid Signature Test
```bash
npm run sign-media -- --sign-all
# Use the generated signatures - these should verify successfully
```

#### Invalid Signature Test
```bash
# Manually edit a .sig file to corrupt the signature
nano test/resources/signed-media/sample-image.sig
# (change a character)

# Upload with corrupted signature - should be rejected
```

#### Wrong Public Key Test
```bash
npm run sign-media -- --generate-key
# (generates new keys)
npm run sign-media -- --sign-all
# (signs with new private key)

# Try uploading with old public key - should fail
```

### Implementation Details

- **Algorithm:** RSA 2048-bit
- **Hash:** SHA256
- **Format:** Detached signatures in armored (ASCII-text) format
- **Library:** openpgp.js v5
- **Passphrase:** None (empty) for testing
- **User ID:** "Test Employee <employee@test.example.com>"

### Security Notes

⚠️ **These keys are for testing only!** Do not use in production.

- Keys are generated without passphrase protection
- Private keys are stored unencrypted on disk
- Use only in development/testing environments
- For production, use proper key management systems

### Additional Resources

- [OpenPGP.js Documentation](https://docs.openpgpjs.org/)
- [GnuPG Integration Guide](../docs/guides/gnupg-integration/gnupg-integration-backend.md)
- [Media Service Step 3 Implementation](../docs/guides/media-service/STEP3-IMPLEMENTATION.md)

---

## Update Public Key Script

**Location:** `scripts/update-public-key.js`

This Node.js script automatically logs in to the API Gateway and uploads your GPG public key for signature verification. The public key is used by the Media Service to verify GnuPG signatures on uploaded media files.

### Prerequisites

- Node.js installed
- Public key file at `gpg-keys/admin_pubkey.asc`
- `.env` file configured with credentials and API Gateway URL

### Configuration

#### Setup Credentials in .env

1. Open `user-micro/.env`:
   ```bash
   nano user-micro/.env
   ```

2. Ensure the following variables are set:
   ```env
   API_GATEWAY_BASE_URL=http://localhost:80
   UPDATE_KEY_EMAIL=user@example.com
   UPDATE_KEY_PASSWORD=your-password
   ```

   For production:
   ```env
   API_GATEWAY_BASE_URL=https://your-api-gateway-domain.com
   UPDATE_KEY_EMAIL=admin@example.com
   UPDATE_KEY_PASSWORD=secure-password
   ```

### Quick Start

#### 1. Display Public Key

View your public key before uploading:

```bash
npm run update-public-key -- --show-key
```

Output:
```
📋 Public Key (copy this to User Service):
=====================================
-----BEGIN PGP PUBLIC KEY BLOCK-----

mQINBGksVBQBEAC5yPnP5LP/6o6vY7ZCl2RoxTwY3x0nMuQCMGX2yRxEhexcPidN
...
-----END PGP PUBLIC KEY BLOCK-----
=====================================
```

#### 2. Upload Public Key Automatically

The script will automatically log in and upload your public key:

```bash
npm run update-public-key -- --upload
```

**Example Output:**
```
📋 Starting public key update process...

🔐 Logging in to API Gateway...
📍 Endpoint: http://localhost:80/api/v1/auth/login
✅ Login successful! JWT token obtained.

🔐 Uploading Public Key to API Gateway
📍 API Gateway URL: http://localhost:80
📍 Endpoint: /api/v1/user/my/public-key
⏳ Please wait...

✅ Public key uploaded successfully!
   Status Code: 200

📊 Response:
{
  "data": {
    "publicKey": "-----BEGIN PGP PUBLIC KEY BLOCK-----..."
  },
  "message": "Public key updated successfully"
}

✨ Public key is now registered with API Gateway!
   Media Service will use this key to verify uploaded signatures.
```

### How It Works

The script performs the following steps automatically:

1. **Read Configuration** - Loads API Gateway URL, email, and password from `.env`
2. **Authenticate** - Logs in to API Gateway using provided credentials
3. **Extract Token** - Receives JWT access token from login response
4. **Upload Key** - Sends your public key to the user endpoint with JWT authentication
5. **Confirm** - Displays success message and registration status

#### Step-by-Step Workflow

```
┌─────────────────────────────────────────┐
│  Load .env Configuration                │
│  • API_GATEWAY_BASE_URL                 │
│  • UPDATE_KEY_EMAIL                     │
│  • UPDATE_KEY_PASSWORD                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  POST /api/v1/auth/login                │
│  {                                      │
│    "email": "user@example.com",         │
│    "password": "password"               │
│  }                                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Extract JWT Token from Response        │
│  response.data.accessToken              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  PATCH /api/v1/user/my/public-key       │
│  Authorization: Bearer {jwt-token}      │
│  {                                      │
│    "publicKey": "-----BEGIN PGP..."     │
│  }                                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  ✅ Public Key Registered               │
│  Media Service can now verify uploads   │
└─────────────────────────────────────────┘
```

### API Endpoints

#### Login Endpoint

The script automatically calls this endpoint to obtain a JWT token.

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Success Response (200/201):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Public Key Upload Endpoint

**Endpoint:** `PATCH /api/v1/user/my/public-key`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {jwt-token}
```

**Request Body:**
```json
{
  "publicKey": "-----BEGIN PGP PUBLIC KEY BLOCK-----\n\nmQINBGksVBQBEA...\n-----END PGP PUBLIC KEY BLOCK-----\n"
}
```

**Success Response (200/201):**
```json
{
  "data": {
    "publicKey": "-----BEGIN PGP PUBLIC KEY BLOCK-----..."
  },
  "message": "Public key updated successfully"
}
```

### Troubleshooting

#### Error: API_GATEWAY_BASE_URL not found in .env file
```
❌ API_GATEWAY_BASE_URL not found in .env file
   Please add: API_GATEWAY_BASE_URL=http://localhost:80
```

**Solution:** Add `API_GATEWAY_BASE_URL` to your `.env` file:
```bash
echo "API_GATEWAY_BASE_URL=http://localhost:80" >> user-micro/.env
```

#### Error: UPDATE_KEY_EMAIL not found in .env file
```
❌ UPDATE_KEY_EMAIL not found in .env file
   Please add: UPDATE_KEY_EMAIL=user@example.com
```

**Solution:** Add email credential to your `.env` file:
```bash
echo "UPDATE_KEY_EMAIL=your-email@example.com" >> user-micro/.env
```

#### Error: UPDATE_KEY_PASSWORD not found in .env file
```
❌ UPDATE_KEY_PASSWORD not found in .env file
   Please add: UPDATE_KEY_PASSWORD=your-password
```

**Solution:** Add password credential to your `.env` file:
```bash
echo "UPDATE_KEY_PASSWORD=your-password" >> user-micro/.env
```

#### Error: Login failed (Status 401)
```
❌ Login failed (Status 401)
   Invalid email or password
   Error: User not found
```

**Solution:** Verify your credentials in `.env`:
1. Ensure `UPDATE_KEY_EMAIL` matches a valid user account
2. Ensure `UPDATE_KEY_PASSWORD` is correct
3. Verify the user exists in your system

#### Error: Connection error
```
❌ Connection error: getaddrinfo ENOTFOUND localhost
```

**Solution:** Verify API Gateway is running and `API_GATEWAY_BASE_URL` is correct:
```bash
# Test connectivity
curl http://localhost:80/api/v1/auth/login -X POST
```

#### Error: Public key not found
```
❌ Public key not found at: /path/to/user-micro/gpg-keys/admin_pubkey.asc
   Expected location: @user-micro/gpg-keys/admin_pubkey.asc
```

**Solution:** Ensure the public key file exists in `gpg-keys/admin_pubkey.asc`.

### Integration with Media Service

Once the public key is uploaded via this script, the Media Service will:

1. Fetch the user's public key from API Gateway using the JWT token
2. Verify GnuPG signatures on uploaded media files
3. Mark media as `verified` if signature is valid
4. Reject uploads with invalid or missing signatures

### Security Notes

⚠️ **Never share your JWT token!** It grants access to your account.

- Keep JWT tokens secure and private
- Don't commit tokens to version control
- Use environment variables for sensitive values
- Rotate tokens regularly
- Use HTTPS for production API Gateway URLs

### Complete Integration Workflow

```bash
# 1. Sign media files with private key
npm run sign-media -- --sign-all

# 2. Get JWT token (from your auth system)
JWT_TOKEN="your-jwt-token-here"

# 3. Upload public key to API Gateway
npm run update-public-key -- --upload "$JWT_TOKEN"

# 4. Upload signed media using Media Service API
SIGNATURE=$(cat test/resources/signed-media/sample-image.sig)
curl -X POST http://localhost:3002/api/v1/media?task-id=task-123 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@test/resources/media/sample-image.jpg" \
  -F "signature=$SIGNATURE" \
  -F "originalFilename=sample-image.jpg" \
  -F "mimetype=image/jpeg"
```

### Related Documentation

- [Sign Media Script](#media-signing-script) - Sign files before upload
- [GnuPG Integration Guide](../docs/guides/gnupg-integration/gnupg-integration-backend.md)
- [Media Service HTTP API](../docs/guides/media-service/HTTP-API-IMPLEMENTATION.md)
