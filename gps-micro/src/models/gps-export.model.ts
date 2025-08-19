import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base.model';

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  GPX = 'gpx',
  EXCEL = 'xlsx',
}

@Entity('gps_exports')
@Index(['user_id', 'status'])
@Index(['status', 'createdAt'])
export class GPSExport extends BaseModel {
  @Column('uuid')
  @Index()
  user_id: string;

  @Column({
    type: 'enum',
    enum: ExportStatus,
    default: ExportStatus.PENDING,
  })
  status: ExportStatus;

  @Column({
    type: 'enum',
    enum: ExportFormat,
  })
  format: ExportFormat;

  @Column('jsonb')
  filter: {
    startDate: string;
    endDate: string;
    userIds?: string[];
    tripIds?: string[];
  };

  @Column('jsonb', { nullable: true })
  options?: {
    includeUserDetails?: boolean;
    includeTripDetails?: boolean;
    anonymizeData?: boolean;
  };

  @Column('text', { nullable: true })
  file_url?: string;

  @Column('text', { nullable: true })
  file_name?: string;

  @Column('bigint', { nullable: true })
  file_size?: number;

  @Column('integer', { nullable: true })
  total_records?: number;

  @Column('timestamp with time zone', { nullable: true })
  completed_at?: Date;

  @Column('timestamp with time zone', { nullable: true })
  expires_at?: Date;

  @Column('text', { nullable: true })
  error_message?: string;

  @Column('jsonb', { nullable: true })
  metadata?: {
    processing_time?: number;
    memory_used?: number;
    [key: string]: any;
  };
}