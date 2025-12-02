/**
 * Update Public Key Script for API Gateway Integration
 *
 * This script reads the GPG public key from @user-micro/gpg-keys/admin_pubkey.asc
 * and uploads it to the API Gateway endpoint to register it with the user account.
 *
 * The public key is used by the Media Service to verify GnuPG signatures on uploaded files.
 *
 * The script automatically logs in using credentials from .env before uploading the key.
 *
 * Usage:
 *   npm run update-public-key                (Show help)
 *   npm run update-public-key -- --upload    (Auto-login and upload public key)
 *   npm run update-public-key -- --show-key  (Display public key)
 *
 * Environment Variables:
 *   API_GATEWAY_BASE_URL  - Base URL of the API Gateway (e.g., http://localhost:80)
 *   UPDATE_KEY_EMAIL      - Email for login to API Gateway
 *   UPDATE_KEY_PASSWORD   - Password for login to API Gateway
 *
 * Requirements:
 *   - Public key must exist at gpg-keys/admin_pubkey.asc
 *   - .env file must contain: API_GATEWAY_BASE_URL, UPDATE_KEY_EMAIL, UPDATE_KEY_PASSWORD
 *
 * Example:
 *   npm run update-public-key -- --upload
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.error(`❌ .env file not found at: ${envPath}`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVariables = {};

  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (key.trim()) {
        envVariables[key.trim()] = value;
      }
    }
  });

  return envVariables;
}

/**
 * Read public key from gpg-keys directory
 */
function readPublicKey() {
  const publicKeyPath = path.join(__dirname, '../gpg-keys/admin_pubkey.asc');

  if (!fs.existsSync(publicKeyPath)) {
    console.error(`❌ Public key not found at: ${publicKeyPath}`);
    console.error('   Expected location: @user-micro/gpg-keys/admin_pubkey.asc');
    process.exit(1);
  }

  const publicKey = fs.readFileSync(publicKeyPath, 'utf-8');

  if (!publicKey || publicKey.trim().length === 0) {
    console.error(`❌ Public key file is empty: ${publicKeyPath}`);
    process.exit(1);
  }

  return publicKey.trim();
}

/**
 * Display public key for copying
 */
function displayPublicKey() {
  const publicKey = readPublicKey();
  console.log('\n📋 Public Key (copy this to update with API):');
  console.log('=====================================');
  console.log(publicKey);
  console.log('=====================================\n');
}

/**
 * Login to API Gateway and get JWT token
 *
 * @returns {Promise<{token: string, user: Object}>} JWT token and user object
 */
