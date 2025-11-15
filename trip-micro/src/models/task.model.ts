import { BaseModel } from 'src/models/base.model';
import { TaskProof } from 'src/models/task-proof.model';
import { TaskFile } from 'src/models/task-file.model';
import { TaskStatusEnum } from 'src/models/task-status.enum';
import { Column, Entity, Index, OneToMany } from 'typeorm';

@Entity('tasks')
@Index(['tripLocationId'])
@Index(['status'])
@Index(['tripLocationId', 'status'])
export class Task extends BaseModel {
  // * Task metadata begin here
  @Column({ type: 'uuid', nullable: false })
  tripLocationId: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  title: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'enum', enum: TaskStatusEnum, nullable: false })
  status: TaskStatusEnum;

  @Column({ type: 'text', nullable: false })
  note: string;

  @Column({ type: 'datetime', nullable: false })
  deadline: Date;
  // * Task metadata end above

  // * Task duration begin here
  @Column({ type: 'datetime', nullable: true })
  startedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt?: Date;
  // * Task duration end above

  // * Task approval begin here
  @Column({ type: 'datetime', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;
  // * Task approval end above

  // * Task rejection begin here
  @Column({ type: 'datetime', nullable: true })
  rejectedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  rejectedBy?: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;
  // * Task rejection end above

  // * Task cancelation begin here
  @Column({ type: 'datetime', nullable: true })
  canceledAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  canceledBy?: string;

  @Column({ type: 'text', nullable: true })
  cancelReason?: string;
  // * Task cancelation end above

  @OneToMany(() => TaskProof, (proof) => proof.task, { cascade: true })
  proofs: TaskProof[];

  @OneToMany(() => TaskFile, (file) => file.task, { cascade: true })
  files: TaskFile[];
}

export type TaskAttribute = keyof Task;

