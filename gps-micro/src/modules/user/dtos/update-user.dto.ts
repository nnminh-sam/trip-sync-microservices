import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Gender } from 'src/models/enums/gender.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'First name of the user',
  })
  @IsOptional()
  @IsString()
  firstName: string;

  @ApiPropertyOptional({
    description: 'Last name of the user',
  })
  @IsOptional()
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Citizen ID of the user',
  })
  @IsOptional()
  @IsString()
  citizenId: string;

  @ApiPropertyOptional({
    description: 'Phone number of the user',
  })
  @IsOptional()
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Gender of the user',
    enum: Gender,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional({
    description: 'Date of birth of the user',
  })
  @IsOptional()
  @IsString()
  dateOfBirth: Date;
}
