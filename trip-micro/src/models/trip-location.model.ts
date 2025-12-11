import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './base.model';
import { Trip } from './trip.model';
import { Location } from './location.model';

@Entity({ name: 'trip_locations' })
export class TripLocation extends BaseModel {
  @JoinColumn({ name: 'trip_id' })
  @Column({ type: 'uuid' })
  tripId: string;

  @Column({ type: 'uuid' })
  baseLocationId: string; // FK -> location-micro

  @Column({ type: 'varchar', nullable: false })
  nameSnapshot: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: false })
  latitudeSnapshot: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: false })
  longitudeSnapshot: number;

  @Column({ type: 'float', default: 100 })
  offsetRadiusSnapshot: number;

  @Column({
    type: 'point',
    srid: 4326,
    nullable: false,
    spatialFeatureType: 'Point',
    select: false, // Don't select by default to avoid ST_AsText issues
  })
  locationPointSnapshot: { x: number; y: number };

  @Column({ type: 'int', nullable: false })
  arrivalOrder: number;

  @Column({ type: 'datetime', nullable: true })
  scheduledAt: Date;

  @Column({
    type: 'point',
    srid: 4326,
    spatialFeatureType: 'Point',
    select: false, // Don't select by default to avoid ST_AsText issues
  })
  checkInPoint: { x: number; y: number };

  @Column({ type: 'datetime', nullable: true })
  checkInTimestamp: Date;

  @Column({
    type: 'point',
    srid: 4326,
    spatialFeatureType: 'Point',
    select: false, // Don't select by default to avoid ST_AsText issues
  })
  checkOutPoint: { x: number; y: number };

  @Column({ type: 'datetime', nullable: true })
  checkOutTimestamp: Date;

  @ManyToOne(() => Trip, (trip) => trip.tripLocations, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @ManyToOne(() => Location, (location) => location.trips, {
    onDelete: 'CASCADE',
  })
  location: Location;
}
