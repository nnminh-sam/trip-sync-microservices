import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from 'src/models/base.model';
import { Role } from 'src/models/role.model';
import { Gender } from 'src/models/enums/gender.enum';

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

  @Column({ type: 'varchar', unique: true, nullable: false })
  citizenId: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  phoneNumber: string;

  @Column({ type: 'enum', enum: Gender, nullable: false })
  gender: Gender;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar' })
  managerId: string;

  @Column({ type: 'text', nullable: true })
  publicKey?: string; // GPG public key for signature verification

  @Column({ name: 'device_token', type: 'varchar', nullable: true })
  deviceToken: string;
}
