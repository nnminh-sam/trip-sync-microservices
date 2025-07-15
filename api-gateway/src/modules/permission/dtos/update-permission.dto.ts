import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePermissionDto {
  @ApiPropertyOptional({ description: 'Action of the permission' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  action?: string;

  @ApiPropertyOptional({ description: 'Resource of the permission' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  resource?: string;

  @ApiPropertyOptional({ description: 'Description of the permission' })
  @IsString()
  @IsOptional()
  description?: string;
}
