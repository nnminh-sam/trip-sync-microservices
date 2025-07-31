import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FindLocationsDto extends BaseRequestFilterDto {
  @ApiProperty({
    description: 'Filter by location name (case-insensitive, partial match)',
    required: false,
    example: 'HQ',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
