import { BaseModel } from 'src/models/base.model';
import { Task } from 'src/models/task.model';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('task_proofs')
@Index(['taskId', 'type'])
@Index(['uploadedBy'])
@Index(['timestamp'])
export class TaskProof extends BaseModel {
  @Column({ type: 'uuid', nullable: false })
  taskId: string;

  @ManyToOne(() => Task, (task) => task.proofs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column({ type: 'varchar', length: 20, nullable: false })
  type: 'completion' | 'cancellation';

  @Column({ type: 'varchar', length: 255, nullable: false })
  mediaUrl: string;

  @Column({ type: 'varchar', length: 10, nullable: false })
  mediaType: 'photo' | 'video';

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: false })
  latitude: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: false })
  longitude: number;

  @Column({ type: 'datetime', nullable: false })
  timestamp: Date;

  @Column({ type: 'uuid', nullable: false })
  uploadedBy: string;

  @Column({
    type: 'point',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    transformer: {
      to: (value: { x: number; y: number } | null) => {
        if (!value) return null;
        return `POINT(${value.x} ${value.y})`;
      },
      from: (value: any) => value,
    },
  })
  locationPoint: { x: number; y: number } | null;
}
