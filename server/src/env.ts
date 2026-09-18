import { config } from 'dotenv';
import path from 'node:path';

// .env.local lives at the repo root (populated by `neon link` / `neon env pull`),
// not in server/, so load it explicitly. Must be imported before anything that
// reads process.env at module-load time (e.g. db.ts's Pool constructor).
config({ path: path.resolve(__dirname, '../../.env.local') });
