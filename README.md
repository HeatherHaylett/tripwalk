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
will NOT work — you need a custom dev client. The WatermelonDB Expo config plugin
(`@lovesworking/watermelondb-expo-plugin-sdk-52-plus`) and `expo-build-properties`
are already configured in `client/app.json`:

Create `client/.env` first (it's gitignored) by copying `client/.env.example`, and set
`EXPO_PUBLIC_DEV_USER_ID` to the ID of a user that exists on the server you're pointing
at. This is the temporary stand-in for "the current user" until real auth exists, and
there is no fallback value.

```
cd client
cp .env.example .env   # then edit EXPO_PUBLIC_DEV_USER_ID
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

## Tracking progress

Work is tracked in GitHub Issues, grouped into milestones.

Each milestone's description records its dependencies. The intent is to get add, edit and
delete trips working fully locally first, then connect them to the backend (outbox + sync),
then build the other features on top of that write path. See
`gh issue list --state all` or the repo's Milestones page.

## Status

Not a finished app yet. Everything built so far is local-only (offline-first); nothing syncs to the server.

**Client:** Expo SDK 57 / React Native 0.86.3 / React 19.2.3. WatermelonDB schema and models for all five local tables, a DI container, and an injectable in-memory adapter for tests. `TripRepositoryImpl` implements `create`, `update`, `delete` and `getById` with tests, using client-generated UUIDs as the WatermelonDB `id`. The `createTrip` use case and a `NewTrip` screen with its view model exist. `App.tsx` is still a placeholder with no navigation wired up, so no screen is reachable yet. The outbox write is not implemented: the repository methods carry `TODO`s marking where the outbox entry will join the same transaction (`CLAUDE.md` invariant #1).

**Server:** Fastify entry point with a health check route, Postgres schema/migrations (Drizzle), and `/myTrips` (`GET`/`POST`) with Vitest coverage for user-scoping, auth, and validation. `/sync`, `/publicTrips`, `/bookmarks` are not built yet — see `architecture.md` §8 for the intended API surface. Auth is still the dev-only `authStub` header stub (see `CLAUDE.md`'s "Open questions").

**Not built yet:** the outbox and sync engine, the trip list/edit/delete screens, navigation, `/sync`/`/publicTrips`/`/bookmarks`, or real auth.
