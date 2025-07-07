import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { coaches } from '@shared/schema';

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
}

export async function updateCoachConferences(filePath: string) {
  const csvData: CoachCSVRow[] = [];
  
  console.log(`Reading CSV file from ${filePath}`);
  
  // Create a readable stream for the CSV file
  const parser = fs
    .createReadStream(filePath)
    .pipe(
      parse({
        columns: true,
        trim: true,
        skip_empty_lines: true,
      })
    );

  for await (const record of parser) {
    csvData.push(record as CoachCSVRow);
  }
  
  console.log(`Read ${csvData.length} records from CSV`);

  // Build a map of email to conference for quick lookup
  const emailToConference = new Map<string, string>();
  csvData.forEach(row => {
    if (row.Email && row.Conference) {
      emailToConference.set(row.Email, row.Conference);
    }
  });
  
  console.log(`Built map with ${emailToConference.size} email-to-conference entries`);
  
  // Get all coaches from the database
  const allCoaches = await db.select().from(coaches);
  console.log(`Retrieved ${allCoaches.length} coaches from database`);
  
  let updatedCount = 0;
  
  // Update coaches with conference data
  for (const coach of allCoaches) {
    const conference = emailToConference.get(coach.email);
    if (conference && (!coach.conference || coach.conference !== conference)) {
      try {
        await db.update(coaches)
          .set({ conference })
          .where(eq(coaches.id, coach.id));
        
        updatedCount++;
        
        // Log progress periodically
        if (updatedCount % 100 === 0) {
          console.log(`Progress: ${updatedCount} coaches updated with conference data`);
        }
      } catch (error) {
        console.error(`Error updating coach ${coach.id} (${coach.email}):`, error);
      }
    }
  }
  
  console.log(`Completed updating ${updatedCount} coaches with conference data`);
  return updatedCount;
}

// Execute the function if this file is run directly
// We're using ESM, so require.main is not available
// This code will run when the file is imported, but that's fine for our purpose
// as we're only calling it via the API endpoint