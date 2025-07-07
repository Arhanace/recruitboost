import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { db, pool } from './db';
import { coaches } from '@shared/schema';
import { sql } from 'drizzle-orm';

// Define the interfaces for our data
interface CoachCSVRow {
  Sport: string;
  School: string;
  Conference: string;
  Division: string;
  State: string;
  'Coach Name': string;
  'Coach Role': string;
  Email: string;
  Phone: string;
  Region: string;
}

interface CoachRecord {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  school: string;
  sport: string;
  position: string;
  division: string;
  conference: string;
  state: string;
  region: string;
}

export async function importFinalCoaches(
  filePath: string, 
  limit?: number, 
  startIndex: number = 0, 
  clearExisting: boolean = true
): Promise<{ totalImported: number }> {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // First, delete all existing coaches and reset sequence if clearExisting is true
    if (clearExisting) {
      console.log("Clearing existing coaches data...");
      await client.query('DELETE FROM coaches');
      await client.query('ALTER SEQUENCE coaches_id_seq RESTART WITH 1');
    } else {
      console.log("Appending to existing coaches data...");
    }
    
    // Read and parse the CSV file
    console.log(`Reading CSV file from ${filePath}...`);
    const csvContent = fs.readFileSync(filePath, 'utf8');
    let records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    }) as CoachCSVRow[];
    
    // Apply both startIndex and limit if specified
    if (startIndex > 0 && startIndex < records.length) {
      records = records.slice(startIndex);
    }
    
    if (limit && limit > 0 && limit < records.length) {
      console.log(`Limiting import to ${limit} coaches (out of ${records.length} total) starting from index ${startIndex}`);
      records = records.slice(0, limit);
    }
    
    // Build and execute insert queries in batches
    const batchSize = 1000; // Increased batch size for faster imports
    let totalImported = 0;
    
    console.log(`Importing ${records.length} coaches in batches of ${batchSize}...`);
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const coachRecords = batch.map(record => {
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
        
        // Create the coach record
        return {
          firstName,
          lastName,
          email: record.Email || '',
          phone: record.Phone || '',
          school: record.School || '',
          sport: record.Sport || '',
          position: record['Coach Role'] || '',
          division: record.Division || '',
          conference: record.Conference || '',
          state: record.State || '',
          region: record.Region || ''
        };
      });
      
      // Build the parameterized query string directly
      const placeholders = batch.map((_, i) => 
        `($${i * 11 + 1}, $${i * 11 + 2}, $${i * 11 + 3}, $${i * 11 + 4}, $${i * 11 + 5}, $${i * 11 + 6}, $${i * 11 + 7}, $${i * 11 + 8}, $${i * 11 + 9}, $${i * 11 + 10}, $${i * 11 + 11})`
      ).join(',');
      
      const queryText = `
        INSERT INTO coaches 
        ("first_name", "last_name", "email", "phone", "school", "sport", "position", "division", "conference", "state", "region")
        VALUES ${placeholders}
      `;
      
      // Flatten all values into a single array - with city and notes columns removed
      // Order: first_name, last_name, email, phone, school, sport, position, division, conference, state, region
      const values = coachRecords.flatMap(record => [
        record.firstName,
        record.lastName,
        record.email,
        record.phone,
        record.school,
        record.sport,
        record.position,
        record.division,
        record.conference,
        record.state,
        record.region
      ]);
      
      await client.query(queryText, values);
      totalImported += batch.length;
      console.log(`Imported ${totalImported}/${records.length} coaches`);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log(`Successfully imported ${totalImported} coaches`);
    
    return { totalImported };
  } catch (error: any) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error importing coaches:', error);
    if (error.detail) console.error('Error detail:', error.detail);
    if (error.hint) console.error('Error hint:', error.hint);
    if (error.table) console.error('Error table:', error.table);
    if (error.constraint) console.error('Error constraint:', error.constraint);
    throw error;
  } finally {
    // Release the client
    client.release();
  }
}

// If this file is executed directly (in ESM modules, we check differently)
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const filePath = process.argv[2] || 'attached_assets/final_corrected_schools.csv';
      const limit = process.argv[3] ? parseInt(process.argv[3], 10) : undefined;
      
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
  })();
}