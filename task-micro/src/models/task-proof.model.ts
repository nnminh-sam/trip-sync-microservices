import { BaseModel } from 'src/models/base.model';
import { MediaTypeEnum } from 'src/models/media-type.enum';
import { TaskProofTypeEnum } from 'src/models/task-proof-type.enum';
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

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    enum: TaskProofTypeEnum,
  })
  type: TaskProofTypeEnum;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  mediaUrl: string;

  @Column({ type: 'varchar', length: 10, nullable: false })
  mediaType: MediaTypeEnum;

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
    select: false, // Don't select by default to avoid AsText issue
    insert: false, // Don't insert to avoid GeomFromText issue
    update: false, // Don't update to avoid GeomFromText issue
    transformer: {
      to: (value: { x: number; y: number } | null) => {
        if (!value) return null;
        // Return WKT format string for MySQL ST_GeomFromText
        return `POINT(${value.x} ${value.y})`;
      },
      from: (value: any) => {
        if (!value) return null;
        // Handle different MySQL spatial data formats
        if (typeof value === 'string') {
          // Parse WKT format if needed
          const match = value.match(/POINT\(([^ ]+) ([^ ]+)\)/);
          if (match) {
            return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
          }
        }
        // Handle binary format or already parsed object
        if (value.x !== undefined && value.y !== undefined) {
          return { x: value.x, y: value.y };
        }
        return value;
      },
    },
  })
  locationPoint: { x: number; y: number } | null;
}
