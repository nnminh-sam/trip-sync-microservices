import { Entity, Column } from 'typeorm';
import { BaseModel } from './base.model';
import { MediaStatusEnum } from './enums/media-status.enum';

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

  @Column({ type: 'varchar', length: 500, nullable: true })
  gcsUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  publicUrl?: string;

  @Column({ type: 'uuid', nullable: false })
  uploaderId: string;

  @Column({ type: 'enum', enum: MediaStatusEnum, nullable: false })
  status: MediaStatusEnum;

  @Column({ type: 'varchar', nullable: true })
  metadata: string;

  @Column({ type: 'boolean', default: false })
  signatureVerified: boolean;

  @Column({ type: 'text', nullable: true })
  signatureData?: string; // GPG signature
}
