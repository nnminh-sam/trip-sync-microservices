import { Entity, Column, Index } from 'typeorm';
import { BaseModel } from './base.model';
import { PointTransformer } from 'src/utils';

@Entity('gps_logs')
@Index(['userId'])
@Index(['tripId'])
@Index(['timestamp'])
export class GpsLog extends BaseModel {
  @Column({ type: 'uuid', name: 'trip_id', nullable: true })
  tripId: string | null;

  @Column({ type: 'uuid', name: 'user_id', nullable: false })
  userId: string;

  @Column({
    type: 'decimal',
    precision: 9,
    scale: 6,
    nullable: false,
  })
  latitude: number;

  @Column({
    type: 'decimal',
    precision: 9,
    scale: 6,
    nullable: false,
  })
  longitude: number;

  @Column({ type: 'datetime', nullable: false })
  timestamp: Date;

  @Column({
    name: 'location_point',
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    transformer: PointTransformer,
  })
  locationPoint: string;
}
