import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CancelTaskDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsUUID()
  @IsNotEmpty()
  attachmentId: string;

  @IsString()
  @IsOptional()
  note?: string;
}
