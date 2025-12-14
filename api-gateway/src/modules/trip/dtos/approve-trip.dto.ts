import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApproveTripDto {
  @ApiProperty({
    description: 'Approval status',
    example: 'approve',
    enum: ['approve', 'reject'],
    required: true
  })
  @IsNotEmpty()
  @IsString()
  decision: 'approve' | 'reject';

  @ApiProperty({
    description: 'Approval comments',
    example: 'Approved for business purposes. Remember to submit reports.',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}
