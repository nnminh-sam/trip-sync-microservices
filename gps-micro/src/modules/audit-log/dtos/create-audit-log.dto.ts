import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

export class CreateAuditLogDto {
  @ApiProperty({
    description: 'User ID who performed the action',
    type: 'string',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Action performed',
    enum: AuditAction,
    example: AuditAction.CREATE,
  })
  @IsNotEmpty()
  @IsEnum(AuditAction)
  action: AuditAction;

  @ApiProperty({
    description: 'Entity type that was acted upon',
    type: 'string',
    example: 'Trip',
  })
  @IsNotEmpty()
  @IsString()
  entity: string;

  @ApiProperty({
    description: 'ID of the entity that was acted upon',
    type: 'string',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiProperty({
    description: 'Description of the action performed',
    type: 'string',
    example: 'Created new trip with ID: trip-123',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'IP address from where the action was performed',
    type: 'string',
    example: '192.168.1.1',
    required: false,
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({
    description: 'User agent string of the client',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
