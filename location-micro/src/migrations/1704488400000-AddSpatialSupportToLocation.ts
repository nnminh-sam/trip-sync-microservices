import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSpatialSupportToLocation1704488400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if spatial columns already exist
    const hasGeomColumn = await queryRunner.hasColumn('location', 'geom');
    const hasBoundaryColumn = await queryRunner.hasColumn('location', 'boundary');
    
    if (!hasGeomColumn) {
      // Add spatial column with SRID 4326 (WGS84)
      await queryRunner.query(`
        ALTER TABLE location 
        ADD COLUMN geom POINT SRID 4326
      `);

      // Update existing records with spatial data
      await queryRunner.query(`
        UPDATE location 
        SET geom = ST_SRID(POINT(longitude, latitude), 4326)
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      `);
    }

    if (!hasBoundaryColumn) {
      // Add boundary column
      await queryRunner.query(`
        ALTER TABLE location
        ADD COLUMN boundary POLYGON SRID 4326
      `);
    }

    // Check if columns already exist before adding
    const columns = await queryRunner.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'location'
    `);
    
    const columnNames = columns.map((col: any) => col.COLUMN_NAME);
    
    if (!columnNames.includes('type')) {
      await queryRunner.query(`
        ALTER TABLE location
        ADD COLUMN type VARCHAR(50) DEFAULT 'office'
      `);
    }
    
    if (!columnNames.includes('is_active')) {
      await queryRunner.query(`
        ALTER TABLE location
        ADD COLUMN is_active BOOLEAN DEFAULT true
      `);
    }
    
    if (!columnNames.includes('metadata')) {
      await queryRunner.query(`
        ALTER TABLE location
        ADD COLUMN metadata JSON
      `);
    }
    
    if (!columnNames.includes('address')) {
      await queryRunner.query(`
        ALTER TABLE location
        ADD COLUMN address VARCHAR(255)
      `);
    }
    
    if (!columnNames.includes('city')) {
      await queryRunner.query(`
        ALTER TABLE location
        ADD COLUMN city VARCHAR(100)
      `);
    }
    
    if (!columnNames.includes('country')) {
      await queryRunner.query(`
        ALTER TABLE location
        ADD COLUMN country VARCHAR(100)
      `);
    }
    
    if (!columnNames.includes('timezone')) {
      await queryRunner.query(`
        ALTER TABLE location
        ADD COLUMN timezone VARCHAR(50)
      `);
    }

    // Create spatial indexes if they don't exist
    const indexes = await queryRunner.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'location'
    `);
    
    const indexNames = indexes.map((idx: any) => idx.INDEX_NAME);
    
    if (hasGeomColumn && !indexNames.includes('idx_location_geom')) {
      await queryRunner.query(`
        CREATE SPATIAL INDEX idx_location_geom ON location(geom)
      `);
    }

    if (!indexNames.includes('idx_location_type_active')) {
      await queryRunner.query(`
        CREATE INDEX idx_location_type_active ON location(type, is_active)
      `);
    }
    
    if (!indexNames.includes('idx_location_created_by_active')) {
      await queryRunner.query(`
        CREATE INDEX idx_location_created_by_active ON location(created_by, is_active)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes if they exist
    const indexes = await queryRunner.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'location'
      AND INDEX_NAME IN ('idx_location_geom', 'idx_location_type_active', 'idx_location_created_by_active')
    `);
    
    for (const index of indexes) {
      await queryRunner.query(`DROP INDEX ${index.INDEX_NAME} ON location`);
    }

    // Drop columns if they exist
    const columnsToDropp = ['timezone', 'country', 'city', 'address', 'metadata', 'boundary', 'is_active', 'type', 'geom'];
    
    for (const column of columnsToDropp) {
      const hasColumn = await queryRunner.hasColumn('location', column);
      if (hasColumn) {
        await queryRunner.query(`ALTER TABLE location DROP COLUMN ${column}`);
      }
    }
  }
}