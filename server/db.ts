import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.warn(
    "⚠️  DATABASE_URL not set. Database features will be disabled. Core SEO analysis will work with sample data."
  );
  console.warn("To enable full features, set DATABASE_URL in your .env file");
  
  // Create a mock pool and db that will throw helpful errors
  export const pool = {
    query: () => {
      throw new Error("Database not configured. Set DATABASE_URL environment variable.");
    }
  } as any;
  
  export const db = {
    select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: () => ({ offset: () => Promise.resolve([]) }) }) }) }) }),
    insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) }),
    delete: () => ({ where: () => Promise.resolve([]) }),
    $with: () => ({ qb: { select: () => ({ from: () => Promise.resolve([]) }) } })
  } as any;
} else {
  export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  export const db = drizzle({ client: pool, schema });
}
