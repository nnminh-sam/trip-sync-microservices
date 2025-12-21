import { CancelationDecision } from 'src/models/enums/CancelationDecision.enum';
import { CancelationTargetEntity } from 'src/models/enums/TargetEntity.enum';
import { Column, Entity } from 'typeorm';
import { BaseModel } from './base.model';

@Entity({ name: 'cancelations' })
export class Cancelation extends BaseModel {
  @Column({
    name: 'target_entity',
    type: 'enum',
    enum: CancelationTargetEntity,
    nullable: false,
  })
  targetEntity: CancelationTargetEntity;

  @Column({ name: 'target_id', type: 'uuid', nullable: false })
  targetId: string;

  @Column({
    name: 'decision',
    type: 'enum',
    enum: CancelationDecision,
    default: null,
    nullable: true,
  })
  decision: CancelationDecision;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'attachment_id', type: 'uuid', nullable: false })
  attachmentId: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: false })
  createdBy: string;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy: string;

  @Column({ name: 'resolved_at', type: 'datetime', nullable: true })
  resolvedAt: Date;

  @Column({ name: 'resolve_note', type: 'text', nullable: true })
  resolveNote: string;
}
