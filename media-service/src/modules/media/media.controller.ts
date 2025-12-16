import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Req,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiGatewayGuard } from '../../auth/api-gateway.guard';
import { MediaService } from './media.service';
import { MediaUploadService } from './services';
import { FilterMediaDto } from './dtos';

@ApiTags('media')
@Controller('api/v1/media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(
    private readonly mediaService: MediaService,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

  /**
   * GET /api/v1/media?task-id={taskId}
   *
   * Fetch many media files based on task ID.
   *
   * When task ID is provided:
   * 1. Query media directly by task ID
   * 2. Return all media for that task
   */
  @Get()
  @ApiOperation({
    summary: 'Get media files',
    description:
      'Fetch media files with optional filtering by task ID, uploader ID, or status. Supports pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of media files',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              filename: { type: 'string' },
              originalName: { type: 'string' },
              mimetype: { type: 'string' },
              size: { type: 'number' },
              gcsUrl: { type: 'string' },
              publicUrl: { type: 'string' },
              uploaderId: { type: 'string' },
              taskId: { type: 'string' },
              status: { type: 'string' },
              description: { type: 'string', nullable: true },
              signatureVerified: { type: 'boolean' },
              signatureData: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number' },
      },
    },
  })
  async findMany(@Query() filter: FilterMediaDto) {
    this.logger.debug(`Finding media with filter:`, filter);

    if (filter.taskId) {
      const media = await this.mediaService.findByTaskId(filter.taskId);
      return { data: media, total: media.length };
    }

    return await this.mediaService.findAll(filter);
  }

  /**
   * GET /api/v1/media/{id}
   *
   * Fetch a single media file by its ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get media by ID',
    description: 'Fetch a single media file by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Media file ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Media file details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        filename: { type: 'string' },
        originalName: { type: 'string' },
        mimetype: { type: 'string' },
        size: { type: 'number' },
        gcsUrl: { type: 'string' },
        publicUrl: { type: 'string' },
        uploaderId: { type: 'string' },
        taskId: { type: 'string' },
        status: { type: 'string' },
        description: { type: 'string', nullable: true },
        signatureVerified: { type: 'boolean' },
        signatureData: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Media not found',
  })
  async findById(@Param('id') id: string) {
    this.logger.debug(`Finding media by ID: ${id}`);

    const media = await this.mediaService.findById(id);

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    return this.mapToResponse(media);
  }

  /**
   * POST /api/v1/media?task-id={taskId}
   *
   * Upload a new media file to the media service with GnuPG signature verification.
   *
   * Authentication: Required (JWT Bearer token)
   * Content-Type: multipart/form-data
   * Form Fields:
   * - file (binary, required): Raw media file (image/video)
   * - signature (text, required): GnuPG signature (ASCII armored)
   * - originalFilename (text, required): Original filename for metadata
   * - mimetype (string, required): MIME type for metadata
   *
   * Query Parameters:
   * - task-id (required): Task UUID to associate media with
   *
   * Process:
   * 1. Validate JWT token and extract user ID
   * 2. Validate multipart form fields (file, signature, metadata)
   * 3. Validate file (size, type, format)
   * 4. Verify GnuPG signature against file
   * 5. Upload file to GCS
   * 6. Create media record in database
   * 7. Mark signature as verified
   * 8. Return created media object
   *
   * @param file - Uploaded file buffer (multipart, key: 'file')
   * @param taskId - Task UUID from query parameter (required)
   * @param body - Form body containing signature, originalFilename, mimetype
   * @param req - Express request (contains user info from JWT)
   * @returns Created media object with signatureVerified: true
   */
  @Post()
  @UseGuards(ApiGatewayGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Upload media file',
    description:
      'Upload a new media file with GnuPG signature verification. The file is uploaded to GCS and a media record is created in the database.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'task-id',
    description: 'Task UUID to associate media with',
    required: true,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'signature', 'originalFilename', 'mimetype'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Media file (image/video)',
        },
        signature: {
          type: 'string',
          description: 'GnuPG signature (ASCII armored)',
          example: '-----BEGIN PGP SIGNATURE-----...',
        },
        originalFilename: {
          type: 'string',
          description: 'Original filename for metadata',
          example: 'photo.jpg',
        },
        mimetype: {
          type: 'string',
          description: 'MIME type for metadata',
          example: 'image/jpeg',
          enum: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/quicktime',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Media file uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        filename: { type: 'string' },
        originalName: { type: 'string' },
        mimetype: { type: 'string' },
        size: { type: 'number' },
        gcsUrl: { type: 'string' },
        publicUrl: { type: 'string' },
        uploaderId: { type: 'string' },
        taskId: { type: 'string' },
        status: { type: 'string' },
        description: { type: 'string', nullable: true },
        signatureVerified: { type: 'boolean' },
        signatureData: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing required fields or validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Query('task-id') taskId: string,
    @Body()
    body: { signature: string; originalFilename: string; mimetype: string },
    @Req() req: any,
  ) {
    // Validate file is present
    if (!file) {
      throw new BadRequestException(
        'No file uploaded. Expected form field: "file"',
      );
    }

    // Validate task ID is provided
    if (!taskId) {
      throw new BadRequestException(
        'Task ID is required. Expected query parameter: task-id',
      );
    }

    // Validate signature is present
    if (!body?.signature) {
      throw new BadRequestException(
        'GnuPG signature is required. Expected form field: "signature"',
      );
    }

    // Validate original filename is present
    if (!body?.originalFilename) {
      throw new BadRequestException(
        'Original filename is required. Expected form field: "originalFilename"',
      );
    }

    // Validate MIME type is present
    if (!body?.mimetype) {
      throw new BadRequestException(
        'MIME type is required. Expected form field: "mimetype"',
      );
    }

    this.logger.debug(
      `Uploading media task: ${taskId}, file: ${body.originalFilename}`,
    );

    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization || '';
    const jwtToken = authHeader.replace('Bearer ', '');

    if (!jwtToken) {
      throw new BadRequestException(
        'JWT token is required in Authorization header',
      );
    }

    // Prepare upload request with signature and JWT token
    const uploadRequest = {
      // uploaderId: req.user.sub,
      uploaderId: '123',
      taskId,
      signature: body.signature,
      jwtToken,
    };

    // Call new uploadMediaWithSignature method with synchronous verification
    const result = await this.mediaUploadService.uploadMediaWithSignature(
      file.buffer,
      body.originalFilename,
      body.mimetype,
      file.size,
      uploadRequest,
    );

    // Handle upload failure
    if (!result.success) {
      throw new BadRequestException(result.error || 'Failed to upload media');
    }

    // Return the created media object
    return this.mapToResponse(result.media);
  }

  /**
   * DELETE /api/v1/media/{id}
   *
   * Delete a media file by its ID (soft delete).
   *
   * Authentication: Required (JWT Bearer token)
   * Authorization: User must own the media or be an admin
   */
  @Delete(':id')
  @UseGuards(ApiGatewayGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete media file',
    description:
      'Delete a media file by its ID (soft delete). Only the uploader can delete their own media files.',
  })
  @ApiParam({
    name: 'id',
    description: 'Media file ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Media file deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Media deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - permission denied or deletion failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  @ApiResponse({
    status: 404,
    description: 'Media not found',
  })
  async deleteMedia(@Param('id') id: string, @Req() req: any) {
    this.logger.debug(`Deleting media ${id} for user ${req.user.sub}`);

    const media = await this.mediaService.findById(id);

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    if (media.uploaderId !== req.user.sub) {
      throw new BadRequestException(
        'You do not have permission to delete this media',
      );
    }

    const deleted = await this.mediaService.delete(id);

    if (!deleted) {
      throw new BadRequestException('Failed to delete media');
    }

    if (media.gcsUrl) {
      await this.mediaUploadService.deleteFromGCS(media.filename);
    }

    return { success: true, message: 'Media deleted successfully' };
  }

  /**
   * Helper method to map Media entity to response DTO
   */
  private mapToResponse(media: any): any {
    return {
      id: media.id,
      filename: media.filename,
      originalName: media.originalName,
      mimetype: media.mimetype,
      size: media.size,
      gcsUrl: media.gcsUrl,
      publicUrl: media.publicUrl,
      uploaderId: media.uploaderId,
      taskId: media.taskId,
      status: media.status,
      description: media.description,
      signatureVerified: media.signatureVerified,
      signatureData: media.signatureData || null,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }
}
