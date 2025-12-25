import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Req,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiGatewayGuard } from '../auth/api-gateway.guard';
import { MediaService } from './services/media.service';
import { MediaUploadRequest, MediaUploadService } from './services';
import { UploadFileDto } from './dtos/upload-file.dto';

@ApiTags('media')
@Controller('api/v1/media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(
    private readonly mediaService: MediaService,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

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
   * POST /api/v1/media
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
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'originalFilename', 'mimetype'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Media file (image/video)',
        },
        metadata: {
          type: 'string',
          description: 'Required business metadata of file',
          example:
            '"{\"latitude\":10.8974189,\"longitude\":106.8990514,\"timestamp\":\"1766629256399\"}"',
        },
        signature: {
          type: 'string',
          description: 'GnuPG signature (ASCII armored)',
          example:
            'G/V0XAwPvJ0J4iTle//UUtZNN4nxnyd+J0rdR6Sg+SfbPB5R96th8WeQuTMNKTorhFoFZNZu0JMAIe30qMBzDQ==',
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
    @Body() body: UploadFileDto,
    @Req() req: any,
  ) {
    const { signature, metadata, originalFilename, mimetype } = body;

    // Validate file is present
    if (!file) {
      throw new BadRequestException(
        'No file uploaded. Expected form field: "file"',
      );
    }

    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization || '';
    const jwtToken = authHeader.replace('Bearer ', '');

    if (!jwtToken) {
      throw new BadRequestException(
        'JWT token is required in Authorization header',
      );
    }

    // Prepare upload request with signature and JWT token
    const performVerification: boolean = signature !== null && metadata != null;
    const uploadRequest: MediaUploadRequest = {
      uploaderId: req.user.sub,
      verification: {
        perform: performVerification,
        ...(performVerification && {
          payload: { jwtToken, signature, metadata },
        }),
      },
    };

    // Call new uploadMediaWithSignature method with synchronous verification
    const result = await this.mediaUploadService.uploadMediaWithSignature(
      file.buffer,
      originalFilename,
      mimetype,
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
      status: media.status,
      description: media.description,
      signatureVerified: media.signatureVerified,
      signatureData: media.signatureData || null,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }
}
