import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';
import { Gender } from 'src/models/enums/gender.enum';

export class FilterUserDto extends BaseRequestFilterDto {
  @ApiPropertyOptional({
    description: 'First name of the user',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name of the user',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Email of the user',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Gender of the user',
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Citizen ID of the user',
  })
  @IsOptional()
  @IsString()
  citizenId?: string;

  @ApiPropertyOptional({
    description: 'Phone number of the user',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Role ID of the user',
  })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional({
    description: 'Date of birth of the user',
  })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Active status of the user',
  })
  @IsOptional()
  @IsString()
  isActive?: boolean;
}
