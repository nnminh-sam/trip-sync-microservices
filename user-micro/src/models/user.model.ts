import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from 'src/models/base.model';
import { Role } from 'src/models/role.model';

@Entity('users')
export class User extends BaseModel {
  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'uuid' })
  roleId: string;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'roleId' })
  role: Role;
}
