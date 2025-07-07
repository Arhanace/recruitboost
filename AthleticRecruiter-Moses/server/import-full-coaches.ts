import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { pool, db } from './db';
import { coaches } from '@shared/schema';
import { eq } from 'drizzle-orm';

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

export async function importFullCoaches(filePath: string) {
  console.log(`Starting import from ${filePath}`);
  
  // Create a read stream for the CSV file
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  // Parse the CSV file using synchronous parser
  const records: CoachCSVRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`Found ${records.length} records to import`);
  
  // Clear existing coaches to avoid duplicates
  console.log("Clearing existing coaches...");
  try {
    await db.delete(coaches);
    console.log("Existing coaches cleared successfully");
  } catch (error) {
    console.error("Error clearing existing coaches:", error);
    throw error;
  }
  
  // Process records in chunks to avoid memory issues
  const CHUNK_SIZE = 1000;
  const chunks = [];
  
  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    chunks.push(records.slice(i, i + CHUNK_SIZE));
  }
  
  console.log(`Processing ${chunks.length} chunks of size ${CHUNK_SIZE}`);
  
  let totalImported = 0;
  let currentChunk = 1;
  
  // Process each chunk
  for (const chunk of chunks) {
    console.log(`Processing chunk ${currentChunk} of ${chunks.length}`);
    const coachRecords = chunk.map(row => {
      // Split coach name into first and last name
      let firstName = '';
      let lastName = '';
      
      if (row['Coach Name'] && row['Coach Name'].trim() !== '') {
        const nameParts = row['Coach Name'].split(' ');
        if (nameParts.length >= 2) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        } else {
          lastName = row['Coach Name'];
        }
      }
      
      return {
        firstName,
        lastName,
        email: row.Email || '',
        phone: row.Phone || '',
        school: row.School || '',
        sport: row.Sport || '',
        position: row['Coach Role'] || '',
        division: row.Division || '',
        conference: row.Conference || '',
        state: row.State || '',
        region: row.Region || ''
      };
    });
    
    try {
      // Insert the coaches
      const insertedCount = await db.insert(coaches).values(coachRecords);
      totalImported += coachRecords.length;
      console.log(`Imported ${coachRecords.length} coaches in chunk ${currentChunk}`);
    } catch (error) {
      console.error(`Error importing chunk ${currentChunk}:`, error);
      // Continue with next chunk even if this one fails
    }
    
    currentChunk++;
  }
  
  console.log(`Import completed. Total coaches imported: ${totalImported}`);
  
  // Close the database connection
  await pool.end();
}

// In ESM, we don't need to check if this is the main module