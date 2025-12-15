import { BaseModel } from 'src/models/base.model';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { TripLocation } from './trip-location.model';
import { TaskStatusEnum } from './task-status.enum';

@Entity('tasks')
export class Task extends BaseModel {
  @OneToOne(() => TripLocation, (tripLocation) => tripLocation.task)
  @Column({
    type: 'uuid',
    nullable: false,
    name: 'trip_location_id',
    unique: true,
  })
  tripLocationId: string;

  @OneToOne(() => TripLocation, (tripLocation) => tripLocation.task)
  @JoinColumn({ name: 'trip_location_id' })
  tripLocation: TripLocation;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  title: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatusEnum,
    default: TaskStatusEnum.PENDING,
    nullable: true,
  })
  status: TaskStatusEnum;

  @Column({ type: 'text', nullable: true })
  note?: string;
}
