import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class FileUploadDto {
  @ApiProperty({ description: 'Task ID' })
  @IsUUID()
  @IsNotEmpty()
  task_id: string;

  @ApiProperty({ description: 'User ID who uploads the file' })
  @IsUUID()
  @IsNotEmpty()
  uploaded_by: string;

  @ApiPropertyOptional({ description: 'File description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class FileUploadResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  task_id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  original_name: string;

  @ApiProperty()
  mimetype: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  gcs_url: string;

  @ApiProperty()
  public_url: string;

  @ApiProperty()
  uploaded_by: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  created_at: Date;
}

export class BulkFileUploadDto {
  @ApiProperty({ description: 'Task ID' })
  @IsUUID()
  @IsNotEmpty()
  task_id: string;

  @ApiProperty({ description: 'User ID who uploads the files' })
  @IsUUID()
  @IsNotEmpty()
  uploaded_by: string;

  @ApiPropertyOptional({ description: 'Files description' })
  @IsString()
  @IsOptional()
  description?: string;
}