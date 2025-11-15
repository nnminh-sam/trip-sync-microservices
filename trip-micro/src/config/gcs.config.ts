import { registerAs } from '@nestjs/config';

export default registerAs('gcs', () => ({
  projectId: process.env.GCS_PROJECT_ID || 'trip-sync-project',
  bucketName: process.env.GCS_BUCKET_NAME || 'trip-sync-files',
  keyFilename: process.env.GCS_KEY_FILE || './gcs-credentials.json',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document').split(','),
}));

