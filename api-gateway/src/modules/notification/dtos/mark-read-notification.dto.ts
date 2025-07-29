import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';

export class MarkReadNotificationDto {
  @ApiProperty({
    description: 'Mark notification as read or unread',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;
}