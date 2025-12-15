import { Column, Entity, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseModel } from './base.model';
import { Trip } from './trip.model';
import { Location } from './location.model';
import { PointTransformer } from 'src/utils';
import { Task } from './task.model';

@Entity({ name: 'trip_locations' })
export class TripLocation extends BaseModel {
  @JoinColumn({ name: 'trip_id' })
  @Column({ type: 'uuid' })
  tripId: string;

  @Column({ type: 'uuid', name: 'base_location_id' })
  baseLocationId: string; // FK -> location-micro

  @Column({ type: 'varchar', name: 'name_snapshot', nullable: false })
  nameSnapshot: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    name: 'latitude_snapshot',
    nullable: false,
  })
  latitudeSnapshot: number;

  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    name: 'longitude_snapshot',
    nullable: false,
  })
  longitudeSnapshot: number;

  @Column({ type: 'float', name: 'offset_radius_snapshot', default: 100 })
  offsetRadiusSnapshot: number;

  @Column({
    name: 'location_point_snapshot',
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    transformer: PointTransformer,
  })
  locationPointSnapshot: string;

  @Column({ type: 'int', name: 'arrival_order', nullable: false })
  arrivalOrder: number;

  @Column({
    name: 'checkin_point',
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    transformer: PointTransformer,
  })
  checkInPoint: string;

  @Column({ type: 'datetime', name: 'checkin_timestamp', nullable: true })
  checkInTimestamp: Date;

  @Column({
    name: 'checkout_point',
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    transformer: PointTransformer,
  })
  checkOutPoint: string;

  @Column({ type: 'datetime', name: 'checkout_timestamp', nullable: true })
  checkOutTimestamp: Date;

  @ManyToOne(() => Trip, (trip) => trip.tripLocations, { onUpdate: 'CASCADE' })
  trip: Trip;

  @ManyToOne(() => Location, (location) => location.trips, {
    onDelete: 'CASCADE',
  })
  location: Location;

  @OneToOne(() => Task, (task) => task.tripLocation)
  task?: Task;
}
