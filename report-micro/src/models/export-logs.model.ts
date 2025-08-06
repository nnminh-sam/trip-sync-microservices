import { Column, Entity } from 'typeorm';
import { BaseModel } from './base.model';

@Entity({ name: 'export_logs' })
export class ExportLog extends BaseModel{
  @Column()
  requested_by: string;

  @Column()
  export_type: string;

  @Column({ type: 'text', nullable: true })
  filters: string;

  @Column({ nullable: true })
  file_url?: string;

}
