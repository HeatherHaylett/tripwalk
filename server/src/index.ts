import Fastify from 'fastify';

// See architecture.md §8 for the full API surface (/myTrips, /sync,
// /publicTrips, /bookmarks) and §6 for why every route below must scope
// its queries to the authenticated user — that's the privacy enforcement
// point, not something to trust to the client.

const app = Fastify({ logger: true });

app.get('/health', async () => ({ status: 'ok' }));

// TODO: register route modules once auth is decided (see PRD.md §7)
// app.register(import('./routes/sync'));
// app.register(import('./routes/myTrips'));
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
