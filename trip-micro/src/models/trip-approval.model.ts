import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './base.model';
import { Trip } from './trip.model';
import { TripApprovalStatusEnum } from 'src/models/trip-approval-status.enum';

@Entity({ name: 'trip_approvals' })
export class TripApproval extends BaseModel {
  @Column()
  trip_id: string; // FK -> trips.id

  @Column()
  approver_id: string; // FK -> user-micro

  @Column({
    type: 'enum',
    enum: TripApprovalStatusEnum,
    default: TripApprovalStatusEnum.PENDING,
  })
  status: TripApprovalStatusEnum;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'boolean', default: false })
  is_auto: boolean;

  @ManyToOne(() => Trip, (trip) => trip.approvals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;
}
