import { DataSource } from 'typeorm';
import { Task } from '../models/task.model';
import { TaskProof } from '../models/task-proof.model';
import { AddIndexesAndSpatialSupport1704000000000 } from '../migrations/1704000000000-AddIndexesAndSpatialSupport';
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
  entities: [Task, TaskProof],
  migrations: [AddIndexesAndSpatialSupport1704000000000],
  logging: true,
});

async function runMigrations() {
  try {
    console.log('Initializing data source...');
    await AppDataSource.initialize();
    
    console.log('Running pending migrations...');
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('No pending migrations.');
    } else {
      console.log(`Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach(migration => {
        console.log(`- ${migration.name}`);
      });
    }
    
    await AppDataSource.destroy();
    console.log('Done!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();