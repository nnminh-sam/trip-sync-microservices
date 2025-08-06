import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'User ID to send notification to',
    example: 'user-uuid-123',
  })
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Trip Approved',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification message content',
    example: 'Your trip to Hanoi has been approved by the manager.',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Notification type',
    example: 'trip_approval',
    enum: ['trip_approval', 'task_assignment', 'trip_reminder', 'system_alert'],
  })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Priority level',
    example: 'medium',
    enum: ['low', 'medium', 'high'],
    required: false,
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiProperty({
    description: 'Additional metadata as JSON string',
    example: '{"trip_id": "trip-uuid-123", "action": "approved"}',
    required: false,
  })
  @IsOptional()
  @IsString()
  metadata?: string;
}
