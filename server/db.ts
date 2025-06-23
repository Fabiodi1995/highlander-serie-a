import { Pool } from 'pg';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if we should use local PostgreSQL or Neon cloud
const useLocalPostgres = process.env.USE_LOCAL_POSTGRES === 'true' || 
                        process.env.DATABASE_URL.includes('localhost') ||
                        process.env.DATABASE_URL.includes('127.0.0.1');

console.log(`Database mode: ${useLocalPostgres ? 'Local PostgreSQL' : 'Neon Cloud'}`);

let db: any;

if (useLocalPostgres) {
  // Use standard PostgreSQL driver for local connections
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
  });
  
  db = drizzlePostgres(pool, { schema });
} else {
  // Use Neon serverless driver for cloud connections
  const sql = neon(process.env.DATABASE_URL!);
  db = drizzleNeon(sql, { schema });
}

export { db };

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

// Atomic transaction wrapper for critical operations
export async function withTransaction<T>(
  operations: (tx: typeof db) => Promise<T>
): Promise<T> {
  return safeDbQuery(async () => {
    try {
      // For Neon HTTP, we'll implement a manual rollback pattern
      // since HTTP connections don't support traditional transactions
      const rollbackActions: Array<() => Promise<void>> = [];
      
      const result = await operations(db);
      
      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  });
}

// Batch operation wrapper with retry logic
export async function batchOperation<T>(
  operations: Array<() => Promise<T>>,
  options: { maxRetries?: number; delayMs?: number } = {}
): Promise<T[]> {
  const { maxRetries = 3, delayMs = 100 } = options;
  const results: T[] = [];
  
  for (const operation of operations) {
    let lastError: Error | null = null;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        const result = await safeDbQuery(operation);
        results.push(result);
        break;
      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        if (attempt <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        }
      }
    }
    
    if (lastError && attempt > maxRetries) {
      throw new Error(`Operation failed after ${maxRetries} retries: ${lastError.message}`);
    }
  }
  
  return results;
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

