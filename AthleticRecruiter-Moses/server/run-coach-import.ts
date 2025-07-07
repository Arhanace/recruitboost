import { importCoaches } from './import-coaches';
import { pool } from './db';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { coaches } from '@shared/schema';
import { db } from './db';
import { count } from 'drizzle-orm';

// Use absolute path for the CSV file
// Go up one directory from the server folder to the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const COACHES_FILE_PATH = path.join(ROOT_DIR, 'attached_assets', 'final_corrected_schools.csv');

// Debug file path
console.log('Checking if file exists:', COACHES_FILE_PATH);
console.log('File exists:', fs.existsSync(COACHES_FILE_PATH));

// Chunk configuration
const CHUNK_SIZE = 5000; // Size of each chunk to import
const MAX_COACHES = 30000; // Maximum number of coaches to import (just a safeguard)

async function runImport() {
  console.log(`Starting coach data import from ${COACHES_FILE_PATH}...`);
  
  try {
    // Check existing coach count
    const [countResult] = await db.select({ value: count() }).from(coaches);
    const existingCount = countResult?.value || 0;
    console.log(`Current coach count in database: ${existingCount}`);
    
    // Determine if this is a new import or continuing an existing one
    let shouldClearExisting = existingCount === 0;
    let startIndex = shouldClearExisting ? 0 : existingCount;
    
    console.log(`Starting import at index ${startIndex} (${shouldClearExisting ? 'new import' : 'continuing existing import'})`);
    
    // If we're starting fresh or have no coaches, do a complete import
    if (shouldClearExisting) {
      console.log('Performing new import, existing data will be cleared...');
      await importCoaches(COACHES_FILE_PATH, CHUNK_SIZE, 0, true);
      console.log(`First batch of coaches imported successfully!`);
    } else {
      // We have some coaches already, continue from where we left off
      console.log(`Continuing import from index ${startIndex}...`);
      
      // Import the next chunk without clearing existing data
      const result = await importCoaches(COACHES_FILE_PATH, CHUNK_SIZE, startIndex, false);
      console.log(`Successfully imported ${result.totalImported} additional coaches.`);
    }
    
    // Get updated count
    const [updatedCountResult] = await db.select({ value: count() }).from(coaches);
    const updatedCount = updatedCountResult?.value || 0;
    
    console.log(`Import completed. Database now contains ${updatedCount} coaches.`);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the import
runImport();