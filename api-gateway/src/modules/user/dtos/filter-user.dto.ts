import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';

export class FilterUserDto extends BaseRequestFilterDto {
  @ApiPropertyOptional({ description: 'First name to filter' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name to filter' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Email to filter' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
