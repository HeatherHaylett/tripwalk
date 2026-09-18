import './env';
import Fastify from 'fastify';
import { myTripsRoutes } from './routes/myTrips';

// See architecture.md §8 for the full API surface (/myTrips, /sync,
// /publicTrips, /bookmarks) and §6 for why every route below must scope
// its queries to the authenticated user — that's the privacy enforcement
// point, not something to trust to the client.
//
// Auth is a temporary dev-only stub (server/src/plugins/authStub.ts) —
// trusts an x-user-id header with no real verification. See PRD.md §7;
// swap out that one hook once real auth is decided, nothing else changes.

const app = Fastify({ logger: true });

app.get('/health', async () => ({ status: 'ok' }));

app.register(myTripsRoutes);

// TODO: remaining route modules
// app.register(import('./routes/sync'));
// app.register(import('./routes/publicTrips'));
// app.register(import('./routes/bookmarks'));

const start = async () => {
  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
