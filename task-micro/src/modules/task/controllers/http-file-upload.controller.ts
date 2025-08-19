import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '../services/file-upload.service';
import { FileUploadDto } from '../dtos/file-upload.dto';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('File Upload')
@Controller('http/files')
export class HttpFileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file directly to task service' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        task_id: {
          type: 'string',
        },
        uploaded_by: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
      },
      required: ['file', 'task_id', 'uploaded_by'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: FileUploadDto,
  ) {
    try {
      if (!file) {
        throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
      }

      const result = await this.fileUploadService.uploadFile(
        file,
        data.task_id,
        data.uploaded_by,
        data.description,
      );

      return {
        success: true,
        data: result,
        message: 'File uploaded successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to upload file',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}