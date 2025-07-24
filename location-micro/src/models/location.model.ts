import { BaseModel } from 'src/models/base.model';
import { Column, Entity } from 'typeorm';

@Entity()
export class Location extends BaseModel {
  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  name: string;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: false })
  latitude: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: false })
  longitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: false })
  offsetRadious: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  location: string;

  @Column({ type: 'uuid', nullable: false })
  createdBy: string;
}
