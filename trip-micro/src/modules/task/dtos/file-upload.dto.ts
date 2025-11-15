import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class FileUploadDto {
  @IsUUID()
  @IsNotEmpty()
  task_id: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  uploaded_by: string;
}

export class FileUploadResponseDto {
  id: string;
  task_id: string;
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  gcs_url: string;
  public_url: string;
  uploaded_by: string;
  description?: string;
  created_at: Date;
}

export class BulkFileUploadDto {
  @IsUUID()
  @IsNotEmpty()
  task_id: string;

  @IsString()
  @IsNotEmpty()
  uploaded_by: string;

  @IsString()
  @IsOptional()
  description?: string;
}