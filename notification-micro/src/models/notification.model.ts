import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { BaseModel } from 'src/models/base.model';


@Entity({ name: 'notifications' })
export class Notification extends BaseModel{
  @Column()
  user_id: string;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column()
  priority: string;

  @Column('text', { nullable: true })
  metadata?: string;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @Column({ nullable: true })
  type: string;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;
}
