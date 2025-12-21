import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { BaseModel } from './base.model';
import { TripLocation } from './trip-location.model';
import { TripStatusEnum } from 'src/models/trip-status.enum';
import { TripProgress } from 'src/models/trip-progress.model';

@Entity({ name: 'trips' })
export class Trip extends BaseModel {
  @Column({ type: 'varchar' })
  title: string;

  @Column({ nullable: true })
  assigneeId: string;

  @Column({
    type: 'enum',
    enum: TripStatusEnum,
    nullable: false,
  })
  status: TripStatusEnum;

  @Column({ type: 'varchar' })
  purpose: string;

  @Column({ type: 'varchar', nullable: true })
  goal: string;

  @Column({ type: 'datetime', nullable: true })
  schedule: Date;

  @Column({ type: 'datetime', nullable: true })
  deadline: Date;

  @Column({ type: 'varchar', nullable: true })
  note: string;

  @Column({ type: 'uuid', nullable: false })
  managerId: string;

  @Column({ type: 'datetime', nullable: true })
  startedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  decidedAt: Date;

  @OneToMany(() => TripLocation, (tripLocation) => tripLocation.trip)
  tripLocations: TripLocation[];

  @OneToMany(() => TripProgress, (tripProgress) => tripProgress.trip)
  tripProgress: TripProgress;
}
