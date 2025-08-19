import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage, Bucket } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import { FileUploadResponseDto } from '../dtos/file-upload.dto';
import { throwRpcException } from 'src/utils';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private storage: Storage;
  private bucket: Bucket;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.initializeGCS();
  }

  private initializeGCS() {
    try {
      const projectId = this.configService.get<string>('gcs.projectId');
      const keyFilename = this.configService.get<string>('gcs.keyFilename');
      this.bucketName = this.configService.get<string>('gcs.bucketName');

      this.storage = new Storage({
        projectId,
        keyFilename,
      });

      this.bucket = this.storage.bucket(this.bucketName);
      this.logger.log(`GCS initialized with bucket: ${this.bucketName}`);
    } catch (error) {
      this.logger.error('Failed to initialize GCS', error);
      throw error;
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    taskId: string,
    uploadedBy: string,
    description?: string,
  ): Promise<FileUploadResponseDto> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const fileId = uuidv4();
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `tasks/${taskId}/${fileId}.${fileExtension}`;

      // Create a reference to the file
      const blob = this.bucket.file(fileName);

      // Create write stream with metadata
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.mimetype,
          metadata: {
            taskId,
            uploadedBy,
            originalName: file.originalname,
            description: description || '',
          },
        },
      });

      // Upload file
      await new Promise((resolve, reject) => {
        blobStream.on('error', (error) => {
          this.logger.error(`Failed to upload file: ${error.message}`);
          reject(error);
        });

        blobStream.on('finish', () => {
          this.logger.log(`File uploaded successfully: ${fileName}`);
          resolve(true);
        });

        blobStream.end(file.buffer);
      });

      // Make file publicly accessible (optional - remove if files should be private)
      await blob.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;

      return {
        id: fileId,
        task_id: taskId,
        filename: fileName,
        original_name: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        gcs_url: `gs://${this.bucketName}/${fileName}`,
        public_url: publicUrl,
        uploaded_by: uploadedBy,
        description,
        created_at: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to upload file to GCS', error);
      throwRpcException({
        message: 'Failed to upload file',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        details: error.message || error,
      });
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    taskId: string,
    uploadedBy: string,
    description?: string,
  ): Promise<FileUploadResponseDto[]> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadFile(file, taskId, uploadedBy, description),
      );

      return await Promise.all(uploadPromises);
    } catch (error) {
      this.logger.error('Failed to upload multiple files', error);
      throwRpcException({
        message: 'Failed to upload files',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        details: error.message || error,
      });
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      await this.bucket.file(fileName).delete();
      this.logger.log(`File deleted successfully: ${fileName}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${fileName}`, error);
      throwRpcException({
        message: 'Failed to delete file',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        details: error.message || error,
      });
    }
  }

  async getSignedUrl(fileName: string, expiresInMinutes = 60): Promise<string> {
    try {
      const options = {
        version: 'v4' as const,
        action: 'read' as const,
        expires: Date.now() + expiresInMinutes * 60 * 1000,
      };

      const [url] = await this.bucket.file(fileName).getSignedUrl(options);
      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL for: ${fileName}`,
        error,
      );
      throwRpcException({
        message: 'Failed to generate download URL',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        details: error.message || error,
      });
    }
  }

  private validateFile(file: Express.Multer.File): void {
    const maxSize = this.configService.get<number>('gcs.maxFileSize');
    console.log('🚀 ~ FileUploadService ~ validateFile ~ maxSize:', maxSize);
    const allowedMimeTypes = this.configService.get<string[]>(
      'gcs.allowedMimeTypes',
    );

    console.log(
      '🚀 ~ FileUploadService ~ validateFile ~ file.size:',
      file.size,
    );
    if (file.size > maxSize) {
      throwRpcException({
        message: `File size exceeds maximum allowed size of ${maxSize} bytes`,
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throwRpcException({
        message: `File type ${file.mimetype} is not allowed`,
        statusCode: HttpStatus.BAD_REQUEST,
        details: {
          allowed: allowedMimeTypes,
          received: file.mimetype,
        },
      });
    }
  }

  async listTaskFiles(taskId: string): Promise<any[]> {
    try {
      const [files] = await this.bucket.getFiles({
        prefix: `tasks/${taskId}/`,
      });

      return files.map((file) => ({
        name: file.name,
        size: file.metadata.size,
        contentType: file.metadata.contentType,
        created: file.metadata.timeCreated,
        updated: file.metadata.updated,
        metadata: file.metadata.metadata,
      }));
    } catch (error) {
      this.logger.error(`Failed to list files for task: ${taskId}`, error);
      throwRpcException({
        message: 'Failed to list task files',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        details: error.message || error,
      });
    }
  }
}
