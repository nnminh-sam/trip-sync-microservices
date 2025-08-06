import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexesAndSpatialSupport1704000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check and add indexes for tasks table
    const tasksIndexes = await queryRunner.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'tasks'
    `);
    const existingTaskIndexes = tasksIndexes.map((idx: any) => idx.INDEX_NAME);

    if (!existingTaskIndexes.includes('idx_tasks_tripLocationId')) {
      await queryRunner.query(`
        CREATE INDEX idx_tasks_tripLocationId ON tasks(tripLocationId)
      `);
    }

    if (!existingTaskIndexes.includes('idx_tasks_status')) {
      await queryRunner.query(`
        CREATE INDEX idx_tasks_status ON tasks(status)
      `);
    }

    if (!existingTaskIndexes.includes('idx_tasks_tripLocationId_status')) {
      await queryRunner.query(`
        CREATE INDEX idx_tasks_tripLocationId_status ON tasks(tripLocationId, status)
      `);
    }

    // Check and add indexes for task_proofs table
    const taskProofsIndexes = await queryRunner.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'task_proofs'
    `);
    const existingProofIndexes = taskProofsIndexes.map(
      (idx: any) => idx.INDEX_NAME,
    );

    if (!existingProofIndexes.includes('idx_task_proofs_taskId_type')) {
      await queryRunner.query(`
        CREATE INDEX idx_task_proofs_taskId_type ON task_proofs(taskId, type)
      `);
    }

    if (!existingProofIndexes.includes('idx_task_proofs_uploadedBy')) {
      await queryRunner.query(`
        CREATE INDEX idx_task_proofs_uploadedBy ON task_proofs(uploadedBy)
      `);
    }

    if (!existingProofIndexes.includes('idx_task_proofs_timestamp')) {
      await queryRunner.query(`
        CREATE INDEX idx_task_proofs_timestamp ON task_proofs(timestamp)
      `);
    }

    // Update locationPoint column to use spatial data type
    // Check the current column type
    const columnInfo = await queryRunner.query(`
      SELECT COLUMN_TYPE, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'task_proofs' 
      AND COLUMN_NAME = 'locationPoint'
    `);

    // Handle different scenarios
    if (columnInfo.length > 0) {
      // Column exists, check if it needs to be recreated
      if (columnInfo[0].DATA_TYPE !== 'point' || columnInfo[0].IS_NULLABLE === 'YES') {
        // Drop the existing column
        await queryRunner.query(`
          ALTER TABLE task_proofs DROP COLUMN locationPoint
        `);
        
        // Recreate as spatial column
        await queryRunner.query(`
          ALTER TABLE task_proofs 
          ADD COLUMN locationPoint POINT SRID 4326
        `);
      }
    } else {
      // Column doesn't exist, create it
      await queryRunner.query(`
        ALTER TABLE task_proofs 
        ADD COLUMN locationPoint POINT SRID 4326
      `);
    }

    // First ensure all records have locationPoint values
    await queryRunner.query(`
      UPDATE task_proofs 
      SET locationPoint = ST_SRID(POINT(longitude, latitude), 4326)
      WHERE locationPoint IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL
    `);

    // Set default for any remaining NULL values (use 0,0 as default)
    await queryRunner.query(`
      UPDATE task_proofs 
      SET locationPoint = ST_SRID(POINT(0, 0), 4326)
      WHERE locationPoint IS NULL
    `);

    // Now make the column NOT NULL
    await queryRunner.query(`
      ALTER TABLE task_proofs 
      MODIFY COLUMN locationPoint POINT NOT NULL SRID 4326
    `);

    // Re-fetch index info after column modifications
    const updatedProofIndexes = await queryRunner.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'task_proofs'
    `);
    const updatedIndexNames = updatedProofIndexes.map((idx: any) => idx.INDEX_NAME);

    // Create spatial index if it doesn't exist
    if (!updatedIndexNames.includes('idx_task_proofs_locationPoint')) {
      await queryRunner.query(`
        CREATE SPATIAL INDEX idx_task_proofs_locationPoint ON task_proofs(locationPoint)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get existing indexes
    const tasksIndexes = await queryRunner.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'tasks'
    `);
    const existingTaskIndexes = tasksIndexes.map((idx: any) => idx.INDEX_NAME);

    const taskProofsIndexes = await queryRunner.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'task_proofs'
    `);
    const existingProofIndexes = taskProofsIndexes.map(
      (idx: any) => idx.INDEX_NAME,
    );

    // Drop indexes from tasks table if they exist
    if (existingTaskIndexes.includes('idx_tasks_tripLocationId')) {
      await queryRunner.query(`DROP INDEX idx_tasks_tripLocationId ON tasks`);
    }
    if (existingTaskIndexes.includes('idx_tasks_status')) {
      await queryRunner.query(`DROP INDEX idx_tasks_status ON tasks`);
    }
    if (existingTaskIndexes.includes('idx_tasks_tripLocationId_status')) {
      await queryRunner.query(
        `DROP INDEX idx_tasks_tripLocationId_status ON tasks`,
      );
    }

    // Drop indexes from task_proofs table if they exist
    if (existingProofIndexes.includes('idx_task_proofs_taskId_type')) {
      await queryRunner.query(
        `DROP INDEX idx_task_proofs_taskId_type ON task_proofs`,
      );
    }
    if (existingProofIndexes.includes('idx_task_proofs_uploadedBy')) {
      await queryRunner.query(
        `DROP INDEX idx_task_proofs_uploadedBy ON task_proofs`,
      );
    }
    if (existingProofIndexes.includes('idx_task_proofs_timestamp')) {
      await queryRunner.query(
        `DROP INDEX idx_task_proofs_timestamp ON task_proofs`,
      );
    }
    if (existingProofIndexes.includes('idx_task_proofs_locationPoint')) {
      await queryRunner.query(
        `DROP INDEX idx_task_proofs_locationPoint ON task_proofs`,
      );
    }

    // Convert locationPoint back to string type
    await queryRunner.query(`
      ALTER TABLE task_proofs DROP COLUMN locationPoint
    `);

    await queryRunner.query(`
      ALTER TABLE task_proofs 
      ADD COLUMN locationPoint VARCHAR(255) NULL
    `);
  }
}
