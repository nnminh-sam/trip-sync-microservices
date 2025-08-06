import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST || 'localhost',
  port: 3306,
  username: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  database: process.env.MYSQL_DATABASE || 'taskdb',
  logging: false,
});

async function checkSpatialColumn() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    
    // Check locationPoint column details
    console.log('\n=== LocationPoint Column Details ===');
    const columnInfo = await AppDataSource.query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_TYPE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'task_proofs' 
      AND COLUMN_NAME = 'locationPoint'
    `);
    
    if (columnInfo.length > 0) {
      console.log('Column exists with properties:');
      console.log(columnInfo[0]);
    } else {
      console.log('LocationPoint column does not exist');
    }
    
    // Check if there are any NULL values
    console.log('\n=== Checking for NULL values ===');
    const nullCount = await AppDataSource.query(`
      SELECT COUNT(*) as null_count
      FROM task_proofs
      WHERE locationPoint IS NULL
    `);
    console.log(`NULL locationPoint values: ${nullCount[0].null_count}`);
    
    // Check total records
    const totalCount = await AppDataSource.query(`
      SELECT COUNT(*) as total_count
      FROM task_proofs
    `);
    console.log(`Total records: ${totalCount[0].total_count}`);
    
    // Check spatial indexes
    console.log('\n=== Spatial Indexes ===');
    const spatialIndexes = await AppDataSource.query(`
      SELECT INDEX_NAME, INDEX_TYPE
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'task_proofs'
      AND INDEX_TYPE = 'SPATIAL'
    `);
    
    if (spatialIndexes.length > 0) {
      console.log('Spatial indexes found:');
      spatialIndexes.forEach((idx: any) => {
        console.log(`- ${idx.INDEX_NAME}`);
      });
    } else {
      console.log('No spatial indexes found');
    }
    
    await AppDataSource.destroy();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSpatialColumn();