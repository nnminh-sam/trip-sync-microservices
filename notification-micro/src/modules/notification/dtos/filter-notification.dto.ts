import { IsOptional, IsBoolean, IsUUID, IsString } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterNotificationDto extends BaseRequestFilterDto {
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;


  @IsOptional()
  @IsString()
  user_id?: string;

  
  @IsOptional()
  @IsString()
  type?: string;
}
