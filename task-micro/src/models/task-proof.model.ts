import { BaseModel } from 'src/models/base.model';
import { Task } from 'src/models/task.model';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('task_proofs')
export class TaskProof extends BaseModel {
  @Column({ type: 'uuid', nullable: false })
  taskId: string;

  @ManyToOne(() => Task, (task) => task.proofs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column({ type: 'string', nullable: false })
  type: 'completion' | 'cancellation';

  @Column({ type: 'string', nullable: false })
  mediaUrl: string;

  @Column({ type: 'string', nullable: false })
  mediaType: 'photo' | 'video';

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: false })
  latitude: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: false })
  longitude: number;

  @Column({ type: 'datetime', nullable: false })
  timestamp: Date;

  @Column({ type: 'uuid', nullable: false })
  uploadedBy: string;

  @Column({ type: 'point' })
  locationPoint: string;
}
