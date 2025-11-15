import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from './base.model';
import { Task } from './task.model';

@Entity({ name: 'task_files' })
export class TaskFile extends BaseModel {
  @Column({ type: 'uuid' })
  task_id: string;

  @Column({ type: 'varchar', length: 500 })
  filename: string;

  @Column({ type: 'varchar', length: 255 })
  original_name: string;

  @Column({ type: 'varchar', length: 100 })
  mimetype: string;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: 'varchar', length: 500 })
  gcs_url: string;

  @Column({ type: 'varchar', length: 500 })
  public_url: string;

  @Column({ type: 'varchar', length: 255 })
  uploaded_by: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Task, (task) => task.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;
}

