import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { BaseModel } from 'src/models/base.model';

@Entity({ name: 'notifications' })
export class Notification extends BaseModel{
  @Column()
  user_id: string;

  @Column('text')
  message: string;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;
}
