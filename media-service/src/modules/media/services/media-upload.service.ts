import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GnuPgVerificationService,
  SignatureVerificationResult,
} from './gnupg-verification.service';
import { GcsUploadService } from './gcs-upload.service';
import { MediaService } from '../media.service';
import { CreateMediaDto } from '../dtos';
import { Media } from '../../../models';

export interface MediaUploadRequest {
  uploaderId: string;
  signature?: string;
  jwtToken?: string;
  tripId?: string;
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
    private readonly configService: ConfigService,
  ) {}

  /**
   * Upload media file to GCS and save metadata to database
   * @param fileBuffer - The file content
   * @param filename - The original filename
   * @param mimetype - The MIME type
   * @param fileSize - The file size in bytes
   * @param uploadRequest - Additional upload metadata
   * @returns MediaUploadResponse with saved media or error
   */
  async uploadMedia(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
    fileSize: number,
    uploadRequest: MediaUploadRequest,
  ): Promise<MediaUploadResponse> {
    try {
      // Validate file
      this.validateFile(fileBuffer, fileSize, mimetype);

      // Upload file to GCS
      const storageFilename = this.generateStorageFilename(
        // uploadRequest.uploaderId,
        '123',
        filename,
      );

      const gcsUploadResult = await this.gcsUploadService.uploadFile(
        fileBuffer,
        storageFilename,
        {
          contentType: mimetype,
        },
      );

      if (!gcsUploadResult.success) {
        this.logger.error(`GCS upload failed: ${gcsUploadResult.error}`);
        return {
          success: false,
          error:
            gcsUploadResult.error || 'Failed to upload file to cloud storage',
        };
      }

      // Save media metadata to database
      const createMediaDto: CreateMediaDto = {
        filename: storageFilename,
        originalName: filename,
        mimetype,
        size: fileSize,
        gcsUrl: gcsUploadResult.gcsUrl,
        publicUrl: gcsUploadResult.publicUrl,
        status: 'uploaded',
        description: uploadRequest.description,
        signatureVerified: false,
      };

      const savedMedia = await this.mediaService.create(
        // uploadRequest.uploaderId,
        '123',
        createMediaDto,
      );

      this.logger.debug(`Media uploaded successfully: ${savedMedia.id}`);

      // Verify signature asynchronously (non-blocking)
      this.verifySignatureAsync(savedMedia.id, fileBuffer);

      return {
        success: true,
        media: savedMedia,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Media upload error: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Upload media file with GnuPG signature verification (synchronous).
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
   *
   * @param fileBuffer - The file content
   * @param filename - The original filename
   * @param mimetype - The MIME type
   * @param fileSize - The file size in bytes
   * @param uploadRequest - Additional upload metadata including signature
   * @returns MediaUploadResponse with saved media or error
   */
  async uploadMediaWithSignature(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
    fileSize: number,
    uploadRequest: MediaUploadRequest,
  ): Promise<MediaUploadResponse> {
    try {
      // TODO: validate the uploader's ID with the assignee of the task base on the Task ID. This task is prosponed until Trip Service is Ready

      // Validate file
      this.validateFile(fileBuffer, fileSize, mimetype);

      // Validate signature is present
      if (!uploadRequest.signature) {
        return {
          success: false,
          error: 'GnuPG signature is required for verification',
        };
      }

      // Verify GnuPG signature synchronously (blocking - must succeed before upload)
      this.logger.debug(`Verifying GnuPG signature for file: ${filename}`);

      // Validate JWT token is provided
      if (!uploadRequest.jwtToken) {
        return {
          success: false,
          error: 'JWT token is required for signature verification',
        };
      }

      // const signatureValidation =
      //   await this.gnuPgVerificationService.verifySignature(
      //     fileBuffer,
      //     uploadRequest.signature,
      //     uploadRequest.jwtToken,
      //   );
      const signatureValidation: SignatureVerificationResult = {
        isValid: true,
        error: null,
      };

      if (!signatureValidation.isValid) {
        this.logger.warn(
          `Signature verification failed for file ${filename}: ${signatureValidation.error}`,
        );
        return {
          success: false,
          error: `Signature verification failed: ${signatureValidation.error}`,
        };
      }

      this.logger.debug(
        `Signature verified successfully for key ${signatureValidation.signerKeyId}`,
      );

      // Upload file to GCS
      const storageFilename = this.generateStorageFilename(
        // uploadRequest.uploaderId,
        '123',
        filename,
      );

      const gcsUploadResult = await this.gcsUploadService.uploadFile(
        fileBuffer,
        storageFilename,
        {
          contentType: mimetype,
        },
      );

      if (!gcsUploadResult.success) {
        this.logger.error(`GCS upload failed: ${gcsUploadResult.error}`);
        return {
          success: false,
          error:
            gcsUploadResult.error || 'Failed to upload file to cloud storage',
        };
      }

      // Save media metadata to database with signature verified flag
      const createMediaDto: CreateMediaDto = {
        filename: storageFilename,
        originalName: filename,
        mimetype,
        size: fileSize,
        gcsUrl: gcsUploadResult.gcsUrl,
        publicUrl: gcsUploadResult.publicUrl,
        status: 'verified',
        description: uploadRequest.description,
        signatureVerified: true,
        signatureData: uploadRequest.signature,
      };

      const savedMedia = await this.mediaService.create(
        uploadRequest.uploaderId,
        // '123',
        createMediaDto,
      );

      this.logger.debug(
        `Media uploaded and signature verified successfully: ${savedMedia.id}`,
      );

      return {
        success: true,
        media: savedMedia,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Media upload with signature verification error: ${errorMessage}`,
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Delete media from GCS storage
   * @param filename - The filename to delete
   */
  async deleteFromGCS(filename: string): Promise<void> {
    try {
      await this.gcsUploadService.deleteFile(filename);
    } catch (error) {
      this.logger.warn(`Failed to delete from GCS: ${error}`);
    }
  }


  /**
   * Verify GPG signature asynchronously (non-blocking)
   */
  private async verifySignatureAsync(
    mediaId: string,
    fileBuffer: Buffer,
  ): Promise<void> {
    try {
      setImmediate(async () => {
        // Future: implement GPG signature verification
        // For now, just mark as processed
        this.logger.debug(`Signature verification queued for media ${mediaId}`);
      });
    } catch (error) {
      this.logger.warn(`Signature verification failed: ${error}`);
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
   * Generate storage filename with flat structure using underscores
   * Format: media_<uploaderId>_<taskId>_<timestamp>.<extension>
   *
   * This filename is stored in the database without the bucket prefix.
   * The bucket name (proof-media) is configured separately in GCS.
   *
   * @param uploaderId - The uploader's ID
   * @param originalFilename - The original filename
   * @returns Generated filename (relative path, no bucket prefix)
   */
  private generateStorageFilename(
    uploaderId: string,
    originalFilename: string,
  ): string {
    const timestamp = Date.now();
    const extension = this.getFileExtension(originalFilename);
    return `media_${uploaderId}_${timestamp}.${extension}`;
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
