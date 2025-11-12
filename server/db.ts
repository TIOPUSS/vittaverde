import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import * as n8nSchema from "@shared/schema-n8n";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with secure SSL configuration
// Use system CAs for proper PKI validation instead of pinning certificates
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  }
});

export const db = drizzle({ client: pool, schema: { ...schema, ...n8nSchema } });
export * from "@shared/schema";
export * from "@shared/schema-n8n";