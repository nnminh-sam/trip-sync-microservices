import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseModel } from './base.model';

@Entity('gps_logs')
@Index(['trip_id', 'timestamp'])
@Index(['user_id', 'timestamp'])
@Index(['timestamp'])
export class GPSLog extends BaseModel {
  @Column('uuid')
  @Index()
  trip_id: string;

  @Column('uuid')
  @Index()
  user_id: string;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  accuracy?: number;

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  speed?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  heading?: number;

  @Column('timestamp with time zone')
  timestamp: Date;

  @Column('text', { nullable: true })
  address?: string;

  @Column('jsonb', { nullable: true })
  metadata?: {
    battery_level?: number;
    network_type?: string;
    provider?: string;
    altitude?: number;
  };
}