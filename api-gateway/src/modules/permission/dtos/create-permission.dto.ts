import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ description: 'Action of the permission', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  action: string;

  @ApiProperty({ description: 'Resource of the permission', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  resource: string;

  @ApiPropertyOptional({ description: 'Description of the permission' })
  @IsString()
  @IsOptional()
  description?: string;
}
