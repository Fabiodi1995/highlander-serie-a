import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Simple HTTP connection with minimal configuration
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Simple query queue to prevent connection overload
let queryQueue: Array<() => Promise<any>> = [];
let isProcessing = false;

export async function safeDbQuery<T>(queryFn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    queryQueue.push(async () => {
      try {
        const result = await queryFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    processQueue();
  });
}

async function processQueue() {
  if (isProcessing || queryQueue.length === 0) return;
  
  isProcessing = true;
  
  while (queryQueue.length > 0) {
    const query = queryQueue.shift();
    if (query) {
      try {
        await query();
        // Small delay between queries to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Database query error:', error);
      }
    }
  }
  
  isProcessing = false;
}