async function loginToApiGateway(apiGatewayUrl, email, password) {
  return new Promise((resolve, reject) => {
    const protocol = apiGatewayUrl.startsWith('https') ? https : http;
    const urlObj = new URL(apiGatewayUrl);
    const endpoint = '/api/v1/auth/login';

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const loginBody = JSON.stringify({
      email: email,
      password: password,
    });

    console.log('🔐 Logging in to API Gateway...');
    console.log(`📍 Endpoint: ${apiGatewayUrl}${endpoint}`);

    const req = protocol.request(requestOptions, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const response = JSON.parse(responseData);
            const jwtToken = response.data?.accessToken || response.accessToken;
            const user = response.data?.user;

            if (!jwtToken) {
              reject(new Error('JWT token not found in login response'));
              return;
            }

            console.log('✅ Login successful! JWT token obtained.\n');

            if (user) {
              console.log(`👤 Logged in as: ${user.firstName} ${user.lastName}`);
              console.log(`📧 Email: ${user.email}`);
              console.log(`👑 Role: ${user.role?.name || 'Unknown'}\n`);
            }

            resolve({ token: jwtToken, user });
          } catch (parseError) {
            reject(new Error(`Failed to parse login response: ${parseError.message}`));
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          console.error(`❌ Login failed (Status ${res.statusCode})`);
          console.error('   Invalid email or password');

          try {
            const errorResponse = JSON.parse(responseData);
            console.error(`   Error: ${errorResponse.message || responseData}`);
          } catch (e) {
            console.error(`   Response: ${responseData}`);
          }

          reject(new Error('Authentication failed'));
        } else {
          console.error(`❌ Login failed (Status ${res.statusCode})`);

          try {
            const errorResponse = JSON.parse(responseData);
            console.error(`   Error: ${errorResponse.message || responseData}`);
          } catch (e) {
            console.error(`   Response: ${responseData}`);
          }

          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Connection error: ${error.message}`);
      reject(error);
    });

    req.setHeader('Content-Length', Buffer.byteLength(loginBody));
    req.write(loginBody);
    req.end();
  });
}

/**
 * Upload public key to API Gateway
 */
async function uploadPublicKey(envVariables) {
  try {
    const publicKey = readPublicKey();
    const apiGatewayUrl = envVariables.API_GATEWAY_BASE_URL;
    const email = envVariables.UPDATE_KEY_EMAIL;
    const password = envVariables.UPDATE_KEY_PASSWORD;

    // Validate environment variables
    if (!apiGatewayUrl) {
      console.error('❌ API_GATEWAY_BASE_URL not found in .env file');
      console.error('   Please add: API_GATEWAY_BASE_URL=http://localhost:80');
      process.exit(1);
    }

    if (!email) {
      console.error('❌ UPDATE_KEY_EMAIL not found in .env file');
      console.error('   Please add: UPDATE_KEY_EMAIL=user@example.com');
      process.exit(1);
    }

    if (!password) {
      console.error('❌ UPDATE_KEY_PASSWORD not found in .env file');
      console.error('   Please add: UPDATE_KEY_PASSWORD=your-password');
      process.exit(1);
    }

    // Step 1: Login to get JWT token
    console.log('\n📋 Starting public key update process...\n');
    const loginResult = await loginToApiGateway(apiGatewayUrl, email, password);
    const jwtToken = loginResult.token;
    const user = loginResult.user;

    // Step 2: Upload public key with JWT token
    const urlObj = new URL(apiGatewayUrl);
    const endpoint = '/api/v1/users/my/public-key';

    console.log('🔐 Uploading Public Key to API Gateway');
    console.log(`📍 API Gateway URL: ${apiGatewayUrl}`);
    console.log(`📍 Endpoint: ${endpoint}`);
    console.log('⏳ Please wait...\n');

    return new Promise((resolve, reject) => {
      const protocol = apiGatewayUrl.startsWith('https') ? https : http;

      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: endpoint,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
      };

      const requestBody = JSON.stringify({
        publicKey: publicKey,
      });

      const req = protocol.request(requestOptions, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`✅ Public key uploaded successfully!`);
            console.log(`   Status Code: ${res.statusCode}`);

            if (responseData) {
              try {
                const response = JSON.parse(responseData);
                console.log(`\n📊 Response:`);
                console.log(JSON.stringify(response, null, 2));
              } catch (e) {
                console.log(`   Response: ${responseData}`);
              }
            }

            console.log('\n✨ Public key is now registered with API Gateway!');
            if (user) {
              console.log(`📌 Registered for: ${user.firstName} ${user.lastName} (${user.email})`);
            }
            console.log('   Media Service will use this key to verify uploaded signatures.\n');

            resolve();
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            console.error(`❌ Upload failed - Authentication error (Status ${res.statusCode})`);
            console.error('   Your JWT token may have expired');

            if (responseData) {
              try {
                const errorResponse = JSON.parse(responseData);
                console.error(`   Error: ${errorResponse.message || responseData}`);
              } catch (e) {
                console.error(`   Response: ${responseData}`);
              }
            }

            reject(new Error('Authentication failed during upload'));
          } else {
            console.error(`❌ Upload failed (Status ${res.statusCode})`);

            if (responseData) {
              try {
                const errorResponse = JSON.parse(responseData);
                console.error(`   Error: ${errorResponse.message || responseData}`);
              } catch (e) {
                console.error(`   Response: ${responseData}`);
              }
            }

            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error(`❌ Connection error: ${error.message}`);
        reject(error);
      });

      req.setHeader('Content-Length', Buffer.byteLength(requestBody));
      req.write(requestBody);
      req.end();
    });
  } catch (error) {
    console.error(`❌ Error uploading public key:`, error.message);
    process.exit(1);
  }
}

/**
 * Main CLI handler
 */
async function main() {
  const envVariables = loadEnv();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🔐 Public Key Update Tool

This script automatically logs in and uploads your GPG public key to the API Gateway.
The key is used by the Media Service to verify signed media uploads.

Usage:
  npm run update-public-key                (Show this help)
  npm run update-public-key -- --upload    (Auto-login and upload public key)
  npm run update-public-key -- --show-key  (Display public key for copying)

Environment Setup:
  Your .env file must include:
    API_GATEWAY_BASE_URL=http://localhost:80
    UPDATE_KEY_EMAIL=user@example.com
    UPDATE_KEY_PASSWORD=your-password

Quick Start:
  1. Set credentials in .env file:
     UPDATE_KEY_EMAIL=your-email@example.com
     UPDATE_KEY_PASSWORD=your-password

  2. Run the upload command:
     npm run update-public-key -- --upload

  3. The script will automatically log in and register your public key.

Files:
  Public Key: ${path.join(__dirname, '../gpg-keys/admin_pubkey.asc')}
  Config: ${path.join(__dirname, '../.env')}
    `);
    return;
  }

  const command = args[0];

  switch (command) {
    case '--upload':
      console.log('');
      await uploadPublicKey(envVariables);
      break;

    case '--show-key':
      displayPublicKey();
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.error('Use: npm run update-public-key for usage information');
      process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
