import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterTaskProofDto extends BaseRequestFilterDto {
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
