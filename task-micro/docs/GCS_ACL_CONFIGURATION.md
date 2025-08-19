# GCS Bucket ACL Configuration Guide

## Overview
This guide explains how to disable Uniform Bucket-Level Access and enable fine-grained ACLs for Google Cloud Storage buckets used by the Task microservice.

## Why Disable Uniform Bucket-Level Access?

Uniform Bucket-Level Access (UBLA) uses IAM policies exclusively for access control. While this is simpler, it doesn't allow fine-grained permissions on individual objects. By disabling UBLA and enabling ACLs, you can:

- Set different permissions for each file
- Make individual files public while keeping others private
- Grant temporary access to specific users
- Implement more complex access patterns

## Running the Configuration Script

### Prerequisites
1. Ensure you have the required environment variables set:
   ```bash
   GCS_PROJECT_ID=your-project-id
   GCS_BUCKET_NAME=your-bucket-name
   GCS_KEY_FILE=./gcs-credentials.json
   ```

2. Install dependencies if not already installed:
   ```bash
   npm install @google-cloud/storage
   ```

### Execute the Script
```bash
# From the task-micro directory
node scripts/disable-uniform-bucket-access.js
```

## Important Notes

### ⚠️ Locked Buckets
- If Uniform Bucket-Level Access has been enabled for 90 days, it becomes **permanently locked**
- Locked buckets cannot have ACLs re-enabled
- You would need to create a new bucket without UBLA enabled

### Service Account Permissions
Your service account needs the following permissions:
- `storage.buckets.get` - Read bucket metadata
- `storage.buckets.update` - Modify bucket settings
- `storage.objects.get` - Read objects
- `storage.objects.create` - Create objects
- `storage.objects.delete` - Delete objects
- `storage.objects.setIamPolicy` - Set object ACLs (when ACLs are enabled)

## Using ACLs in Code

### Making a File Public
```javascript
const file = bucket.file('path/to/file.pdf');
await file.makePublic();
// File is now accessible at: https://storage.googleapis.com/bucket-name/path/to/file.pdf
```

### Making a File Private
```javascript
const file = bucket.file('path/to/file.pdf');
await file.makePrivate();
```

### Granting Read Access to Specific User
```javascript
const file = bucket.file('path/to/file.pdf');
await file.acl.add({
  entity: 'user-email@example.com',
  role: storage.acl.READER_ROLE,
});
```

### Setting ACL During Upload
```javascript
const file = bucket.file('path/to/new-file.pdf');
const stream = file.createWriteStream({
  metadata: {
    contentType: 'application/pdf',
  },
  predefinedAcl: 'private', // Options: 'private', 'publicRead', 'projectPrivate', etc.
});
```

## Predefined ACLs

When uploading files, you can use these predefined ACLs:

| ACL | Description |
|-----|-------------|
| `authenticatedRead` | Object owner gets OWNER access. All authenticated users get READER access. |
| `bucketOwnerFullControl` | Object owner gets OWNER access. Bucket owner gets OWNER access. |
| `bucketOwnerRead` | Object owner gets OWNER access. Bucket owner gets READER access. |
| `private` | Object owner gets OWNER access. |
| `projectPrivate` | Object owner gets OWNER access. Project members get access according to their roles. |
| `publicRead` | Object owner gets OWNER access. All users get READER access. |

## Updating the File Upload Service

To use ACLs in the file upload service, you can modify the upload method:

```typescript
// In file-upload.service.ts
async uploadFile(
  file: Express.Multer.File,
  taskId: string,
  uploadedBy: string,
  description?: string,
  makePublic: boolean = false, // Add parameter to control access
): Promise<FileUploadResponseDto> {
  // ... existing code ...

  const gcsFile = this.bucket.file(fileName);
  const stream = gcsFile.createWriteStream({
    metadata: {
      contentType: file.mimetype,
      metadata: {
        taskId,
        uploadedBy,
        description,
        originalName: file.originalname,
      },
    },
    predefinedAcl: makePublic ? 'publicRead' : 'private',
  });

  // ... rest of upload logic ...

  // Optionally set custom ACL after upload
  if (!makePublic) {
    // Grant read access to specific users/groups if needed
    await gcsFile.acl.add({
      entity: `user-${uploadedBy}@example.com`,
      role: storage.acl.READER_ROLE,
    });
  }
}
```

## Verification

After running the script, you can verify ACLs are enabled:

1. **Via Console**: 
   - Go to Cloud Console > Storage > Browser
   - Click on your bucket
   - Go to "Configuration" tab
   - Check "Access control" - should show "Fine-grained"

2. **Via CLI**:
   ```bash
   gsutil bucketpolicyonly get gs://your-bucket-name
   ```
   Should show: `Bucket Policy Only setting for gs://your-bucket-name: Enabled: False`

3. **Via Code**:
   Run the script again - it will show the current configuration

## Rollback

If you need to re-enable Uniform Bucket-Level Access:

```javascript
await bucket.setMetadata({
  iamConfiguration: {
    uniformBucketLevelAccess: {
      enabled: true,
    },
  },
});
```

⚠️ **Warning**: After 90 days with UBLA enabled, it becomes locked and cannot be disabled.

## Troubleshooting

| Error | Solution |
|-------|----------|
| Permission denied (403) | Ensure service account has `storage.buckets.update` permission |
| Bucket not found (404) | Check bucket name in environment variables |
| Bucket is locked | Create a new bucket without UBLA enabled |
| ACL operations fail | Verify ACLs are enabled and service account has appropriate permissions |

## Security Best Practices

1. **Default to Private**: Always make files private by default
2. **Use Signed URLs**: For temporary access, use signed URLs instead of making files public
3. **Audit ACLs Regularly**: Periodically review object ACLs to ensure proper access control
4. **Principle of Least Privilege**: Grant minimum necessary permissions
5. **Use Service Accounts**: Avoid using user accounts for application access