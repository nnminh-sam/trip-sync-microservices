import { Entity, Column } from 'typeorm';
import { BaseModel } from './base.model';

@Entity('media')
export class Media extends BaseModel {
  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', length: 100 })
  mimetype: string;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: 'varchar', length: 500 })
  gcsUrl: string;

  @Column({ type: 'varchar', length: 500 })
  publicUrl: string;

  @Column({ type: 'uuid' })
  uploaderId: string;

  @Column({ type: 'uuid', nullable: true })
  taskId?: string;

  @Column({ type: 'varchar', length: 50 })
  status: string; // 'uploaded', 'verified', 'failed'

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: false })
  signatureVerified: boolean;

  @Column({ type: 'text', nullable: true })
  signatureData?: string; // GPG signature
}
