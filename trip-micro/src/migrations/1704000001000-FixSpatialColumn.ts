import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSpatialColumn1704000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, drop any existing spatial index if it exists
    try {
      await queryRunner.query(`DROP INDEX idx_task_proofs_locationPoint ON task_proofs`);
    } catch (e) {
      // Index doesn't exist, that's fine
    }

    // Check if locationPoint column exists
    const columnInfo = await queryRunner.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'task_proofs' 
      AND COLUMN_NAME = 'locationPoint'
    `);

    if (columnInfo.length > 0) {
      // Column exists, drop it to start fresh
      await queryRunner.query(`ALTER TABLE task_proofs DROP COLUMN locationPoint`);
    }

    // Add locationPoint column as NOT NULL with a default value
    // This avoids the issue of existing rows
    await queryRunner.query(`
      ALTER TABLE task_proofs 
      ADD COLUMN locationPoint POINT NOT NULL SRID 4326 
      DEFAULT (ST_SRID(POINT(0, 0), 4326))
    `);

    // Update all existing records with actual lat/long values
    await queryRunner.query(`
      UPDATE task_proofs 
      SET locationPoint = ST_SRID(POINT(longitude, latitude), 4326)
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `);

    // Create the spatial index
    await queryRunner.query(`
      CREATE SPATIAL INDEX idx_task_proofs_locationPoint ON task_proofs(locationPoint)
    `);

    // Remove the default constraint (optional, keeps column NOT NULL)
    await queryRunner.query(`
      ALTER TABLE task_proofs 
      ALTER COLUMN locationPoint DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop spatial index
    try {
      await queryRunner.query(`DROP INDEX idx_task_proofs_locationPoint ON task_proofs`);
    } catch (e) {
      // Index doesn't exist, that's fine
    }

    // Drop the column
    await queryRunner.query(`ALTER TABLE task_proofs DROP COLUMN locationPoint`);
  }
}