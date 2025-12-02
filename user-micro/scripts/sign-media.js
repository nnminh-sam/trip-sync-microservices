/**
 * Media File Signing Script for GPG Verification Testing
 *
 * This script signs media files using GPG private key from @user-micro/gpg-keys
 * for testing the Media Service GPG signature verification feature.
 *
 * Usage:
 *   npm run sign-media                                   (Show help)
 *   npm run sign-media -- --sign <file-path>            (Sign a media file)
 *   npm run sign-media -- --sign-all                    (Sign all files in media folder)
 *   npm run sign-media -- --show-key                    (Display public key)
 *
 * Output:
 *   - Signatures saved to test/resources/signed-media/
 *   - Public key for verification available via --show-key
 *
 * Requirements:
 *   - GPG keys must exist in gpg-keys/admin_private.asc and gpg-keys/admin_pubkey.asc
 */

const openpgp = require('openpgp');
const fs = require('fs');
const path = require('path');

const GPG_KEYS_DIR = path.join(__dirname, '../gpg-keys');
const KEYS_DIR = path.join(__dirname, '../test/resources/keys');
const MEDIA_DIR = path.join(__dirname, '../test/resources/media');
const SIGNED_MEDIA_DIR = path.join(__dirname, '../test/resources/signed-media');

// Ensure directories exist
[KEYS_DIR, MEDIA_DIR, SIGNED_MEDIA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});


/**
 * Sign a single media file
 */
async function signFile(filePath) {
  try {
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return null;
    }

    // Load private key from gpg-keys directory
    const privateKeyPath = path.join(GPG_KEYS_DIR, 'admin_private.asc');
    if (!fs.existsSync(privateKeyPath)) {
      console.error(`❌ Private key not found at: ${privateKeyPath}`);
      console.error('   Expected location: @user-micro/gpg-keys/admin_private.asc');
      process.exit(1);
    }

    const privateKeyArmored = fs.readFileSync(privateKeyPath, 'utf-8');
    const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });

    // Read file data
    const fileData = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    console.log(`\n📄 Signing file: ${fileName}`);

    // Create message from file binary data
    const message = await openpgp.createMessage({
      binary: fileData,
    });

    // Sign the message with detached signature
    const signatureData = await openpgp.sign({
      message,
      signingKeys: privateKey,
      detached: true,
      format: 'armored',
    });

    // Save signature
    const baseName = path.basename(filePath, path.extname(filePath));
    const signaturePath = path.join(SIGNED_MEDIA_DIR, `${baseName}.sig`);
    fs.writeFileSync(signaturePath, signatureData, 'utf-8');
    console.log(`✅ Signature saved: ${signaturePath}`);

    // Create metadata file with signature info
    const metadataPath = path.join(SIGNED_MEDIA_DIR, `${baseName}.json`);
    const metadata = {
      originalFile: fileName,
      originalPath: filePath,
      signedAt: new Date().toISOString(),
      signatureFile: `${baseName}.sig`,
      hashAlgorithm: 'SHA256',
      usage: 'Use this signature with Postman to test media upload API',
    };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`✅ Signature metadata saved: ${metadataPath}`);

    // Display signature preview
    console.log('\n📋 Signature preview (first 5 lines):');
    const signatureLines = signatureData.split('\n').slice(0, 5);
    signatureLines.forEach(line => console.log(`   ${line}`));
    console.log('   ...');

    return {
      fileName,
      signaturePath,
      signatureData,
      metadataPath,
    };
  } catch (error) {
    console.error(`❌ Error signing file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Sign all media files in the media directory
 */
async function signAllFiles() {
  try {
    // Verify media directory has files
    if (!fs.existsSync(MEDIA_DIR)) {
      console.error(`❌ Media directory not found: ${MEDIA_DIR}`);
      process.exit(1);
    }

    const files = fs.readdirSync(MEDIA_DIR);
    const mediaFiles = files.filter(f => {
      const fullPath = path.join(MEDIA_DIR, f);
      return fs.statSync(fullPath).isFile();
    });

    if (mediaFiles.length === 0) {
      console.log(`⚠️  No media files found in ${MEDIA_DIR}`);
      console.log('📝 Add media files to this folder, then run: npm run sign-media -- --sign-all');
      return;
    }

    console.log(`\n🎯 Found ${mediaFiles.length} media file(s) to sign`);

    const results = [];
    for (const file of mediaFiles) {
      const filePath = path.join(MEDIA_DIR, file);
      const result = await signFile(filePath);
      if (result) {
        results.push(result);
      }
    }

    // Create summary file
    const summaryPath = path.join(SIGNED_MEDIA_DIR, 'SIGNATURE_SUMMARY.md');
    let summary = '# Signed Media Files Summary\n\n';
    summary += `Generated: ${new Date().toISOString()}\n\n`;
    summary += '## Files Signed\n\n';

    results.forEach(result => {
      summary += `### ${result.fileName}\n`;
      summary += `- Signature file: \`${path.basename(result.signaturePath)}\`\n`;
      summary += `- Metadata: \`${path.basename(result.metadataPath)}\`\n\n`;
    });

    summary += '## Usage Instructions\n\n';
    summary += '1. Upload the signed file using the Media Service API\n';
    summary += '2. Include the signature in the request body\n';
    summary += '3. Example curl:\n';
    summary += '```bash\n';
    summary += 'curl -X POST http://localhost:3000/api/v1/media \\n';
    summary += '  -H "Authorization: Bearer <JWT_TOKEN>" \\n';
    summary += '  -F "file=@test/resources/media/<filename>" \\n';
    summary += '  -F "signature=<paste-signature-content>" \\n';
    summary += '  -F "tripId=<trip-id>"\n';
    summary += '```\n';

    fs.writeFileSync(summaryPath, summary, 'utf-8');
    console.log(`\n✅ Summary saved: ${summaryPath}`);

    console.log('\n✨ All files signed successfully!');
  } catch (error) {
    console.error('❌ Error signing all files:', error.message);
    process.exit(1);
  }
}

