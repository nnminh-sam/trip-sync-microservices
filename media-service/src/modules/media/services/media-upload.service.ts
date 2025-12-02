import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GnuPgVerificationService } from './gnupg-verification.service';
import { GcsUploadService } from './gcs-upload.service';
import { MediaService } from '../media.service';
import { CreateMediaDto } from '../dtos';
import { Media } from '../../../models';
import axios from 'axios';

export interface MediaUploadRequest {
  taskId: string;
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
  private readonly tripServiceUrl: string;

  constructor(
    private readonly gnuPgVerificationService: GnuPgVerificationService,
    private readonly gcsUploadService: GcsUploadService,
    private readonly mediaService: MediaService,
    private readonly configService: ConfigService,
  ) {
    this.tripServiceUrl = this.configService.get('TRIP_SERVICE_URL') || 'http://localhost:3003';
  }

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

      // If tripId provided, verify user access to trip
      // if (uploadRequest.tripId) {
      //   const hasAccess = await this.verifyUserInTrip(
      //     uploadRequest.tripId,
      //     uploadRequest.uploaderId,
      //   );

      //   if (!hasAccess) {
      //     return {
      //       success: false,
      //       error: 'User does not have access to this trip',
      //     };
      //   }
      // }

      // Upload file to GCS
      const storageFilename = this.generateStorageFilename(
        // uploadRequest.uploaderId,
        "123",
        uploadRequest.taskId,
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
          error: gcsUploadResult.error || 'Failed to upload file to cloud storage',
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
        taskId: uploadRequest.taskId,
        status: 'uploaded',
        description: uploadRequest.description,
        signatureVerified: false,
      };

      const savedMedia = await this.mediaService.create(
        // uploadRequest.uploaderId,
        "123",
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
      const errorMessage = error instanceof Error ? error.message : String(error);
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

      const signatureValidation = await this.gnuPgVerificationService.verifySignature(
        fileBuffer,
        uploadRequest.signature,
        uploadRequest.jwtToken,
      );

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
        "123",
        uploadRequest.taskId,
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
          error: gcsUploadResult.error || 'Failed to upload file to cloud storage',
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
        taskId: uploadRequest.taskId,
        status: 'verified',
        description: uploadRequest.description,
        signatureVerified: true,
        signatureData: uploadRequest.signature,
      };

      const savedMedia = await this.mediaService.create(
        // uploadRequest.uploaderId,
        "123",
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Media upload with signature verification error: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Find media by trip ID
   * @param tripId - The trip ID
   * @returns List of media files for the trip
   */
  async findMediaByTripId(
    tripId: string,
  ): Promise<{ data: Media[]; total: number }> {
    try {
      const tasks = await this.getTasksByTripId(tripId);

      if (!tasks || tasks.length === 0) {
        return { data: [], total: 0 };
      }

      const taskIds = tasks.map((t: any) => t.id);
      const mediaList: Media[] = [];

      for (const taskId of taskIds) {
        const media = await this.mediaService.findByTaskId(taskId);
        mediaList.push(...media);
      }

      return {
        data: mediaList,
        total: mediaList.length,
      };
    } catch (error) {
      this.logger.error(`Failed to find media by trip: ${error}`);
      return { data: [], total: 0 };
    }
  }

  /**
   * Generate a signed URL for accessing private GCS files
   *
   * This creates time-limited, authenticated URLs that allow direct
   * download from GCS without requiring JWT on the final download request.
   *
   * @param filename - Storage filename in GCS
   * @param expiresIn - URL expiration time in seconds (default 3600, max 86400)
   * @returns Signed URL with expiration info
   */
  async generateSignedUrl(
    filename: string,
    expiresIn: number = 3600,
  ): Promise<{
    success: boolean;
    signedUrl?: string;
    expiresIn?: number;
    expiresAt?: string;
    error?: string;
  }> {
    try {
      // Validate expiration time
      const maxExpiry = 86400; // 24 hours in seconds
      const minExpiry = 60; // 1 minute in seconds

      let validExpiresIn = expiresIn;
      if (validExpiresIn > maxExpiry) {
        this.logger.warn(
          `Requested expiration ${expiresIn}s exceeds max ${maxExpiry}s, using max`,
        );
        validExpiresIn = maxExpiry;
      }

      if (validExpiresIn < minExpiry) {
        this.logger.warn(
          `Requested expiration ${expiresIn}s is less than minimum ${minExpiry}s, using minimum`,
        );
        validExpiresIn = minExpiry;
      }

      // Generate signed URL via GCS service
      const result = await this.gcsUploadService.generateSignedUrl(
        filename,
        validExpiresIn,
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        signedUrl: result.signedUrl,
        expiresIn: validExpiresIn,
        expiresAt: result.expiresAt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to generate signed URL: ${errorMessage}`);
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
   * Verify if user is a member of the trip
   */
  private async verifyUserInTrip(tripId: string, userId: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.tripServiceUrl}/api/v1/trips/${tripId}/members/${userId}`,
      );
      return response.status === 200;
    } catch (error) {
      this.logger.warn(`Failed to verify user in trip: ${error}`);
      return false;
    }
  }

  /**
   * Get all tasks in a trip
   */
  private async getTasksByTripId(tripId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${this.tripServiceUrl}/api/v1/trips/${tripId}/tasks`,
      );
      return response.data?.data || [];
    } catch (error) {
      this.logger.warn(`Failed to get tasks from trip service: ${error}`);
      return [];
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
   * @param taskId - Optional task ID
   * @param originalFilename - The original filename
   * @returns Generated filename (relative path, no bucket prefix)
   */
  private generateStorageFilename(
    uploaderId: string,
    taskId: string | undefined,
    originalFilename: string,
  ): string {
    const timestamp = Date.now();
    const extension = this.getFileExtension(originalFilename);

    if (taskId) {
      return `media_${uploaderId}_${taskId}_${timestamp}.${extension}`;
    }

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
