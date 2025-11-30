import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { GnuPgVerificationService, VerificationResult } from './gnupg-verification.service';
import { GcsUploadService, UploadResult } from './gcs-upload.service';
import { MediaService } from '../media.service';
import { CreateMediaDto } from '../dtos';
import { Media } from '../../../models';

export interface MediaUploadRequest {
  taskId?: string;
  uploaderId: string;
  signature: string; // GPG detached signature
  description?: string;
}

export interface MediaUploadValidationResult {
  isValid: boolean;
  error?: string;
  publicKey?: string;
  signerKeyId?: string;
}

export interface MediaUploadResponse {
  success: boolean;
  media?: Media;
  error?: string;
}

@Injectable()
export class MediaUploadService {
  private readonly logger = new Logger(MediaUploadService.name);

  constructor(
    private readonly gnuPgVerificationService: GnuPgVerificationService,
    private readonly gcsUploadService: GcsUploadService,
    private readonly mediaService: MediaService,
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
  ) {}

  /**
   * Validate media upload with GPG signature verification
   * @param fileBuffer - The file content
   * @param signatureArmored - The detached GPG signature
   * @param uploaderId - The ID of the uploader
   * @returns ValidationResult with public key and signer info
   */
  async validateMediaUpload(
    fileBuffer: Buffer,
    signatureArmored: string,
    uploaderId: string,
  ): Promise<MediaUploadValidationResult> {
    try {
      // Step 1: Fetch user's public key from User Service
      const publicKeyResponse = await this.fetchPublicKey(uploaderId);

      if (!publicKeyResponse.publicKey) {
        return {
          isValid: false,
          error: 'User public key not found. Please update your GPG public key first.',
        };
      }

      // Step 2: Verify GPG signature
      const verificationResult = await this.gnuPgVerificationService.verifyDetachedSignature(
        fileBuffer,
        signatureArmored,
        publicKeyResponse.publicKey,
      );

      if (!verificationResult.isValid) {
        this.logger.warn(
          `GPG signature verification failed for user: ${uploaderId}`,
        );
        return {
          isValid: false,
          error: `GPG signature verification failed: ${verificationResult.error || 'Unknown error'}`,
        };
      }

      this.logger.debug(`Media upload validated for user: ${uploaderId}`);

      return {
        isValid: true,
        publicKey: publicKeyResponse.publicKey,
        signerKeyId: verificationResult.signer,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Media validation error: ${errorMessage}`);

      return {
        isValid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Upload media with validation
   * @param fileBuffer - The file content
   * @param filename - The original filename
   * @param signatureArmored - The detached GPG signature
   * @param uploadRequest - Additional upload metadata
   * @returns MediaUploadResponse with saved media or error
   */
  async uploadMedia(
    fileBuffer: Buffer,
    filename: string,
    signatureArmored: string,
    uploadRequest: MediaUploadRequest,
  ): Promise<MediaUploadResponse> {
    try {
      // Step 1: Validate media upload
      const validation = await this.validateMediaUpload(
        fileBuffer,
        signatureArmored,
        uploadRequest.uploaderId,
      );

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Step 2: Upload file to GCS
      const gcsUploadResult = await this.gcsUploadService.uploadFile(
        fileBuffer,
        this.generateStorageFilename(
          uploadRequest.uploaderId,
          uploadRequest.taskId,
          filename,
        ),
        {
          contentType: this.getMimeType(filename),
        },
      );

      if (!gcsUploadResult.success) {
        this.logger.error(`GCS upload failed: ${gcsUploadResult.error}`);
        return {
          success: false,
          error: gcsUploadResult.error || 'Failed to upload file to cloud storage',
        };
      }

      // Step 3: Save media metadata to database
      const createMediaDto: CreateMediaDto = {
        filename: this.generateStorageFilename(
          uploadRequest.uploaderId,
          uploadRequest.taskId,
          filename,
        ),
        originalName: filename,
        mimetype: this.getMimeType(filename),
        size: fileBuffer.length,
        gcsUrl: gcsUploadResult.gcsUrl,
        publicUrl: gcsUploadResult.publicUrl,
        taskId: uploadRequest.taskId,
        status: 'verified',
        description: uploadRequest.description,
        signatureVerified: true,
        signatureData: signatureArmored,
      };

      const savedMedia = await this.mediaService.create(
        uploadRequest.uploaderId,
        createMediaDto,
      );

      this.logger.debug(`Media uploaded successfully: ${savedMedia.id}`);

      return {
        success: true,
        media: savedMedia,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Media upload error: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Fetch user's public key from User Service via NATS RPC
   * @param userId - The user ID
   * @returns Object with publicKey or null if not found
   */
  private async fetchPublicKey(userId: string): Promise<{ publicKey: string | null }> {
    try {
      const response = await firstValueFrom(
        this.natsClient
          .send('user.find.public-key', { userId })
          .pipe(timeout(10000)), // 10 second timeout
      );

      return {
        publicKey: response?.publicKey || null,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to fetch public key from User Service: ${errorMessage}`);

      return {
        publicKey: null,
      };
    }
  }

  /**
   * Generate storage filename with directory structure
   * @param uploaderId - The uploader's ID
   * @param taskId - Optional task ID
   * @param originalFilename - The original filename
   * @returns Generated filename with directory structure
   */
  private generateStorageFilename(
    uploaderId: string,
    taskId: string | undefined,
    originalFilename: string,
  ): string {
    const timestamp = Date.now();
    const extension = this.getFileExtension(originalFilename);

    if (taskId) {
      return `media/${uploaderId}/${taskId}/${timestamp}.${extension}`;
    }

    return `media/${uploaderId}/${timestamp}.${extension}`;
  }

  /**
   * Get MIME type from filename
   * @param filename - The filename
   * @returns MIME type
   */
  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();

    const mimeTypes: { [key: string]: string } = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',

      // Videos
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',

      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      flac: 'audio/flac',
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Get file extension
   * @param filename - The filename
   * @returns File extension
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'bin';
  }
}
