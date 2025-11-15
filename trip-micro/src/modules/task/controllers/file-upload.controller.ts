import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Get,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FileUploadService } from '../services/file-upload.service';
import { FileUploadDto, BulkFileUploadDto } from '../dtos/file-upload.dto';
import { throwRpcException } from 'src/utils';
import { MessagePayloadDto } from 'src/dtos/message-payload.dto';

@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @MessagePattern('task.upload.single')
  async uploadSingleFile(
    @Payload() payload: MessagePayloadDto<{ file: any; data: FileUploadDto }>,
  ) {
    try {
      const { file, data } = payload.request.body;
      
      if (!file) {
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'No file provided',
        });
      }

      // Convert base64 to buffer if needed
      const fileBuffer = Buffer.isBuffer(file.buffer) 
        ? file.buffer 
        : Buffer.from(file.buffer, 'base64');

      const multerFile: Express.Multer.File = {
        fieldname: file.fieldname || 'file',
        originalname: file.originalname,
        encoding: file.encoding || '7bit',
        mimetype: file.mimetype,
        buffer: fileBuffer,
        size: file.size || fileBuffer.length,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      return await this.fileUploadService.uploadFile(
        multerFile,
        data.task_id,
        data.uploaded_by,
        data.description,
      );
    } catch (error) {
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to upload file',
        details: error.message,
      });
    }
  }

  @MessagePattern('task.upload.multiple')
  async uploadMultipleFiles(
    @Payload() payload: MessagePayloadDto<{ files: any[]; data: BulkFileUploadDto }>,
  ) {
    try {
      const { files, data } = payload.request.body;

      if (!files || files.length === 0) {
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'No files provided',
        });
      }

      const multerFiles: Express.Multer.File[] = files.map((file) => {
        const fileBuffer = Buffer.isBuffer(file.buffer) 
          ? file.buffer 
          : Buffer.from(file.buffer, 'base64');

        return {
          fieldname: file.fieldname || 'files',
          originalname: file.originalname,
          encoding: file.encoding || '7bit',
          mimetype: file.mimetype,
          buffer: fileBuffer,
          size: file.size || fileBuffer.length,
          stream: null,
          destination: '',
          filename: '',
          path: '',
        };
      });

      return await this.fileUploadService.uploadMultipleFiles(
        multerFiles,
        data.task_id,
        data.uploaded_by,
        data.description,
      );
    } catch (error) {
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to upload files',
        details: error.message,
      });
    }
  }

  @MessagePattern('task.files.list')
  async listTaskFiles(@Payload() payload: MessagePayloadDto) {
    try {
      const { taskId } = payload.request.path;
      
      if (!taskId) {
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Task ID is required',
        });
      }

      return await this.fileUploadService.listTaskFiles(taskId);
    } catch (error) {
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to list task files',
        details: error.message,
      });
    }
  }

  @MessagePattern('task.file.delete')
  async deleteFile(@Payload() payload: MessagePayloadDto<{ fileName: string }>) {
    try {
      const { fileName } = payload.request.body;
      
      if (!fileName) {
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'File name is required',
        });
      }

      await this.fileUploadService.deleteFile(fileName);
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete file',
        details: error.message,
      });
    }
  }

  @MessagePattern('task.file.signedUrl')
  async getSignedUrl(@Payload() payload: MessagePayloadDto<{ fileName: string; expiresInMinutes?: number }>) {
    try {
      const { fileName, expiresInMinutes } = payload.request.body;
      
      if (!fileName) {
        throwRpcException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'File name is required',
        });
      }

      const url = await this.fileUploadService.getSignedUrl(fileName, expiresInMinutes);
      return { url, expiresIn: expiresInMinutes || 60 };
    } catch (error) {
      throwRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to generate signed URL',
        details: error.message,
      });
    }
  }
}