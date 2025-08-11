import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class RejectTaskDto {
  @ApiProperty({
    description: 'Task rejector ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  rejectorId: string;

  @ApiProperty({
    description: 'Reason for rejecting the task',
    example: 'Task requirements not met',
    minLength: 10,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10, {
    message: 'Rejection reason must be at least 10 characters long',
  })
  reason: string;
}