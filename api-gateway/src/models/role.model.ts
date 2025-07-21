import { BaseModel } from 'src/models/base.model';
import { RolePermission } from './role-permission.model';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/models/user.model';

export class Role extends BaseModel {
  @ApiProperty({
    description: 'Role name',
  })
  name: string;

  @ApiProperty({
    description: 'Role description',
  })
  description: string;

  @ApiProperty({
    description: 'List of role permission objects',
  })
  rolePermissions: RolePermission[];

  @ApiProperty({
    description: 'List of users has this role',
  })
  users: User[];
}
