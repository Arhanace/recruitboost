import path from 'path';
import { importFinalCoaches } from './import-final-coaches';
import { pool } from './db';

async function resumeCoachImport() {
  try {
    const filePath = path.resolve('../attached_assets/final_corrected_schools.csv');
    
    // Define batch size and total records (approximately)
    const batchSize = 5000;
    const totalRecords = 29000;
    
    // Start from index 15000 since we've already imported the first 15000 coaches
    let importedSoFar = 15000;
    let startIndex = 15000;
    
    console.log(`Resuming batched coach import from ${filePath}...`);
    console.log(`Will import approximately ${totalRecords - importedSoFar} more coaches in batches of ${batchSize}`);
    console.log(`Starting from index ${startIndex}`);
    
    // Never clear existing data as we're resuming
    const clearExisting = false;
    
    // Loop through batches until we've imported all coaches
    while (importedSoFar < totalRecords) {
      console.log(`\n--- Starting batch from index ${startIndex} ---`);
      
      // Import a batch of coaches
      const result = await importFinalCoaches(
        filePath,
        batchSize,
        startIndex,
        clearExisting
      );
      
      // Update counters for the next batch
      importedSoFar += result.totalImported;
      startIndex += batchSize;
      
      console.log(`--- Finished batch. Total imported so far: ${importedSoFar} ---`);
      
      // If we imported fewer coaches than the batch size, we've likely reached the end
      if (result.totalImported < batchSize) {
        break;
      }
    }
    
    console.log(`\nImport complete. Total coaches imported: ${importedSoFar}`);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

resumeCoachImport();