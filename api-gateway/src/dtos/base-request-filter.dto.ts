import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsInt, Min } from 'class-validator';

export class BaseRequestFilterDto {
  @ApiProperty({
    description: 'Field to sort by',
    required: false,
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'id';

  @ApiProperty({
    description: 'Sort order',
    required: false,
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'asc';

  @ApiProperty({
    description: 'Page number (starts from 1)',
    required: false,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  size?: number = 10;
}
