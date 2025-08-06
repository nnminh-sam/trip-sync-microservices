import { IsOptional, IsBoolean, IsIn, IsString } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterNotificationDto extends BaseRequestFilterDto {
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;


  @IsOptional()
  @IsString()
  user_id?: string;

  
  @IsIn(['trip_approval', 'task_assignment', 'system_alert', 'trip_reminder'])
  type: string;
  
  @IsIn(['low', 'medium', 'high'])
  priority: string;


}
