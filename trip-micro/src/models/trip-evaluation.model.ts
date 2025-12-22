import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './base.model';
import { Trip } from './trip.model';
import { EvaluationValueEnum } from './evaluation-value.enum';

@Entity({ name: 'trip_evaluations' })
@Index(['tripId', 'version'], { unique: true })
export class TripEvaluation extends BaseModel {
  @JoinColumn({ name: 'trip_id' })
  @Column({ name: 'trip_id', type: 'uuid', nullable: false })
  tripId: string;

  @Column({ type: 'int', nullable: false })
  version: number;

  @Column({
    name: 'evaluation_value',
    type: 'enum',
    enum: EvaluationValueEnum,
    nullable: false,
  })
  evaluationValue: EvaluationValueEnum;

  @Column({ type: 'text', nullable: false })
  comment: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  trip: Trip;
}
