import { Entity, Column, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { Trip } from 'src/models/trip.model';
import { User } from 'src/models/user.model';

@Entity('gps_logs')
@Index(['tripId', 'timestamp'])
@Index(['userId', 'timestamp'])
@Index('idx_gps_location', ['locationPoint'], { spatial: true })
@Index('idx_gps_trip_location', ['tripId', 'locationPoint'], { spatial: true })
export class GPSLog extends BaseModel {
  @ApiProperty({
    description: 'Trip ID this GPS log belongs to',
    type: 'string',
  })
  @Column({ type: 'uuid' })
  tripId: string;

  @ApiProperty({
    description: 'User ID who logged this GPS location',
    type: 'string',
  })
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({
    description: 'Latitude coordinate',
    type: 'number',
    example: 21.0285,
  })
  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    type: 'number',
    example: 105.8542,
  })
  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @ApiProperty({
    description: 'Timestamp when GPS location was recorded',
    type: 'string',
    format: 'date-time',
  })
  @Column({ type: 'timestamp' })
  timestamp: Date;

  @ApiProperty({
    description: 'Location point for geospatial indexing',
    type: 'string',
  })
  @Column({
    type: 'point',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: false,
    comment: 'GPS coordinates stored as MySQL POINT type for spatial queries',
  })
  locationPoint: string;

  @ApiPropertyOptional({
    description: 'GPS accuracy in meters',
    type: 'number',
    example: 5.0,
  })
  @Column({ type: 'float', nullable: true })
  accuracy?: number;

  @ApiPropertyOptional({
    description: 'Speed in km/h',
    type: 'number',
    example: 60.5,
  })
  @Column({ type: 'float', nullable: true })
  speed?: number;

  @ApiPropertyOptional({
    description: 'Heading/bearing in degrees (0-360)',
    type: 'number',
    example: 45.0,
  })
  @Column({ type: 'float', nullable: true })
  heading?: number;

  @ApiPropertyOptional({
    description: 'Trip object',
    type: () => Trip,
  })
  trip?: Trip;

  @ApiPropertyOptional({
    description: 'User object',
    type: () => User,
  })
  user?: User;

  @BeforeInsert()
  @BeforeUpdate()
  updateLocationPoint() {
    if (this.latitude && this.longitude) {
      // MySQL POINT format: POINT(longitude latitude)
      this.locationPoint = `POINT(${this.longitude} ${this.latitude})`;
    }
  }
}
