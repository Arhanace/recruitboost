import path from 'path';
import { importFinalCoaches } from './import-final-coaches';
import { pool } from './db';

async function runFinalImport() {
  try {
    const filePath = path.resolve('../attached_assets/final_corrected_schools.csv');
    
    // Get number of coaches to import from command line argument, or import all if not specified
    const limit = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;
    
    console.log(`Starting coach import from ${filePath}${limit ? ` (limit: ${limit})` : ''}...`);
    const result = await importFinalCoaches(filePath, limit);
    console.log(`Import complete. Imported ${result.totalImported} coaches.`);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runFinalImport();