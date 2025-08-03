import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from 'src/models/base.model';
import { User } from 'src/models/user.model';

@Entity('audit_logs')
export class AuditLog extends BaseModel {
  @ApiProperty({
    description: 'User ID who performed the action',
    type: 'string',
  })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({
    description: 'Action performed',
    type: 'string',
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'],
    example: 'CREATE',
  })
  @Column({
    type: 'enum',
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'],
  })
  action: string;

  @ApiProperty({
    description: 'Entity type that was acted upon',
    type: 'string',
    example: 'Trip',
  })
  @Column({ type: 'varchar', length: 100 })
  entity: string;

  @ApiProperty({
    description: 'ID of the entity that was acted upon',
    type: 'string',
    required: false,
  })
  @Column({ type: 'uuid', nullable: true })
  entityId?: string;

  @ApiProperty({
    description: 'Description of the action performed',
    type: 'string',
    example: 'Created new trip with ID: trip-123',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    description: 'IP address from where the action was performed',
    type: 'string',
    example: '192.168.1.1',
    required: false,
  })
  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @ApiProperty({
    description: 'User agent string of the client',
    type: 'string',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @ApiProperty({
    description: 'User object who performed the action',
    type: () => User,
  })
  user?: User;
}
