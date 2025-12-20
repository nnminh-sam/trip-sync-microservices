import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @IsNotEmpty({ message: 'Path to database is required' })
  path: string;

  @IsObject()
  @IsNotEmpty({ message: 'Notification data is required' })
  data: Record<string, any>;

  @IsString()
  @IsOptional()
  description?: string;
}
