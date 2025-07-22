import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class FilterTaskProofDto {
  @IsOptional()
  @IsString()
  type?: 'completion' | 'cancellation';

  @IsOptional()
  @IsString()
  mediaType?: 'photo' | 'video';

  @IsOptional()
  @IsUUID()
  uploadedBy?: string;

  @IsOptional()
  @IsDate()
  timestamp?: Date;
}
