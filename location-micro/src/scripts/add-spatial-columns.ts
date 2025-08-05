import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

async function addSpatialColumns() {
  const connection = await createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'tripsync_location',
  });

  try {
    console.log('Adding spatial columns to location table...');

    // Check if geom column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'location' 
      AND COLUMN_NAME = 'geom'
    `) as any;

    if (!columns || columns.length === 0) {
      // Add spatial column
      await connection.execute(`
        ALTER TABLE location 
        ADD COLUMN geom POINT SRID 4326
      `);
      
      console.log('✓ Added geom column');

      // Update existing records with spatial data
      await connection.execute(`
        UPDATE location 
        SET geom = ST_SRID(POINT(longitude, latitude), 4326)
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      `);
      
      console.log('✓ Updated existing records with spatial data');

      // Create spatial index
      await connection.execute(`
        CREATE SPATIAL INDEX idx_location_geom ON location(geom)
      `);
      
      console.log('✓ Created spatial index');
    } else {
      console.log('✓ Geom column already exists');
    }

    // Check and add other columns if needed
    const columnsToAdd = [
      { name: 'type', definition: "VARCHAR(50) DEFAULT 'office'" },
      { name: 'is_active', definition: "BOOLEAN DEFAULT true" },
      { name: 'metadata', definition: "JSON" },
      { name: 'address', definition: "VARCHAR(255)" },
      { name: 'city', definition: "VARCHAR(100)" },
      { name: 'country', definition: "VARCHAR(100)" },
      { name: 'timezone', definition: "VARCHAR(50)" },
      { name: 'boundary', definition: "POLYGON SRID 4326" },
    ];

    for (const column of columnsToAdd) {
      const [existing] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'location' 
        AND COLUMN_NAME = ?
      `, [column.name]) as any;

      if (!existing || existing.length === 0) {
        await connection.execute(`
          ALTER TABLE location ADD COLUMN ${column.name} ${column.definition}
        `);
        console.log(`✓ Added ${column.name} column`);
      }
    }

    console.log('✅ Spatial columns setup completed successfully!');
  } catch (error) {
    console.error('Error adding spatial columns:', error);
  } finally {
    await connection.end();
  }
}

// Run the script
addSpatialColumns().catch(console.error);