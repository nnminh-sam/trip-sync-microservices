import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsOptional()
  signature?: string;

  @IsString()
  @IsOptional()
  metadata?: string;

  @IsString()
  @IsNotEmpty()
  originalFilename: string;

  @IsString()
  @IsOptional()
  mimetype?: string;
}
