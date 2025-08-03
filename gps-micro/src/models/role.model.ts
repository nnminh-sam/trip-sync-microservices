import { Entity, Column, OneToMany } from 'typeorm';
import { BaseModel } from 'src/models/base.model';
import { RolePermission } from './role-permission.model';
import { User } from './user.model';

@Entity('roles')
export class Role extends BaseModel {
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
