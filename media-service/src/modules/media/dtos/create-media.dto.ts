import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMediaDto {
  @ApiProperty({
    description: 'Storage filename in GCS',
    example: 'media_123_task_1234567890.jpg',
  })
  filename: string;

  @ApiProperty({
    description: 'Original filename from upload',
    example: 'photo.jpg',
  })
  originalName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
    enum: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
    ],
  })
  mimetype: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
  })
  size: number;

  @ApiProperty({
    description: 'GCS URL (gs:// format)',
    example: 'gs://bucket-name/media_123_task_1234567890.jpg',
  })
  gcsUrl: string;

  @ApiProperty({
    description: 'Public URL for accessing the file',
    example: 'https://storage.googleapis.com/bucket-name/media_123_task_1234567890.jpg',
  })
  publicUrl: string;

  @ApiPropertyOptional({
    description: 'Task ID associated with the media',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  taskId?: string;

  @ApiPropertyOptional({
    description: 'Media status',
    example: 'uploaded',
    enum: ['uploaded', 'verified', 'failed'],
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Optional description of the media',
    example: 'Photo taken during trip',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the GPG signature has been verified',
    example: true,
    default: false,
  })
  signatureVerified?: boolean;

  @ApiPropertyOptional({
    description: 'GPG signature data (ASCII armored)',
    example: '-----BEGIN PGP SIGNATURE-----...',
  })
  signatureData?: string;
}
