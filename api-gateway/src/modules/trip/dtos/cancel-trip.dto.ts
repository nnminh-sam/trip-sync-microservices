import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CancelTripDto {
  @ApiProperty({
    description: 'Reason for trip cancellation',
    example: 'Change of plans',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Note for trip cancellation',
    example: 'Change of plans',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({
    description: 'Attachment ID for supporting document',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsNotEmpty()
  attachmentId: string;
}
