import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

async function fixSpatialColumn() {
  const connection = await createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  try {
    console.log('Fixing spatial column...');

    // First, update any NULL geom values with data from lat/lng
    await connection.execute(`
      UPDATE location 
      SET geom = ST_SRID(POINT(longitude, latitude), 4326)
      WHERE geom IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL
    `);
    console.log('✓ Updated NULL geom values');

    // Check if there are any records
    const [records] = await connection.execute(`SELECT COUNT(*) as count FROM location`) as any;
    const recordCount = records[0].count;
    
    if (recordCount === 0) {
      // If no records, we can safely modify the column
      await connection.execute(`
        ALTER TABLE location 
        MODIFY COLUMN geom POINT SRID 4326 NOT NULL
      `);
      console.log('✓ Modified geom column to NOT NULL');
    } else {
      // If there are records, ensure all have geom values
      const [nullGeoms] = await connection.execute(`
        SELECT COUNT(*) as count FROM location WHERE geom IS NULL
      `) as any;
      
      if (nullGeoms[0].count === 0) {
        // Safe to make NOT NULL
        await connection.execute(`
          ALTER TABLE location 
          MODIFY COLUMN geom POINT SRID 4326 NOT NULL
        `);
        console.log('✓ Modified geom column to NOT NULL');
      } else {
        console.log('⚠️  Cannot make geom NOT NULL - some records have NULL values');
        // Set a default point for NULL values (0,0)
        await connection.execute(`
          UPDATE location 
          SET geom = ST_SRID(POINT(0, 0), 4326)
          WHERE geom IS NULL
        `);
        console.log('✓ Set default geom values for NULL records');
        
        // Now make it NOT NULL
        await connection.execute(`
          ALTER TABLE location 
          MODIFY COLUMN geom POINT SRID 4326 NOT NULL
        `);
        console.log('✓ Modified geom column to NOT NULL');
      }
    }

    // Check if spatial index exists
    const [indexes] = await connection.execute(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'location' 
      AND INDEX_NAME = 'idx_location_geom'
    `) as any;

    if (!indexes || indexes.length === 0) {
      // Create spatial index
      await connection.execute(`
        CREATE SPATIAL INDEX idx_location_geom ON location(geom)
      `);
      console.log('✓ Created spatial index');
    } else {
      console.log('✓ Spatial index already exists');
    }

    // Add a trigger to automatically update geom when lat/lng changes
    await connection.execute(`DROP TRIGGER IF EXISTS update_geom_on_location`);
    await connection.execute(`
      CREATE TRIGGER update_geom_on_location
      BEFORE INSERT ON location
      FOR EACH ROW
      SET NEW.geom = ST_SRID(POINT(NEW.longitude, NEW.latitude), 4326)
    `);
    console.log('✓ Created trigger for INSERT');

    await connection.execute(`DROP TRIGGER IF EXISTS update_geom_on_location_update`);
    await connection.execute(`
      CREATE TRIGGER update_geom_on_location_update
      BEFORE UPDATE ON location
      FOR EACH ROW
      SET NEW.geom = ST_SRID(POINT(NEW.longitude, NEW.latitude), 4326)
    `);
    console.log('✓ Created trigger for UPDATE');

    console.log('✅ Spatial column fixed successfully!');
  } catch (error) {
    console.error('Error fixing spatial column:', error);
  } finally {
    await connection.end();
  }
}

// Run the script
fixSpatialColumn().catch(console.error);