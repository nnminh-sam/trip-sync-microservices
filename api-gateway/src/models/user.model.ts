import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { Role } from 'src/models/role.model';

export class User extends BaseModel {
  @ApiProperty({
    description: 'First name',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
  })
  lastName: string;

  @ApiProperty({
    description: 'Email',
  })
  email: string;

  password: string;

  @ApiProperty({
    description: 'Role ID',
  })
  roleId: string;

  @ApiProperty({
    description: 'Role object',
  })
  role: Role;
}
