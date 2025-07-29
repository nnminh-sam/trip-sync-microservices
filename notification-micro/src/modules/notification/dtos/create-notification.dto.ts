import { IsNotEmpty, IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum NotificationType {
  SYSTEM = 'system',
  TASK = 'task',
  TRIP = 'trip',
}

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType; // optional, default có thể là 'system'
}
