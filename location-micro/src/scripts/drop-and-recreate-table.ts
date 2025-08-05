import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

async function dropAndRecreateTable() {
  const connection = await createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'tripsyncdb',
  });

  try {
    console.log('Dropping existing location table...');
    
    // Drop table if exists
    await connection.execute(`DROP TABLE IF EXISTS location`);
    console.log('✓ Dropped existing table');

    // Create the table
    await connection.execute(`
      CREATE TABLE location (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) UNIQUE NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        offset_radious FLOAT DEFAULT 100,
        description TEXT,
        created_by VARCHAR(36) NOT NULL,
        type VARCHAR(50) DEFAULT 'office',
        is_active BOOLEAN DEFAULT true,
        metadata JSON,
        address VARCHAR(255),
        city VARCHAR(100),
        country VARCHAR(100),
        timezone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✓ Created location table');

    // Add spatial columns separately
    await connection.execute(`
      ALTER TABLE location 
      ADD COLUMN geom POINT SRID 4326
    `);
    
    console.log('✓ Added geom column');

    // Add boundary column (nullable)
    await connection.execute(`
      ALTER TABLE location 
      ADD COLUMN boundary POLYGON SRID 4326
    `);
    
    console.log('✓ Added boundary column');

    // Don't create spatial index on nullable column
    // The LocationRepository will handle checking for spatial support
    
    await connection.execute(`
      CREATE INDEX idx_location_type_active ON location(type, is_active)
    `);
    
    await connection.execute(`
      CREATE INDEX idx_location_created_by_active ON location(created_by, is_active)
    `);
    
    console.log('✓ Created all indexes');

    console.log('✅ Location table setup completed successfully!');
  } catch (error) {
    console.error('Error setting up location table:', error);
  } finally {
    await connection.end();
  }
}

// Run the script
dropAndRecreateTable().catch(console.error);