import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveTripDto {
  @ApiProperty({
    description: 'Approval status',
    example: 'approved',
    enum: ['approved', 'rejected'],
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Approval comments',
    example: 'Approved for business purposes. Remember to submit reports.',
    required: false,
  })
  @IsOptional()
  @IsString()
  comments?: string;
}
