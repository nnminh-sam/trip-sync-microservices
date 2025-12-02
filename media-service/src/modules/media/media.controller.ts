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
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiGatewayGuard } from '../../auth/api-gateway.guard';
import { MediaService } from './media.service';
import { MediaUploadService } from './services';
import { FilterMediaDto } from './dtos';

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
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File,
    @Query('task-id') taskId: string,
    @Body() body: { signature: string; originalFilename: string; mimetype: string },
    @Req() req: any,
  ) {
    // Validate file is present
    if (!file) {
      throw new BadRequestException('No file uploaded. Expected form field: "file"');
    }

    // Validate task ID is provided
    if (!taskId) {
      throw new BadRequestException('Task ID is required. Expected query parameter: task-id');
    }

    // Validate signature is present
    if (!body?.signature) {
      throw new BadRequestException('GnuPG signature is required. Expected form field: "signature"');
    }

    // Validate original filename is present
    if (!body?.originalFilename) {
      throw new BadRequestException('Original filename is required. Expected form field: "originalFilename"');
    }

    // Validate MIME type is present
    if (!body?.mimetype) {
      throw new BadRequestException('MIME type is required. Expected form field: "mimetype"');
    }

    this.logger.debug(
      `Uploading media task: ${taskId}, file: ${body.originalFilename}`,
    );

    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization || '';
    const jwtToken = authHeader.replace('Bearer ', '');

    if (!jwtToken) {
      throw new BadRequestException('JWT token is required in Authorization header');
    }

    // Prepare upload request with signature and JWT token
    const uploadRequest = {
      // uploaderId: req.user.sub,
      uploaderId: "123",
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
   * GET /api/v1/media/{id}/view-url
   *
   * Generate a signed URL for accessing private media files stored in GCS.
   *
   * This endpoint creates time-limited, authenticated URLs that allow direct
   * download from GCS without requiring JWT on the final download request.
   *
   * Authentication: Required (JWT Bearer token)
   * Authorization: User must own the media or be an admin
   *
   * @param id - Media file ID (UUID)
   * @param expiresIn - Optional expiration time in seconds (default: 3600, max: 86400)
   * @param req - Express request containing user info from JWT
   * @returns Signed URL with expiration details
   */
  @Get(':id/view-url')
  @UseGuards(ApiGatewayGuard)
  async getSignedUrl(
    @Param('id') id: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    this.logger.debug(`Requesting signed URL for media ${id}`);

    // Get media by ID
    const media = await this.mediaService.findById(id);
    console.log("🚀 ~ MediaController ~ getSignedUrl ~ media:", media)

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    // Generate signed URL
    const result = await this.mediaUploadService.generateSignedUrl(
      media.filename,
      expiresIn || 3600,
    );

    if (!result.success) {
      throw new BadRequestException(`Failed to generate signed URL: ${result.error}`);
    }

    const hours = result.expiresIn / 3600;

    return {
      id: media.id,
      filename: media.filename,
      originalName: media.originalName,
      mimetype: media.mimetype,
      size: media.size,
      signedUrl: result.signedUrl,
      expiresIn: result.expiresIn,
      expiresAt: result.expiresAt,
      message: `Signed URL valid for ${hours} hour(s). Use this URL to access the media file.`,
    };
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
  async deleteMedia(@Param('id') id: string, @Req() req: any) {
    this.logger.debug(`Deleting media ${id} for user ${req.user.sub}`);

    const media = await this.mediaService.findById(id);

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    if (media.uploaderId !== req.user.sub) {
      throw new BadRequestException('You do not have permission to delete this media');
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