/**
 * Display public key for copying
 */
function displayPublicKey() {
  const publicKeyPath = path.join(GPG_KEYS_DIR, 'admin_pubkey.asc');
  if (!fs.existsSync(publicKeyPath)) {
    console.error(`❌ Public key not found at: ${publicKeyPath}`);
    console.error('   Expected location: @user-micro/gpg-keys/admin_pubkey.asc');
    process.exit(1);
  }

  const publicKey = fs.readFileSync(publicKeyPath, 'utf-8');
  console.log('\n📋 Public Key (copy this to User Service):');
  console.log('=====================================');
  console.log(publicKey);
  console.log('=====================================\n');
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🔐 Media File Signing Tool

Usage:
  npm run sign-media -- --sign <file-path>          Sign a single media file
  npm run sign-media -- --sign-all                  Sign all files in media folder
  npm run sign-media -- --show-key                  Display public key for copying

Directories:
  GPG Keys: ${GPG_KEYS_DIR}
  Media: ${MEDIA_DIR}
  Signed: ${SIGNED_MEDIA_DIR}

This tool uses pre-generated GPG keys from @user-micro/gpg-keys:
  - admin_private.asc (private key for signing)
  - admin_pubkey.asc (public key for verification)
    `);
    return;
  }

  const command = args[0];

  switch (command) {
    case '--sign':
      if (!args[1]) {
        console.error('❌ Please specify a file path: npm run sign-media -- --sign <file-path>');
        process.exit(1);
      }
      await signFile(args[1]);
      break;

    case '--sign-all':
      await signAllFiles();
      break;

    case '--show-key':
      displayPublicKey();
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.error('Use: npm run sign-media for usage information');
      process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
