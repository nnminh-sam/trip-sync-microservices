import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { Gender } from 'src/models/enums/gender.enum';
import { Role } from 'src/models/role.model';

export class User extends BaseModel {
  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'The email of the user',
    example: 'example@gmail.com',
  })
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: '123456',
  })
  password: string;

  @ApiProperty({
    description: 'The role id of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  roleId: string;

  @ApiProperty({
    description: 'The role of the user',
    type: () => Role,
  })
  role: Role;

  @ApiProperty({
    description: 'The citizen id of the user',
    example: '123456789',
  })
  citizenId: string;

  @ApiProperty({
    description: 'The phone number of the user',
    example: '0123456789',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'The gender of the user',
    example: Gender.MALE,
    enum: Gender,
  })
  gender: Gender;

  @ApiProperty({
    description: 'The date of birth of the user',
    example: '2000-01-01',
  })
  dateOfBirth: Date;

  @ApiProperty({
    description: 'The active status of the user',
    example: true,
  })
  isActive: boolean;
}
