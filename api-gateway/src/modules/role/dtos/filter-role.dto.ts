import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterRoleDto extends BaseRequestFilterDto {
  @ApiProperty({
    description: 'Name of the role',
    required: false,
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
