# Tripwalk

Monorepo: `client/` (Expo / React Native app) and `server/` (Fastify API), tied together with npm workspaces.

Read these before writing code here, in this order:

1. `CLAUDE.md` — working rules, invariants, and folder conventions
2. `PRD.md` — what this app does and why
3. `architecture.md` — full technical design: sync strategy, data model, API surface, and a list of approaches already considered and rejected

## Getting started

```
npm install          # installs both workspaces from the repo root
npm run server        # starts the Fastify dev server
```

For the client, WatermelonDB is a native module, so plain `expo start` / Expo Go
will NOT work once the local database is wired up — you need a custom dev client:

```
cd client
npx expo install expo-build-properties   # let Expo resolve the right version
# then find and install an SDK 57-compatible WatermelonDB Expo config plugin
# (check https://github.com/morrowdigital/watermelondb-expo-plugin or similar
# for a release that supports SDK 57 before relying on it)
npx expo run:ios      # or: npx expo run:android
```

Prefer `npx expo install <package>` over hand-adding a version to `package.json`
for any Expo-ecosystem package — it resolves against the SDK's compatibility
matrix and avoids peer-dependency mismatches.

## Testing

The client uses `jest-expo`. The server uses Vitest (`npm run test --workspace=server`).

Server route tests exercise real Fastify route handlers (via `app.inject()`, no real
port bound) against a real Postgres database — not a mocked `db` client — because
several required behaviors (user-scoping via `WHERE ownerId = ...`, the FK constraint
between `trips.ownerId` and `users.userId`) are database-level guarantees a mock
can't verify. That database is a **dedicated Neon branch named `test`**, branched off
`production`, chosen over local Postgres-via-Docker because it needs no local
dependency beyond the already-installed Neon CLI, and over a fresh branch-per-run
because a hobby project's test volume doesn't justify that ceremony yet.

The `test` branch does **not** stay in sync with `production` and does **not**
reset itself — it's a one-time snapshot at creation time, and every test run's
inserted rows persist until something deletes them (which is why
`server/src/routes/myTrips.test.ts` clears `trips`/`users` in a `beforeEach`).

One-time setup for a new contributor (this only needs to happen once per person,
not per test run):

```
neon branches create --name test --parent production   # only if the branch doesn't already exist
neon connection-string test
```

Then add the printed connection string to `.env.local` (repo root, gitignored) as:

```
TEST_DATABASE_URL="<connection string>"
```

`server/vitest.setup.ts` swaps `TEST_DATABASE_URL` into `process.env.DATABASE_URL`
before any test file loads `server/src/db/db.ts`, so the app's one shared `db`
client transparently points at the `test` branch during a test run — `db.ts`
itself has no idea tests exist.

## Status

This is a scaffold, not a working app yet.

**Client:** Expo SDK 57 / React Native 0.86.3 / React 19.2.3. Folder structure matching `architecture.md` §3, domain entity types matching the schema in §6, a `TripRepository` interface + one example use case (`createTrip`) showing the atomic write+enqueue pattern, and the WatermelonDB schema for all five local tables (including the client-only `syncStatus` field). `App.tsx` is a placeholder with no navigation wired up yet, and the WatermelonDB Expo config plugin still needs to be added (see above) before the local DB will actually run on-device.

**Server:** Fastify entry point with a health check route, Postgres schema/migrations (Drizzle), and `/myTrips` (`GET`/`POST`) with Vitest coverage for user-scoping, auth, and validation. `/sync`, `/publicTrips`, `/bookmarks` are not built yet — see `architecture.md` §8 for the intended API surface. Auth is still the dev-only `authStub` header stub (see `CLAUDE.md`'s "Open questions").

Not built yet: repository *implementations* (`client/src/data/repositories/`), the sync engine, any real screens, `/sync`/`/publicTrips`/`/bookmarks`, or real auth.
