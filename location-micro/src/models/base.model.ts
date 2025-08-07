import {
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
} from 'typeorm';

export class BaseModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true, default: null })
  deletedAt?: Date = null;
}
