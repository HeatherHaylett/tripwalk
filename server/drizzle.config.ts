import { config } from 'dotenv';
import path from 'node:path';
import { defineConfig } from 'drizzle-kit';

// .env.local lives at the repo root (populated by `neon link` / `neon env pull`),
// not in server/, so load it explicitly.
config({ path: path.resolve(__dirname, '../.env.local') });

// Migrations need a direct (non-pooled) connection — the pooled one runs
// through PgBouncer in transaction mode, which drops session state DDL relies on.
const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) {
  throw new Error('DATABASE_URL_UNPOOLED is not set — run `neon env pull` at the repo root.');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
});
