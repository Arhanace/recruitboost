import { importCoaches } from './import-coaches';
import { pool } from './db';

// Import function that processes chunks
export async function importAllCoaches(filePath: string, chunkSize: number = 10000) {
  console.log(`Starting all coach import in batches from ${filePath} (chunk size: ${chunkSize})...`);
  
  const csvFile = filePath || 'attached_assets/final_corrected_schools.csv';
  let startIndex = 0;
  let totalImported = 0;
  let shouldContinue = true;
  
  try {
    // First chunk will clear the database and reset sequence
    console.log(`Importing chunk starting at index ${startIndex} with chunk size ${chunkSize}`);
    const result = await importCoaches(csvFile, chunkSize, startIndex, true);
    totalImported += result.totalImported;
    startIndex += chunkSize;
    
    // Continue importing in chunks, but don't clear the database again
    while (shouldContinue) {
      console.log(`Importing chunk starting at index ${startIndex} with chunk size ${chunkSize}`);
      const result = await importCoaches(csvFile, chunkSize, startIndex, false);
      totalImported += result.totalImported;
      
      // If we imported fewer records than the chunk size, we're done
      if (result.totalImported < chunkSize) {
        shouldContinue = false;
      } else {
        startIndex += chunkSize;
      }
    }
    
    console.log(`Import complete. Total imported: ${totalImported} coaches.`);
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

// If this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const filePath = process.argv[2] || 'attached_assets/final_corrected_schools.csv';
      const chunkSize = process.argv[3] ? parseInt(process.argv[3], 10) : 10000;
      
      await importAllCoaches(filePath, chunkSize);
    } catch (error) {
      console.error('Import failed:', error);
      process.exit(1);
    } finally {
      await pool.end();
      process.exit(0);
    }
  })();
}