import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSpatialSupportToLocation1704067200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check MySQL version
    const [version] = await queryRunner.query(`SELECT VERSION() as version`);
    console.log(`MySQL Version: ${version.version}`);
    
    // Test spatial support
    try {
      await queryRunner.query(`SELECT ST_Distance_Sphere(POINT(0,0), POINT(1,1)) as test`);
      console.log('MySQL spatial functions are available');
    } catch (error) {
      throw new Error('MySQL spatial functions not available. Please ensure MySQL 5.7+ is installed.');
    }

    // Check if geom column already exists
    const geomColumn = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'location'
      AND COLUMN_NAME = 'geom'
    `);

    if (geomColumn[0].count === 0) {
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

    // Check if new columns exist and add them if not
    const columnsToAdd = [
      { name: 'type', definition: "VARCHAR(50) DEFAULT 'office'" },
      { name: 'is_active', definition: "BOOLEAN DEFAULT true" },
      { name: 'boundary', definition: "POLYGON SRID 4326" },
      { name: 'metadata', definition: "JSON" },
      { name: 'address', definition: "VARCHAR(255)" },
      { name: 'city', definition: "VARCHAR(100)" },
      { name: 'country', definition: "VARCHAR(100)" },
      { name: 'timezone', definition: "VARCHAR(50)" },
      { name: 'description', definition: "TEXT" }
    ];

    for (const column of columnsToAdd) {
      const exists = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'location'
        AND COLUMN_NAME = '${column.name}'
      `);

      if (exists[0].count === 0) {
        await queryRunner.query(`
          ALTER TABLE location ADD COLUMN ${column.name} ${column.definition}
        `);
      }
    }

    // Update column names to snake_case if needed
    const columnRenames = [
      { old: 'offsetRadious', new: 'offset_radious' },
      { old: 'createdBy', new: 'created_by' },
      { old: 'isActive', new: 'is_active' }
    ];

    for (const rename of columnRenames) {
      const oldExists = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'location'
        AND COLUMN_NAME = '${rename.old}'
      `);

      if (oldExists[0].count > 0) {
        await queryRunner.query(`
          ALTER TABLE location CHANGE COLUMN ${rename.old} ${rename.new} 
          ${rename.new === 'offset_radious' ? 'FLOAT DEFAULT 100' : 
            rename.new === 'is_active' ? 'BOOLEAN DEFAULT true' : 
            'VARCHAR(36)'}
        `);
      }
    }

    // Create spatial index if it doesn't exist
    const spatialIndex = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'location'
      AND INDEX_NAME = 'idx_location_geom'
    `);

    if (spatialIndex[0].count === 0) {
      await queryRunner.query(`
        CREATE SPATIAL INDEX idx_location_geom ON location(geom)
      `);
    }

    // Create regular indexes
    const indexes = [
      { name: 'idx_location_type_active', columns: '(type, is_active)' },
      { name: 'idx_location_created_by_active', columns: '(created_by, is_active)' }
    ];

    for (const index of indexes) {
      const exists = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'location'
        AND INDEX_NAME = '${index.name}'
      `);

      if (exists[0].count === 0) {
        await queryRunner.query(`
          CREATE INDEX ${index.name} ON location ${index.columns}
        `);
      }
    }

    // For MySQL 5.7+, create virtual column for JSON indexing
    const virtualColumn = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'location'
      AND COLUMN_NAME = 'metadata_contact_person'
    `);

    if (virtualColumn[0].count === 0) {
      await queryRunner.query(`
        ALTER TABLE location 
        ADD COLUMN metadata_contact_person VARCHAR(255) 
        GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.contactPerson'))) VIRTUAL
      `);
      
      await queryRunner.query(`
        CREATE INDEX idx_location_metadata_contact ON location(metadata_contact_person)
      `);
    }

    // Remove old 'location' column if it exists (it's redundant with address)
    const locationColumn = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'location'
      AND COLUMN_NAME = 'location'
    `);

    if (locationColumn[0].count > 0) {
      // First copy data to address if address is empty
      await queryRunner.query(`
        UPDATE location 
        SET address = location 
        WHERE address IS NULL AND location IS NOT NULL
      `);
      
      await queryRunner.query(`
        ALTER TABLE location DROP COLUMN location
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX idx_location_metadata_contact ON location`);
    await queryRunner.query(`DROP INDEX idx_location_created_by_active ON location`);
    await queryRunner.query(`DROP INDEX idx_location_type_active ON location`);
    await queryRunner.query(`DROP INDEX idx_location_geom ON location`);

    // Drop virtual column
    await queryRunner.query(`ALTER TABLE location DROP COLUMN metadata_contact_person`);

    // Drop columns (only the ones we added)
    const columnsToDrop = ['timezone', 'country', 'city', 'address', 'metadata', 'boundary', 'type', 'geom', 'description'];
    
    for (const column of columnsToDrop) {
      const exists = await queryRunner.query(`
        SELECT COUNT(*) as count
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'location'
        AND COLUMN_NAME = '${column}'
      `);

      if (exists[0].count > 0) {
        await queryRunner.query(`ALTER TABLE location DROP COLUMN ${column}`);
      }
    }

    // Restore original column names
    await queryRunner.query(`ALTER TABLE location CHANGE COLUMN is_active isActive BOOLEAN DEFAULT true`);
    await queryRunner.query(`ALTER TABLE location CHANGE COLUMN created_by createdBy VARCHAR(36)`);
    await queryRunner.query(`ALTER TABLE location CHANGE COLUMN offset_radious offsetRadious FLOAT DEFAULT 100`);

    // Restore location column
    await queryRunner.query(`ALTER TABLE location ADD COLUMN location VARCHAR(255)`);
  }
}