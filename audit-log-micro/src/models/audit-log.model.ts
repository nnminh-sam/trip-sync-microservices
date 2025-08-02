import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { User } from 'src/models/user.model';

export class AuditLog extends BaseModel {
  @ApiProperty({
    description: 'User ID who performed the action',
    type: 'string',
  })
  userId: string;

  @ApiProperty({
    description: 'Action performed',
    type: 'string',
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'],
    example: 'CREATE',
  })
  action: string;

  @ApiProperty({
    description: 'Entity type that was acted upon',
    type: 'string',
    example: 'Trip',
  })
  entityType: string;

  @ApiProperty({
    description: 'ID of the entity that was acted upon',
    type: 'string',
    required: false,
  })
  entityId?: string;

  @ApiProperty({
    description: 'Description of the action performed',
    type: 'string',
    example: 'Created new trip with ID: trip-123',
  })
  description: string;

  @ApiProperty({
    description: 'IP address from where the action was performed',
    type: 'string',
    example: '192.168.1.1',
    required: false,
  })
  ipAddress?: string;

  @ApiProperty({
    description: 'User agent string of the client',
    type: 'string',
    required: false,
  })
  userAgent?: string;

  @ApiProperty({
    description: 'Additional metadata as JSON string',
    type: 'string',
    required: false,
  })
  metadata?: string;

  @ApiProperty({
    description: 'User object who performed the action',
    type: () => User,
  })
  user?: User;
}
