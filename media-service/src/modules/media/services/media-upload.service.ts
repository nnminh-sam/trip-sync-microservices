import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GnuPgVerificationService,
  SignatureVerificationResult,
} from './gnupg-verification.service';
import { GcsUploadService, UploadResult } from './gcs-upload.service';
import { MediaService } from '../media.service';
import { CreateMediaDto } from '../dtos';
import { Media } from '../../../models';
import { EnvSchema } from 'src/config';
import { MediaStatusEnum } from 'src/models/enums/media-status.enum';
import { setTimeout } from 'node:timers/promises';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

export type VerificationPayload = {
  jwtToken: string;
  signature: string;
  metadata: string;
};

export interface MediaUploadRequest {
  uploaderId: string;
  verification: {
    perform: boolean;
    payload?: VerificationPayload;
  };
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
  private readonly bucketName: string;

  constructor(
    private readonly gnuPgVerificationService: GnuPgVerificationService,
    private readonly gcsUploadService: GcsUploadService,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,

    private readonly configService: ConfigService<EnvSchema>,
  ) {
    this.bucketName = configService.get('GCS_BUCKET_NAME');
  }

  async uploadMediaWithSignature(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
    fileSize: number,
    uploadRequest: MediaUploadRequest,
  ): Promise<MediaUploadResponse> {
    try {
      const { uploaderId, verification } = uploadRequest;

      // Validate file
      this.validateFile(fileSize, mimetype);

      if (verification.perform) {
        await this.verifySignature(verification.payload);
      }

      const storageFilename = this.generateStorageFilename(
        uploaderId,
        filename,
      );

      const sanitizedFilename = this.sanitizeFilename(storageFilename);

      const gcsUrl = `gs://${this.bucketName}/${sanitizedFilename}`;
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${sanitizedFilename}`;

      const createMediaDto: CreateMediaDto = {
        filename: storageFilename,
        originalName: filename,
        mimetype,
        size: fileSize,
        gcsUrl,
        publicUrl,
      };
      this.logger.debug(
        `Creating an attachment with this payload: ${JSON.stringify(createMediaDto)}`,
      );
      const media = this.mediaRepository.create({
        uploaderId,
        status: MediaStatusEnum.NOT_READY,
        ...createMediaDto,
      });
      const savedMedia = await this.mediaRepository.save(media);
      this.logger.log(`Attachment created successfully: ${savedMedia.id}`);

      this.gcsUploadService
        .uploadFile({
          fileBuffer,
          filename: sanitizedFilename,
          metadata: { contentType: mimetype },
        })
        .then(async () => {
          media.status = MediaStatusEnum.READY;
          await this.mediaRepository.save(media);
          this.logger.log(`Media ${media.id} is ready`);
        });

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

  private async verifySignature(payload: VerificationPayload) {
    this.logger.debug(
      `Performing verification process with payload: ${payload}`,
    );

    await setTimeout(200);
  }

  /**
   * Validate file before upload
   */
  private validateFile(size: number, mimetype: string): void {
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
