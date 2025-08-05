import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';

// Load environment variables
config();

async function createLocationTable() {
  const connection = await createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'tripsync_location',
  });

  try {
    console.log('Creating location table...');

    // Check if table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'location'
    `) as any;

    if (!tables || tables.length === 0) {
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

      // Create regular indexes first
      await connection.execute(`
        CREATE INDEX idx_location_type_active ON location(type, is_active)
      `);
      
      await connection.execute(`
        CREATE INDEX idx_location_created_by_active ON location(created_by, is_active)
      `);
      
      console.log('✓ Created indexes');
    } else {
      console.log('✓ Location table already exists');
      
      // Run the add spatial columns script
      console.log('Checking for missing columns...');
      await import('./add-spatial-columns');
    }

    console.log('✅ Location table setup completed successfully!');
  } catch (error) {
    console.error('Error creating location table:', error);
  } finally {
    await connection.end();
  }
}

// Run the script
createLocationTable().catch(console.error);