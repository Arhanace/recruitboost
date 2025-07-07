import { db } from './db';
import { coaches } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

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

export async function updateAllConferences(filePath: string) {
  console.log('Starting to update all conferences...');
  
  // Read and parse the CSV file
  const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true
  }) as CoachCSVRow[];

  // Get unique conferences and schools
  const schoolToConference = new Map<string, string>();
  records.forEach(row => {
    if (row.Conference && row.Conference.trim() !== '') {
      schoolToConference.set(row.School, row.Conference);
    }
  });

  console.log(`Found ${schoolToConference.size} schools with conference data`);

  // Update conferences in batches
  let count = 0;
  for (const [school, conference] of schoolToConference.entries()) {
    try {
      const result = await db.update(coaches)
        .set({ conference })
        .where(eq(coaches.school, school));
      
      count++;
      if (count % 100 === 0) {
        console.log(`Updated ${count} schools...`);
      }
    } catch (err) {
      console.error(`Error updating conference for ${school}:`, err);
    }
  }

  console.log(`Successfully updated conferences for ${count} schools`);
}

// Self-execute the function
const filePath = path.join(process.cwd(), 'attached_assets', 'recruitref_dashboard_full_multithreaded.csv');
updateAllConferences(filePath)
  .then(() => console.log('All conferences updated successfully'))
  .catch(err => console.error('Error updating conferences:', err))
  .finally(() => process.exit());