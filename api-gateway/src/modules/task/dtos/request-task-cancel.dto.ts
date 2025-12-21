import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class RequestTaskCancelDto {
  @ApiProperty({
    description: 'Reason for task cancellation',
    example: 'Task no longer needed',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Attachment ID for supporting document',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsNotEmpty()
  attachmentId: string;

  @ApiProperty({
    description: 'Note for task cancellation',
    example: 'Cancelling due to change in requirements',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;
}
