import { Column, Entity } from 'typeorm';
import { BaseModel } from './base.model';

@Entity({ name: 'export_logs' })
export class ExportLog extends BaseModel{
  @Column()
  requested_by: string; // FK -> users.id

  @Column()
  export_type: string; // e.g., 'trip_summary'

  @Column({ type: 'text', nullable: true })
  filter_params?: string;

  @Column({ nullable: true })
  file_url?: string;
}
