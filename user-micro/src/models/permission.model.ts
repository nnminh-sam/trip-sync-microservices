import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseModel } from 'src/models/base.model';
import { RolePermission } from './role-permission.model';

@Entity('permissions')
@Index(['action', 'resource'], { unique: true })
export class Permission extends BaseModel {
  @Column({ type: 'varchar', length: 100 })
  @Index()
  action: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  resource: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions: RolePermission[];
}
