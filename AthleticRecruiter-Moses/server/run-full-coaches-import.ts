import { importFullCoaches } from './import-full-coaches';

const filePath = '../attached_assets/final_corrected_schools.csv';

async function runImport() {
  console.log('Starting full coaches data import...');
  
  try {
    await importFullCoaches(filePath);
    console.log('Import completed successfully');
  } catch (error) {
    console.error('Import failed:', error);
  }
}

runImport()
  .then(() => {
    console.log('Import process finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error during import:', error);
    process.exit(1);
  });