import { BaseModel } from 'src/models/base.model';
import { TripStatusEnum } from 'src/models/trip-status.enum';
import { Trip } from 'src/models/trip.model';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

@Entity({ name: 'trip_progress' })
export class TripProgress extends BaseModel {
  @ManyToOne(() => Trip, (trip) => trip.tripProgress)
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({
    name: 'actor_id',
    type: 'uuid',
    nullable: false,
  })
  actorId: string;

  @Column({
    type: 'enum',
    enum: TripStatusEnum,
    nullable: false,
  })
  status: TripStatusEnum;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  title: string;

  @Column({
    type: 'varchar',
    nullable: false,
  })
  description: string;
}
