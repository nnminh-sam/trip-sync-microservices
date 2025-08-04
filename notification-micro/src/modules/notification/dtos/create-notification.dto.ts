import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUUID, IsIn } from 'class-validator';


export class CreateNotificationDto {
  @IsUUID()
  user_id: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsIn(['trip_approval', 'task_update', 'system', 'reminder'])
  type: string;

  @IsIn(['low', 'medium', 'high'])
  priority: string;

  @IsOptional()
  @IsString()
  metadata?: string;
}
