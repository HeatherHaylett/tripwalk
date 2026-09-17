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

## Status

This is a scaffold, not a working app yet.

**Client:** Expo SDK 57 / React Native 0.86.3 / React 19.2.3. Folder structure matching `architecture.md` §3, domain entity types matching the schema in §6, a `TripRepository` interface + one example use case (`createTrip`) showing the atomic write+enqueue pattern, and the WatermelonDB schema for all five local tables (including the client-only `syncStatus` field). `App.tsx` is a placeholder with no navigation wired up yet, and the WatermelonDB Expo config plugin still needs to be added (see above) before the local DB will actually run on-device.

**Server:** minimal Fastify entry point with a health check route. Route handlers for `/myTrips`, `/sync`, `/publicTrips`, `/bookmarks` are not built yet — see `architecture.md` §8 for the intended API surface.

Not built yet: repository *implementations* (`client/src/data/repositories/`), the sync engine, any real screens, the Postgres schema/migrations, or auth.
