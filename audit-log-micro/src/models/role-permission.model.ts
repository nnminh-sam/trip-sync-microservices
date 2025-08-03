import { BaseModel } from 'src/models/base.model';
import { Permission } from './permission.model';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/models/role.model';

export class RolePermission extends BaseModel {
  @ApiProperty({
    description: 'Role ID',
  })
  roleId: string;

  @ApiProperty({
    description: 'Permission ID',
  })
  permissionId: string;

  @ApiProperty({
    description: 'Role object',
  })
  role: Role;

  @ApiProperty({
    description: 'Permission object',
  })
  permission: Permission;
}
