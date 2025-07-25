import { Column, Entity } from 'typeorm';
import { BaseModel } from './base.model';

@Entity({ name: 'locations' })
export class Location extends BaseModel {
  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  description: string;
}