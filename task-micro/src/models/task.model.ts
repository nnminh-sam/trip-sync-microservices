import { BaseModel } from 'src/models/base.model';
import { TaskProof } from 'src/models/task-proof.model';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('tasks')
export class Task extends BaseModel {
  @Column({ type: 'uuid', nullable: false })
  tripLocationId: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  title: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'varchar', nullable: false })
  status: 'pending' | 'completed' | 'canceled';

  @Column({ type: 'text', nullable: false })
  note: string;

  @Column({ type: 'datetime', nullable: false })
  deadline: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  canceledAt?: Date;

  @Column({ type: 'text', nullable: true })
  cancelReason?: string;

  @OneToMany(() => TaskProof, (proof) => proof.task, { cascade: true })
  proofs: TaskProof[];
}
