import { BaseModel } from 'src/models/base.model';
import { Column, Entity, Index } from 'typeorm';
import { LocationType } from '../types/location.types';

@Entity('location')
@Index('idx_location_geom', { spatial: true })
@Index('idx_location_type_active', ['type', 'isActive'])
@Index('idx_location_created_by_active', ['createdBy', 'isActive'])
export class Location extends BaseModel {
  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: false })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: false })
  longitude: number;

  @Column({ type: 'float', name: 'offset_radious', default: 100 })
  offsetRadious: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid', name: 'created_by', nullable: false })
  createdBy: string;

  @Column({ 
    type: 'point', 
    srid: 4326,
    nullable: true,
    transformer: {
      to: (value: { x: number; y: number }) => {
        if (!value) return null;
        return `POINT(${value.x} ${value.y})`;
      },
      from: (value: any) => {
        if (!value) return null;
        // MySQL returns geometry as buffer, need to parse
        // This is a simplified version - you may need to use wkx library for proper parsing
        return value;
      }
    }
  })
  geom: { x: number; y: number } | null;

  @Column({ 
    type: 'enum',
    enum: LocationType,
    default: LocationType.OFFICE 
  })
  type: LocationType;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ 
    type: 'polygon', 
    srid: 4326,
    nullable: true 
  })
  boundary: any;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone: string;

  // Virtual column for JSON indexing (defined in migration)
  metadataContactPerson?: string;
}
