import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';

export interface MediaMetadata {
  location?: { lat: number; lng: number };
  timestamp: Date;
  uploadedBy: string;
  tripId: string;
  taskId?: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class MediaHandlerService {
  private readonly logger = new Logger(MediaHandlerService.name);
  private storage: Storage;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.initializeStorage();
  }

  private initializeStorage() {
    try {
      const keyFile = this.configService.get<string>('GCS_KEY_FILE');
      const projectId = this.configService.get<string>('GCS_PROJECT_ID');
      this.bucketName = this.configService.get<string>('GCS_BUCKET_NAME');

      if (keyFile && projectId) {
        this.storage = new Storage({
          projectId,
          keyFilename: keyFile,
        });
        this.logger.log('Google Cloud Storage initialized successfully');
      } else {
        this.logger.warn('GCS configuration missing, media handling disabled');
      }
    } catch (error) {
      this.logger.error('Failed to initialize GCS:', error);
    }
  }

  async generateSignedUrl(fileName: string, expiresInMinutes: number = 60): Promise<string> {
    if (!this.storage) {
      throw new Error('Storage not initialized');
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresInMinutes * 60 * 1000,
      });

      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for ${fileName}:`, error);
      throw error;
    }
  }

  async getMediaMetadata(fileName: string): Promise<MediaMetadata | null> {
    if (!this.storage) {
      return null;
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      const [metadata] = await file.getMetadata();

      return metadata.metadata as unknown as MediaMetadata;
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${fileName}:`, error);
      return null;
    }
  }

  async validateMediaFile(fileName: string, maxSizeMB: number = 100): Promise<boolean> {
    if (!this.storage) {
      return false;
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      const [exists] = await file.exists();

      if (!exists) {
        return false;
      }

      const [metadata] = await file.getMetadata();
      const sizeInMB = parseInt(String(metadata.size)) / (1024 * 1024);

      return sizeInMB <= maxSizeMB;
    } catch (error) {
      this.logger.error(`Failed to validate media file ${fileName}:`, error);
      return false;
    }
  }

  async listMediaByTrip(tripId: string): Promise<string[]> {
    if (!this.storage) {
      return [];
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [files] = await bucket.getFiles({
        prefix: `trips/${tripId}/`,
      });

      return files.map(file => file.name);
    } catch (error) {
      this.logger.error(`Failed to list media for trip ${tripId}:`, error);
      return [];
    }
  }

  async deleteMedia(fileName: string): Promise<boolean> {
    if (!this.storage) {
      return false;
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      await file.delete();
      
      this.logger.log(`Successfully deleted media file: ${fileName}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete media file ${fileName}:`, error);
      return false;
    }
  }

  formatMediaUrl(fileName: string): string {
    return `gs://${this.bucketName}/${fileName}`;
  }
}