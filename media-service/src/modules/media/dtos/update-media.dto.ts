import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMediaDto {
  @ApiPropertyOptional({
    description: 'Optional description of the media',
    example: 'Updated photo description',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Media status',
    example: 'verified',
    enum: ['uploaded', 'verified', 'failed'],
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'GCS URL (gs:// format)',
    example: 'gs://bucket-name/media_123_task_1234567890.jpg',
  })
  gcsUrl?: string;

  @ApiPropertyOptional({
    description: 'Public URL for accessing the file',
    example: 'https://storage.googleapis.com/bucket-name/media_123_task_1234567890.jpg',
  })
  publicUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the GPG signature has been verified',
    example: true,
  })
  signatureVerified?: boolean;
}
