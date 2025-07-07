import fs from 'fs';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { parse } from 'csv-parse/sync';
import ws from 'ws';
import { config } from 'dotenv';

// Load environment variables
config();

// Configure Neon for WebSockets
neonConfig.webSocketConstructor = ws;

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be set. Did you forget to provision a database?");
  process.exit(1);
}

// Connect to the database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function importCoaches() {
  try {
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // First, delete all existing coaches
      console.log("Deleting existing coaches...");
      await client.query('DELETE FROM coaches');
      
      // Reset the sequence
      await client.query('ALTER SEQUENCE coaches_id_seq RESTART WITH 1');
      
      // Read and parse the CSV file
      const csvContent = fs.readFileSync('attached_assets/recruitref_coaches_scraped.csv', 'utf8');
      let records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true
      });
      
      // Limit to 3000 records for testing
      const testMode = false;
      if (testMode) {
        console.log(`Full dataset has ${records.length} coaches, limiting to 3000 for testing`);
        records = records.slice(0, 3000);
      }
      
      console.log(`Found ${records.length} coaches to import`);
      
      // Build and execute insert queries in batches
      const batchSize = 100;
      let insertedCount = 0;
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const values = batch.map((record, index) => {
          return `(
            $${index * 10 + 1}, $${index * 10 + 2}, $${index * 10 + 3}, 
            $${index * 10 + 4}, $${index * 10 + 5}, $${index * 10 + 6}, 
            $${index * 10 + 7}, $${index * 10 + 8}, $${index * 10 + 9}, $${index * 10 + 10}
          )`;
        }).join(',');
        
        const params = [];
        batch.forEach(record => {
          // Parse first and last name from "Coach Name"
          let firstName = '';
          let lastName = '';
          
          if (record['Coach Name']) {
            const nameParts = record['Coach Name'].split(' ');
            if (nameParts.length >= 2) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(' ');
            } else {
              firstName = record['Coach Name'];
            }
          }
          
          params.push(
            firstName,
            lastName,
            record['Email'] || '',
            record['Phone'] || '',
            record['School'] || '',
            record['Sport'] || '',
            record['Position'] || record['Coach Role'] || '',
            record['Division'] || '',
            record['Conference'] || '',
            record['State'] || ''
          );
        });
        
        const query = `
          INSERT INTO coaches (
            "first_name", "last_name", "email", "phone", 
            "school", "sport", "position", "division", "conference", "state"
          ) 
          VALUES ${values}
        `;
        
        await client.query(query, params);
        insertedCount += batch.length;
        console.log(`Imported ${insertedCount}/${records.length} coaches`);
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log(`Successfully imported ${insertedCount} coaches`);
      
    } catch (error) {
      // Rollback in case of error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release the client
      client.release();
    }
    
  } catch (error) {
    console.error('Error importing coaches:', error);
    if (error.detail) {
      console.error('Error detail:', error.detail);
    }
    if (error.hint) {
      console.error('Error hint:', error.hint);
    }
    if (error.table) {
      console.error('Error table:', error.table);
    }
    if (error.constraint) {
      console.error('Error constraint:', error.constraint);
    }
    console.error('Error stack:', error.stack);
  } finally {
    // Close the pool
    try {
      await pool.end();
    } catch (err) {
      console.error('Error closing pool:', err);
    }
  }
}

// Run the import as an immediately-invoked async function
(async () => {
  console.log("Starting import process...");
  console.log("Database URL:", process.env.DATABASE_URL ? "Available" : "Not found");
  await importCoaches();
  console.log("Import process complete.");
})();