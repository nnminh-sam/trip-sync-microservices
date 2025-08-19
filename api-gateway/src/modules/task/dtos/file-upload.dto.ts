import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class FileUploadDto {
  @ApiPropertyOptional({ description: 'Task ID' })
  @IsUUID()
  @IsOptional()
  task_id?: string;

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
  @ApiPropertyOptional({ description: 'Task ID' })
  @IsUUID()
  @IsOptional()
  task_id?: string;

  @ApiPropertyOptional({ description: 'Files description' })
  @IsString()
  @IsOptional()
  description?: string;
}