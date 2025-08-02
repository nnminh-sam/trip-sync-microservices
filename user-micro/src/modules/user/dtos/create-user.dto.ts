import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Gender } from 'src/models/enums/gender.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'First name of the user',
  })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
  })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Email of the user',
    uniqueItems: true,
  })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Password of the user',
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Role name of the user',
  })
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty({
    description: 'Citizen ID of the user',
    uniqueItems: true,
  })
  @IsNotEmpty()
  @IsString()
  citizenId: string;

  @ApiProperty({
    description: 'Phone number of the user',
    uniqueItems: true,
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: 'Gender of the user',
    enum: Gender,
  })
  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    description: 'Date of birth of the user',
    type: String,
    format: 'date',
    nullable: true,
  })
  @IsNotEmpty()
  @IsString()
  dateOfBirth: Date;
}
