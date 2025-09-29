import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { RolePermission } from 'src/models/role-permission.model';

export class Permission extends BaseModel {
  @ApiProperty({
    description: 'Action of the permission',
  })
  action: string;

  @ApiProperty({
    description: 'Resource of the permission',
  })
  resource: string;

  @ApiProperty({
    description: 'Description of the permission',
  })
  description: string;

  @ApiProperty({
    description: 'List of roles which has the permission',
  })
  rolePermissions: RolePermission[];
}
