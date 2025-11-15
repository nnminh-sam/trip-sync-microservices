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

async function checkIndexes() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    
    // Check tasks table indexes
    console.log('\n=== Tasks Table Indexes ===');
    const taskIndexes = await AppDataSource.query(`
      SELECT INDEX_NAME, COLUMN_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'tasks'
      AND INDEX_NAME != 'PRIMARY'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `);
    
    const taskIndexMap = new Map();
    taskIndexes.forEach((idx: any) => {
      if (!taskIndexMap.has(idx.INDEX_NAME)) {
        taskIndexMap.set(idx.INDEX_NAME, []);
      }
      taskIndexMap.get(idx.INDEX_NAME).push(idx.COLUMN_NAME);
    });
    
    taskIndexMap.forEach((columns, indexName) => {
      console.log(`- ${indexName}: (${columns.join(', ')})`);
    });
    
    // Check task_proofs table indexes
    console.log('\n=== Task Proofs Table Indexes ===');
    const proofIndexes = await AppDataSource.query(`
      SELECT INDEX_NAME, COLUMN_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'task_proofs'
      AND INDEX_NAME != 'PRIMARY'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `);
    
    const proofIndexMap = new Map();
    proofIndexes.forEach((idx: any) => {
      if (!proofIndexMap.has(idx.INDEX_NAME)) {
        proofIndexMap.set(idx.INDEX_NAME, []);
      }
      proofIndexMap.get(idx.INDEX_NAME).push(idx.COLUMN_NAME);
    });
    
    proofIndexMap.forEach((columns, indexName) => {
      console.log(`- ${indexName}: (${columns.join(', ')})`);
    });
    
    // Check locationPoint column type
    console.log('\n=== LocationPoint Column Info ===');
    const columnInfo = await AppDataSource.query(`
      SELECT COLUMN_TYPE, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'task_proofs' 
      AND COLUMN_NAME = 'locationPoint'
    `);
    
    if (columnInfo.length > 0) {
      console.log(`- Type: ${columnInfo[0].DATA_TYPE}`);
      console.log(`- Column Type: ${columnInfo[0].COLUMN_TYPE}`);
      console.log(`- Nullable: ${columnInfo[0].IS_NULLABLE}`);
    } else {
      console.log('- LocationPoint column not found');
    }
    
    await AppDataSource.destroy();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error checking indexes:', error);
    process.exit(1);
  }
}

checkIndexes();