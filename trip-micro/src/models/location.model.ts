import { BaseModel } from 'src/models/base.model';
import { Column, Entity, Index } from 'typeorm';
import { LocationType } from '../types/location.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('location')
@Index('idx_location_geom', ['geom'], { spatial: true })
@Index('idx_location_type', ['type'])
@Index('idx_location_created_by', ['createdBy'])
export class Location extends BaseModel {
  @ApiProperty({
    description: 'Unique name of the location',
    example: 'HQ Office Building',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  name: string;

  @ApiProperty({
    description: 'Latitude coordinate of the location',
    example: 10.7769331,
    minimum: -90,
    maximum: 90,
  })
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: false })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate of the location',
    example: 106.7009238,
    minimum: -180,
    maximum: 180,
  })
  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: false })
  longitude: number;

  @ApiProperty({
    description: 'Offset radius in meters for check-in/check-out validation',
    example: 100,
    default: 100,
    minimum: 0,
  })
  @Column({ type: 'float', name: 'offset_radious', default: 100 })
  offsetRadious: number;

  @ApiPropertyOptional({
    description: 'Detailed description of the location',
    example: 'Main headquarters building with parking facilities',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'UUID of the user who created this location',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @Column({ type: 'uuid', name: 'created_by', nullable: false })
  createdBy: string;

  @ApiPropertyOptional({
    description: 'Spatial point representation for GIS operations',
    example: { x: 106.7009238, y: 10.7769331 },
    type: 'object',
    properties: {
      x: { type: 'number', description: 'Longitude' },
      y: { type: 'number', description: 'Latitude' },
    },
  })
  @Column({
    type: 'point',
    srid: 4326,
    nullable: false,
    spatialFeatureType: 'Point',
    select: false, // Don't select by default to avoid ST_AsText issues
  })
  geom: { x: number; y: number };

  @ApiProperty({
    description: 'Type of location',
    enum: LocationType,
    example: LocationType.OFFICE,
    default: LocationType.OFFICE,
  })
  @Column({
    type: 'enum',
    enum: LocationType,
    default: LocationType.OFFICE,
  })
  type: LocationType;

  @ApiPropertyOptional({
    description: 'Polygon boundary for geofencing',
    example: null,
    nullable: true,
  })
  @Column({
    type: 'polygon',
    srid: 4326,
    nullable: true,
    spatialFeatureType: 'Polygon',
    select: false, // Don't select by default to avoid ST_AsText issues
  })
  boundary: any;

  @ApiPropertyOptional({
    description: 'Additional metadata for the location',
    example: {
      contactPerson: 'John Doe',
      contactPhone: '+84901234567',
      workingHours: { start: '08:00', end: '17:00' },
      facilities: ['parking', 'cafeteria'],
    },
  })
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Street address of the location',
    example: '123 Nguyen Hue Street, District 1',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @ApiPropertyOptional({
    description: 'City where the location is situated',
    example: 'Ho Chi Minh City',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @ApiPropertyOptional({
    description: 'Country where the location is situated',
    example: 'Vietnam',
    maxLength: 100,
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @ApiPropertyOptional({
    description: 'Timezone of the location',
    example: 'Asia/Ho_Chi_Minh',
    maxLength: 50,
  })
  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone: string;
}

