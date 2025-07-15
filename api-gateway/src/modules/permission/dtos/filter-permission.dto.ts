import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterPermissionDto extends BaseRequestFilterDto {
  @ApiProperty({
    description: 'Action of the permission (e.g., read, write, delete)',
    required: false,
    example: 'read',
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiProperty({
    description: 'Resource of the permission (e.g., user, post, comment)',
    required: false,
    example: 'user',
  })
  @IsOptional()
  @IsString()
  resource?: string;
}
