import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as { pool?: Pool }

const connectionString =
  process.env.DATABASE_URL ??
  process.env.NEON_DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NO_SSL

/** Create Pool only when a connection string exists; otherwise use a dummy pool. */
function createPool(): Pool {
  if (!connectionString) {
    // Return a pool that gracefully fails — queries will return empty results.
    return globalForDb.pool ?? (new Pool() as any)
  }
  return globalForDb.pool ?? new Pool({ connectionString })
}

export const pool = createPool()

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool

export const db = drizzle(pool, { schema })
