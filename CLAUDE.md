# CLAUDE.md — Tripwalk

Guidance for Claude Code when working in this repository. Read `architecture.md` and `PRD.md` before making non-trivial changes — this file tells you *how* to work here; those tell you *what* the system is and *why*.

## Project

Trip Itinerary app — a React Native app for building and browsing trip itineraries as a hobby ("Pinterest for trip planning"). Solo-owned trips are offline-first; a lightweight social layer lets users publish trips and bookmark others'.

- **Full requirements, user stories, goals, non-goals:** `PRD.md`
- **Full system design — client architecture, data model reasoning, sync strategy, API surface, rejected approaches:** `architecture.md`

Read `architecture.md` §10 ("Explicitly rejected approaches") before reintroducing anything that looks like: server-side reconciliation, per-item sync calls, generic idempotency keys, local/server ID pairs, or file-based attachment storage. Each was considered and deliberately dropped — don't re-add without re-reading why.

## Stack

- **Expo SDK 57** (React Native 0.86.3, React 19.2.3) — chosen over bare React Native CLI: Expo is the recommended default for new React Native projects as of 2026, and now supports full native-module apps via a custom dev client (`expo run:ios`/`expo run:android`), not just the old sandboxed Expo Go. New Architecture is on by default (SDK 57 removed the `newArchEnabled` toggle entirely — there's no other architecture to opt out to).
- **WatermelonDB requires the custom dev client, not plain Expo Go** — it's a native module. Needs an Expo config plugin (check the WatermelonDB Expo plugin repo for an SDK 57-compatible release before wiring this up) plus `expo-build-properties`. Don't assume Expo Go will just work for any screen that touches the local DB.
- WatermelonDB (SQLite) — local source of truth for own trips, itinerary items, outbox/sync status, bookmarks, browse fallback cache
- Zustand — UI/session state only (active tab, form drafts, auth token, network status). Never trip/itinerary data.
- Fastify + TypeScript — REST API server, self-hosted (chosen over Express for TS-first ergonomics and built-in schema validation; chosen over Supabase to keep full control of the custom `/sync` batch endpoint and scoping logic)
- Postgres — server database (chosen over MySQL: better free-tier hosting options for a hobby project as of 2026 — e.g. Neon — plus built-in full-text search if `discovery` ends up needing it, and Row Level Security as a second layer of defense on top of app-level user-scoping)
- Testing: `jest-expo` preset (Expo's recommended Jest setup, matched to the SDK) for the client; Vitest for the Fastify server, run against a dedicated Neon `test` branch (not a mock, not local Postgres) — see `README.md`'s Testing section for why and for one-time setup

**On dependency versions generally:** for Expo-ecosystem packages, prefer `npx expo install <package>` over manually adding a version to `package.json` — it resolves against Expo's SDK compatibility matrix and avoids the kind of peer-dependency mismatch this project has already hit once (a hand-pinned `@testing-library/react-native` version pulling in a `react-test-renderer` peer that didn't match the pinned React version). Hand-pin only for non-Expo packages Expo doesn't manage.

## Non-negotiable invariants

These come directly from `architecture.md` and should not be violated by any change, no matter how small it seems:

1. **Every write goes through one path.** Writing to WatermelonDB and enqueueing the outbox entry must happen in a single atomic transaction — never two separate steps a caller could forget to pair. If you add a new mutation (new use case, new field), it must go through the existing `saveTrip()`-style function, not a bespoke write.
2. **IDs are client-generated UUIDs, created at write time.** Never introduce a local-ID/server-ID pair or an ID-swap step after sync.
3. **All server queries scoped to the authenticated user.** This is the privacy enforcement point — never rely on client-side filtering to hide private trips.
4. **`publicTrips` stays a separate table from `trips`**, kept in sync only via the explicit publish action — not a live sync on every edit. See the bookmark-staleness trade-off in `architecture.md` §6 before changing this.
5. **Attachments are URL strings only.** No file/blob storage. Don't add filesystem or image-handling code for attachments without confirming this has changed.
6. **Cursor pagination on `/publicTrips` uses `(updatedAt, tripId)`, not timestamp alone.** `updatedAt` (not `publishedAt`) is what the feed sorts on, so republished trips bubble back up. Requires the composite index — don't drop either half.
7. **`syncStatus` on client `trips`/`itineraryItems` is a persisted WatermelonDB field, not Zustand state.** It has no server equivalent — don't add it to any API payload.

## Repo layout (monorepo)

```
tripwalk/
├── package.json     # workspace root (npm workspaces: client, server)
├── PRD.md, architecture.md, CLAUDE.md   # shared docs, cover both packages
├── client/
│   ├── package.json  # @tripwalk/client
│   ├── app.json       # Expo config
│   ├── babel.config.js  # decorators plugin, required by WatermelonDB models
│   ├── tsconfig.json
│   ├── index.js       # Expo entry point
│   └── src/
│       ├── presentation/
│       │   ├── App.tsx   # root component (placeholder - no navigation wired yet)
│       │   ├── screens/<Screen>/<Screen>.tsx + use<Screen>ViewModel.ts
│       │   └── components/
│       ├── domain/
│       │   ├── usecases/    # storage-agnostic
│       │   └── entities/    # plain TS types, no DB/network dependency
│       ├── data/
│       │   ├── repositories/  # ONLY layer that knows WatermelonDB/fetch exist
│       │   ├── local/
│       │   │   ├── database.ts
│       │   │   └── models/
│       │   ├── remote/
│       │   └── sync/
│       │       ├── outboxQueue.ts
│       │       └── syncEngine.ts
│       └── core/
│           ├── di/container.ts
│           ├── network/NetworkMonitor.ts
│           └── session/sessionStore.ts  # temporary dev-only "current user" stub, mirrors authStub.ts
└── server/
    ├── package.json  # @tripwalk/server
    ├── tsconfig.json
    └── src/
        ├── index.ts   # Fastify entry point
        ├── env.ts     # loads ../.env.local — must be the first import in index.ts
        ├── db/        # db.ts (Drizzle client), schema.ts
        ├── plugins/   # Fastify hooks/decorators that aren't routes, e.g. authStub.ts
        ├── types/     # ambient .d.ts module augmentation (e.g. FastifyRequest.userId)
        └── routes/    # /myTrips, /sync, /publicTrips, /bookmarks
```

New files should land in the matching folder above — don't invent a parallel structure for a feature that fits an existing layer. Run `npm install` once at the repo root (workspaces share a single `node_modules`); use `npm run client` / `npm run server` from the root to start either package.

## Conventions

- Client layers: `presentation/` → `domain/` → `data/`, dependencies point inward only. `domain/usecases/` never imports from `data/` directly — only from repository interfaces. Only `data/repositories/*` talks to WatermelonDB or the network.
- Reactive queries, not one-time fetches, for anything shown from WatermelonDB — this is what makes sync-status badges and background sync updates appear without manual refresh.
- No inline objects/functions passed to `renderItem` in `FlatList`/`FlashList` — use `useMemo`/`useCallback` to keep list rows from re-rendering unnecessarily.

## When adding a feature

1. Check `PRD.md` — is this in scope, a non-goal, or a "future idea"? If it's a listed non-goal, confirm with the user before building it.
2. Check `architecture.md` §10 — has this exact approach already been tried and rejected?
3. If it touches the write path, sync, or attachments, re-read the relevant section of `architecture.md` in full before changing code, not just this summary.

## Open questions (see `PRD.md` §7)

Auth method, discovery/search UX, and the trip-detail UI (time-slotted + unsorted items) are still undecided. Don't assume a specific implementation for these — ask or flag it rather than guessing.

**Interim auth stub:** `server/src/plugins/authStub.ts` is a temporary, dev-only placeholder — it trusts an unverified `x-user-id` header and fails closed (401) if it's missing, purely so route development (invariant #3's user-scoping) isn't blocked while auth is undecided. It is not real authentication. Every protected route currently depends on it for `request.userId`. Replace only that one hook when auth is decided — route handlers themselves shouldn't need to change.

**Client-side counterpart:** `client/src/core/session/sessionStore.ts` mirrors the same idea — a hardcoded placeholder `userId` (Zustand store) standing in for "the current user" since there's no login flow yet. `ownerId` is deliberately kept out of `NewTripInput` and passed as an explicit parameter through `createTrip` and `TripRepository.create` instead — identity should never live inside the same object as arbitrary user-typed form data, same principle the server applies to `ownerId` in `POST /myTrips`.
