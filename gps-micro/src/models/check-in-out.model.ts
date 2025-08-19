import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base.model';

export enum CheckInOutType {
  CHECK_IN = 'check_in',
  CHECK_OUT = 'check_out',
}

@Entity('check_in_outs')
@Index(['trip_location_id', 'type'])
@Index(['user_id', 'timestamp'])
@Index(['timestamp'])
export class CheckInOut extends BaseModel {
  @Column('uuid')
  @Index()
  trip_location_id: string;

  @Column('uuid')
  @Index()
  user_id: string;

  @Column('uuid')
  @Index()
  trip_id: string;

  @Column({
    type: 'enum',
    enum: CheckInOutType,
  })
  type: CheckInOutType;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude: number;

  @Column('decimal', { precision: 8, scale: 2 })
  distance_from_location: number;

  @Column('timestamp')
  timestamp: Date;

  @Column('uuid', { nullable: true })
  location_id?: string;

  @Column('text', { nullable: true })
  location_name?: string;

  @Column('text', { nullable: true })
  note?: string;

  @Column('json', { nullable: true })
  metadata?: {
    accuracy?: number;
    provider?: string;
    address?: string;
  };
}