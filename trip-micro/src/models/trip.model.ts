import { Column, Entity, OneToMany } from 'typeorm';
import { BaseModel } from './base.model';
import { TripLocation } from './trip-location.model';
import { TripApproval } from './trip-approval.model';
import { TripStatusEnum } from 'src/models/trip-status.enum';

@Entity({ name: 'trips' })
export class Trip extends BaseModel {
  @Column({ type: 'varchar', unique: true })
  title: string;

  @Column({ nullable: true })
  assignee_id: string;

  @Column({
    type: 'enum',
    enum: TripStatusEnum,
    default: TripStatusEnum.PENDING,
  })
  status: TripStatusEnum;

  @Column({ type: 'varchar' })
  purpose: string;

  @Column({ type: 'varchar', nullable: true })
  goal: string;

  @Column({ type: 'varchar', nullable: true })
  schedule: string;

  @Column()
  created_by: string;

  @OneToMany(() => TripLocation, (tl) => tl.trip)
  locations: TripLocation[];

  @OneToMany(() => TripApproval, (approval) => approval.trip)
  approvals: TripApproval[];
}
