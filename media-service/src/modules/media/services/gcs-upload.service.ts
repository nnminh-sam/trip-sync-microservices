import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage, Bucket } from '@google-cloud/storage';

export interface UploadResult {
  success: boolean;
  gcsUrl?: string;
  publicUrl?: string;
  error?: string;
}

@Injectable()
export class GcsUploadService {
  private readonly logger = new Logger(GcsUploadService.name);
  private bucket: Bucket;

  constructor(private readonly configService: ConfigService) {
    this.initializeBucket();
  }

  /**
   * Initialize GCS bucket connection
   */
  private initializeBucket(): void {
    const projectId = this.configService.get<string>('gcs.projectId');
    const bucketName = this.configService.get<string>('gcs.bucketName');

    if (!projectId || !bucketName) {
      this.logger.warn('GCS configuration incomplete - uploads may fail');
      return;
    }

    try {
      const storageConfig: any = {
        projectId,
      };

      // Try key filename first
      const keyFilename = this.configService.get<string>('gcs.keyFilename');
      if (keyFilename) {
        storageConfig.keyFilename = keyFilename;
      } else {
        // Fall back to embedded credentials
        const clientEmail = this.configService.get<string>('gcs.clientEmail');
        const privateKey = this.configService.get<string>('gcs.privateKey');

        if (clientEmail && privateKey) {
          storageConfig.credentials = {
            client_email: clientEmail,
            private_key: privateKey,
          };
        }
      }

      const storage = new Storage(storageConfig);
      this.bucket = storage.bucket(bucketName);
      this.logger.debug(`GCS bucket initialized: ${bucketName}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize GCS bucket: ${errorMessage}`);
    }
  }

  /**
   * Upload file to GCS
   * @param fileBuffer - The file content as Buffer
   * @param filename - The filename for storage
   * @param metadata - Optional metadata (contentType, etc.)
   * @returns UploadResult with GCS URL
   */
  async uploadFile(
    fileBuffer: Buffer,
    filename: string,
    metadata?: { contentType?: string; [key: string]: any },
  ): Promise<UploadResult> {
    try {
      if (!this.bucket) {
        throw new BadRequestException('GCS bucket not initialized');
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        throw new BadRequestException('File buffer is empty');
      }

      if (!filename || filename.trim() === '') {
        throw new BadRequestException('Filename is required');
      }

      // Sanitize filename
      const sanitizedFilename = this.sanitizeFilename(filename);

      // Create file object
      const file = this.bucket.file(sanitizedFilename);

      // Prepare upload options
      const uploadOptions: any = {
        metadata: {
          contentType: metadata?.contentType || 'application/octet-stream',
        },
      };

      // Add custom metadata if provided
      if (metadata && Object.keys(metadata).length > 0) {
        uploadOptions.metadata.metadata = metadata;
      }

      // Upload the file
      await file.save(fileBuffer, uploadOptions);

      const gcsUrl = `gs://${this.bucket.name}/${sanitizedFilename}`;
      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${sanitizedFilename}`;

      this.logger.debug(`File uploaded successfully: ${gcsUrl}`);

      return {
        success: true,
        gcsUrl,
        publicUrl,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to upload file to GCS: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Delete file from GCS
   * @param filename - The filename to delete
   * @returns boolean indicating success
   */
  async deleteFile(filename: string): Promise<boolean> {
    try {
      if (!this.bucket) {
        throw new BadRequestException('GCS bucket not initialized');
      }

      const file = this.bucket.file(filename);
      await file.delete();

      this.logger.debug(`File deleted successfully: ${filename}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete file from GCS: ${errorMessage}`);
      return false;
    }
  }

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
      if (!this.bucket) {
        throw new BadRequestException('GCS bucket not initialized');
      }

      if (!filename || filename.trim() === '') {
        throw new BadRequestException('Filename is required');
      }

      const file = this.bucket.file(filename);

      // Check if file exists before generating signed URL
      const [exists] = await file.exists();
      if (!exists) {
        // Log detailed error with bucket info for debugging
        this.logger.error(
          `File not found in bucket '${this.bucket.name}': ${filename}`,
        );
        throw new BadRequestException(`File not found: ${filename}`);
      }

      // Generate signed URL with v4 signature
      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
      });

      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      this.logger.debug(
        `Generated signed URL for ${filename}, expires in ${expiresIn}s`,
      );

      return {
        success: true,
        signedUrl,
        expiresAt,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to generate signed URL for ${filename}: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if file exists in GCS
   * @param filename - The filename to check
   * @returns boolean indicating existence
   */
  async fileExists(filename: string): Promise<boolean> {
    try {
      if (!this.bucket) {
        return false;
      }

      const file = this.bucket.file(filename);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error checking file existence: ${errorMessage}`,
      );
      return false;
    }
  }

  /**
   * Sanitize filename for safe storage
   * @param filename - The original filename
   * @returns Sanitized filename
   */
  private sanitizeFilename(filename: string): string {
    // Remove any path separators and special characters
    return filename
      .replace(/[\/\\]/g, '_')
      .replace(/[<>:"|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 255); // GCS filename limit
  }
}
