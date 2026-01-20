import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach } from "vitest";

let pool: Pool;
let db: NodePgDatabase;

beforeAll(async () => {
  const testDatabaseUrl = process.env.DATABASE_URL;

  if (!testDatabaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Please set it in vitest.config.ts or .env.test",
    );
  }

  pool = new Pool({
    connectionString: testDatabaseUrl,
  });

  db = drizzle(pool);

  // Run migrations
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  console.log("✓ PostgreSQL extensions enabled (vector, pg_trgm)");

  const migrationsFolder = path.join(process.cwd(), "drizzle");

  await migrate(db, { migrationsFolder });
});

beforeEach(async () => {
  // Clean up all tables in a transaction for better performance
  await db.transaction(async (tx) => {
    // Disable triggers temporarily for faster deletion
    await tx.execute(sql`SET session_replication_role = replica`);

    // Truncate all tables at once (faster than DELETE)
    await tx.execute(sql`
      TRUNCATE TABLE 
        document_chunks,
        document_resources,
        messages,
        favorite_conversations,
        conversations,
        users
      RESTART IDENTITY CASCADE
    `);

    // Re-enable triggers
    await tx.execute(sql`SET session_replication_role = DEFAULT`);
  });
});

afterAll(async () => {
  await pool.end();
});

export { db };
