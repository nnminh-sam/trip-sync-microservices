import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './base.model';
import { Trip } from './trip.model';

@Entity({ name: 'trip_locations' })
export class TripLocation extends BaseModel {
  @Column()
  location_id: string; // FK -> location-micro

  @Column({ type: 'int' })
  arrival_order: number;

  @Column({ type: 'datetime', nullable: true })
  scheduled_at: Date;

  
  @ManyToOne(() => Trip, (trip) => trip.locations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

}