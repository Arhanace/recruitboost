import fs from 'fs';
import path from 'path';
import { pool } from './db';

async function runMigration(migrationFilePath: string) {
  if (!fs.existsSync(migrationFilePath)) {
    console.error(`Migration file not found: ${migrationFilePath}`);
    process.exit(1);
  }

  const migrationSql = fs.readFileSync(migrationFilePath, 'utf8');
  const client = await pool.connect();

  try {
    console.log(`Running migration from ${migrationFilePath}...`);
    await client.query('BEGIN');
    await client.query(migrationSql);
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const migrationFile = process.argv[2] || 'migrations/remove_city_notes_from_coaches.sql';
  const fullPath = path.resolve(migrationFile);
  runMigration(fullPath);
}