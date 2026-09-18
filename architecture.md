# Tripwalk — Architecture

React Native app for building personal trip itineraries. Solo-owned trips are fully offline-first (local-first, single device, no multi-device sync). A social layer lets users publish trips publicly and bookmark others' published trips.

## 1. Scope

### In scope
- Own trips: create/edit/delete trips (name, destination — **no date range**, trips are hypothetical/flexible plans)
- Itinerary items within a trip: title, type (flight/hotel/activity/etc.), location/neighborhood, optional attachment (**URL only, not a file**), optional time-of-day slot (**Morning / Afternoon / Evening** — not exact times)
- Full offline read/write for own trips, with sync to backend when connectivity returns
- Publish a trip to make it publicly browsable
- Browse other users' published trips (requires connectivity)
- Bookmark a published trip — a live-ish reference (see §6 caveat), not a copy; available offline once bookmarked
- Share-to-app: external URLs (e.g. shared from Google Maps) can populate an itinerary item's attachment
- Accounts (auth required — needed for ownership, privacy, and publishing)

### Explicitly out of scope
- Multi-device sync for the same user (single device only)
- Reinstall/backup restore of local data
- Real-time multi-user collaboration on a trip
- Attachment file storage (attachments are links, not uploaded files/images)

## 2. Non-functional priorities (in order)

1. **Data durability** — an offline-created/edited trip must never be lost, even across crashes or failed syncs
2. **Performance** — instant (no-spinner) reads for own trips; smooth scrolling in the browse feed
3. **Scale-readiness** — small today (hundreds of users), but schema/query patterns should not require a rewrite at 10k–100k+ users
4. **Privacy** — private-by-default trips must never leak; enforced server-side, never trusted to client-side filtering alone

## 3. Client architecture (React Native)

Three-layer MVVM + repository pattern. Dependencies point inward only (presentation → domain → data), never the reverse.

```
src/
├── presentation/
│   ├── screens/<Screen>/<Screen>.tsx + use<Screen>ViewModel.ts   # hooks, not classes
│   └── components/
├── domain/
│   ├── usecases/        # e.g. createItineraryItem, reorderDayItems — storage-agnostic
│   └── entities/         # plain TS types, no DB/network dependency
├── data/
│   ├── repositories/     # ONLY layer that knows WatermelonDB/fetch exist
│   ├── local/
│   │   ├── database.ts   # WatermelonDB schema/setup
│   │   └── models/
│   ├── remote/           # REST API client
│   └── sync/
│       ├── outboxQueue.ts
│       └── syncEngine.ts
└── core/
    ├── di/container.ts   # wires repo implementations into use cases
    └── network/NetworkMonitor.ts   # NetInfo wrapper
```

**Rule of thumb:** presentation never imports from `data/`. Domain use cases depend only on repository *interfaces*. Only `data/repositories/*` talks to WatermelonDB or the network client directly. This makes storage swappable and use cases unit-testable without a DB.

## 4. Local storage

- **WatermelonDB (SQLite)** is the local source of truth for: own trips, itinerary items, outbox/sync status, bookmarks, and the browse-feed fallback cache. Everything the app displays comes from a **reactive query** — no separate global store duplicates this data.
- **Attachments are plain `url` strings** on the itinerary item row. No filesystem storage, no blobs, no cleanup logic needed for files (this was reconsidered mid-design — originally planned filesystem storage for image/PDF attachments, dropped once attachments became link-only).
- **Zustand** holds only ephemeral UI/session state that isn't "data": active tab, in-progress form drafts, auth token, network status (from `NetInfo`). Never trip/itinerary data.

## 5. Offline write path (durability-critical — read this before touching write code)

**Every write, online or offline, follows the exact same path — there is no separate "online path."**

1. Write to WatermelonDB
2. Enqueue an outbox entry
3. Trigger a sync attempt (resolves instantly if online; sits queued if not)

Steps 1 and 2 **must be a single atomic WatermelonDB batched transaction** (e.g. one `saveTrip()` function that does both). This is deliberate: it should be structurally impossible for a future change to write to the DB without also enqueueing the change, and a crash mid-transaction rolls back cleanly rather than leaving a half-written state.

- **Field-level writes autosave** (no explicit "Save" button) — each field commits on change/blur, not in one big batch. This bounds the worst-case data loss from a crash to "a few seconds of the current field," not "the whole trip." This is why we deliberately **did not** build a server-side reconciliation/diff system — the actual risk window is small enough that it wasn't worth the complexity. Don't reintroduce this without re-justifying it against this note.

### Outbox queue
- **Referential**, not full-payload duplication: entity type + ID + change type (create/update/delete).
- **Collapses to latest state per entity** — 3 offline edits to the same trip produce 1 queue entry, not 3. This works safely *because* the app is single-device (no concurrent-edit conflict resolution needed — last local state always wins on push).
- **Sync triggers:** connectivity restored (`NetInfo` listener), app foreground, periodic background task (`BGTaskScheduler` iOS / `WorkManager` Android).
- **UI feedback:** banner sequence `Reconnected → Syncing N trips… → Synced`. On failure: retry automatically up to **3 attempts**, then stop auto-retrying — surface a per-trip "not synced" badge with a manual retry action (not just a global banner).

### Idempotent creates
- IDs are **client-generated UUIDs**, generated at creation time (offline or online) — this *is* the permanent ID everywhere (local DB, outbox, server). There is no separate local-ID/server-ID pair and no ID-swap step after sync.
- This makes retried creates naturally idempotent: server sees the same UUID twice → no-op / returns existing record → never a duplicate, even if a sync response is lost and the client retries.
- **Do not build a generic expiring idempotency-key system** — it was considered and rejected in favor of this, since a temporary key store adds an expiry-window failure mode that client-generated permanent UUIDs don't have.

## 6. Server architecture

- **API layer** — REST. All queries scoped to the authenticated user; this is the actual enforcement point for the privacy NFR — never rely on the client to only request its own data. **Current implementation note:** since auth method is still undecided (PRD §7), `server/src/plugins/authStub.ts` is a temporary dev-only stand-in — it trusts an unverified `x-user-id` header to populate `request.userId` and 401s if it's missing. It exists only so route handlers can be built against a real `request.userId` today; swapping in real auth later should only mean replacing that one hook.
- **`publicTrips`** — a **separate, denormalized table**, not a filtered view of `trips`. Chosen over a single-table-with-`isPublic`-flag design specifically for scale: browse traffic (high-read, paginated, recency-ordered, hit by every user) and owner CRUD (low-volume, point-lookup-by-ID) are different enough access patterns that separating them keeps both fast as the dataset grows.
- **`bookmarks`** — lightweight pointer table: `userId` + `publicTripId` + `bookmarkedAt`. No trip content duplicated here — the client already caches the full trip locally (see §7).

### Server schema

```
users
  userId    UUID (client-generated, primary key)
  username  string
  -- email/auth fields intentionally omitted — auth method is still an
  -- open decision (see PRD.md §7); add precisely once chosen, don't guess.

trips
  tripId          UUID (client-generated, primary key — see idempotent creates, §5)
  ownerId         UUID (references users)
  tripName        string
  destination     string
  isPublic        boolean
  clientCreatedAt timestamp   -- when the user created it, possibly offline
  serverCreatedAt timestamp   -- when it actually landed on the server

publicTrips
  tripId       UUID (same ID as the trips row it was copied from)
  ownerId      UUID (references users)
  tripName     string
  destination  string
  publishedAt  timestamp   -- set once, on first publish only
  updatedAt    timestamp   -- updates on every republish; the /publicTrips
                            -- cursor sorts on THIS field, not publishedAt
  -- REQUIRES a composite index on (updatedAt, tripId) — see §8, without
  -- it this degrades from index-seek to table-scan as the table grows.

itineraryItems
  itemId      UUID (client-generated, primary key)
  tripId      UUID (references trips)
  title       string
  type        enum: flight | hotel | activity | restaurant | transport | other
  location    string
  attachment  string (URL, nullable)   -- link only, never a file/blob
  timeOfDay   enum: morning | afternoon | evening | null
                            -- null = unsorted collection (Pinterest-card
                            -- default); user can optionally drag into a slot

bookmarks
  bookmarkId    UUID (client-generated, primary key)
  userId        UUID (references users)
  publicTripId  UUID (references publicTrips)
  bookmarkedAt  timestamp   -- sort key for the "My Bookmarks" list
```

### Client schema (WatermelonDB) — differences from server

- `trips` and `itineraryItems` exist as their own separate reactive tables on-device, mirroring the server shape — never nested as JSON blobs inside a parent row. This is required for reactive per-trip queries (`itineraryItems WHERE tripId = ...`) and for the outbox to reference items individually.
- `trips` and `itineraryItems` each get one **client-only field with no server equivalent**:
  ```
  syncStatus   enum: pending | synced | failed
  ```
  This powers the per-trip "not synced" badge (§5). It must be a persisted DB field, not Zustand state — Zustand is session-only and resets on app restart, and the badge needs to (a) survive restart and (b) update reactively per-row alongside the rest of the trip data, without the UI needing to merge two separate reactive sources to render one row.
- `publicTrips` (browse LRU fallback cache) and `bookmarks` (eager full cache) also exist locally, per the caching strategy in §7 — same shape as server, populated by the client rather than user-entered.
- **Publish is a manual, explicit copy action** (`trips` row → `publicTrips` row), not a live sync on every edit.
  - **⚠️ Known trade-off, intentional:** because of this, a bookmarked trip reflects the owner's **last published state**, not their latest edit. If the owner edits without re-publishing, bookmarkers see stale data indefinitely. This was a conscious cost/benefit call (cheap, single-table writes on the hot path of editing one's own trip, vs. double-writing on every edit to keep a rarely-read public copy live). If product wants true liveness later, this is the tradeoff to revisit — consider surfacing a "last updated" timestamp on bookmarked trips in the meantime so the staleness isn't silently invisible to users.

## 7. Caching strategy by data type

| Data | Strategy |
|---|---|
| Own trips | Local DB is the source of truth. Offline-first, outbox-synced. No "fetch" — always read local. |
| Browse feed | **Network-first**, fallback to a small WatermelonDB-cached table of the **last 10–20 viewed trips**, LRU-evicted. Fallback is silent (no "stale" indicator) unless the device is **explicitly offline** (checked via `NetInfo`, not inferred from a failed request — a single failed request while technically online should not show an offline banner). |
| Bookmarks | **Eagerly fully cached the moment the user bookmarks** (fetch full trip immediately, store locally) — guarantees offline availability from that point on. Subsequent views are network-first with that cache as fallback. |

## 8. API surface

```
GET/POST   /myTrips              # owner CRUD, scoped to authenticated user
PATCH/DELETE /myTrips/:id
POST       /myTrips/:id/publish  # copies/updates trips row -> publicTrips row

POST       /sync
  # Batch outbox push. NOT per-item CRUD calls — chosen deliberately so that
  # "one sync attempt" is one retry unit, matching the 3-retry durability rule.
  # Request:  { operations: [{ type, entity, id, data }, ...] }   # id = client-generated UUID
  # Response: { results: [{ id, status: "ok"|"error", reason? }, ...] }

GET        /publicTrips?cursor=&limit=
  # Cursor-based pagination (not offset) — required because this is a
  # live-growing feed; offset pagination would skip/duplicate items as
  # new trips are published mid-scroll.
  # Cursor MUST be a composite (updatedAt, tripId), not timestamp alone —
  # two trips can publish/republish in the same millisecond; tripId is
  # the tiebreaker to keep ordering deterministic (no skip/dupe across
  # pages). Sorts on updatedAt, not publishedAt, so a republished trip
  # bubbles back up in the feed (see §6 data model for why).
  # Requires a composite index on (updatedAt, tripId) on publicTrips —
  # without it this query degrades from index-seek to table-scan as the
  # table grows past a few thousand rows.

GET/POST/DELETE /bookmarks
  # POST body: { publicTripId }  -> triggers eager full cache client-side
```

## 9. Performance notes

- Browse feed list must be virtualized (`FlatList`/`FlashList`) with **no inline objects/functions passed to `renderItem`** and `useMemo`/`useCallback` for row-level values — prevents full-list re-renders on unrelated state changes. (No image lazy-loading needed — attachments are link-only, not images.)
- Own-trips screens read via **WatermelonDB reactive queries**, not one-time fetches. This is required, not optional — it's what makes sync-status badges and background sync updates appear without the user leaving and returning to a screen or pulling to refresh.

## 10. Explicitly rejected approaches (don't re-litigate without re-reading why)

- ❌ Server-side reconciliation/diffing against local DB — durability risk window is already small (autosave + atomic write-enqueue transaction); adds complexity for a near-nonexistent gap.
- ❌ Per-item CRUD calls for sync instead of batch `/sync` — would complicate the 3-retry rule into N independent retry states instead of one.
- ❌ Generic expiring idempotency keys — client-generated permanent UUIDs solve the same problem without an expiry-window failure mode.
- ❌ Local-ID → server-ID mapping/swap step — eliminated entirely by generating the real ID client-side up front.
- ❌ Filesystem/blob storage for attachments — moot once attachments became link-only; don't reintroduce without confirming attachments are still URL-only.
- ❌ Single `trips` table with `isPublic` flag for browse — rejected for scale reasons (mixed access patterns), in favor of the separate `publicTrips` table.
- ❌ Mocking the Drizzle `db` client in server route tests — several required behaviors (user-scoping via `WHERE ownerId = ...`, the FK constraint between `trips.ownerId` and `users.userId`) are database-level guarantees a mock can't verify; a mock would test that the route called the right function, not that the database actually enforces the right thing. Route tests run against a real Postgres database instead — see README.md's Testing section.
- ❌ Local Postgres via Testcontainers/docker-compose for server tests — real Postgres too, but needs Docker as a local + CI dependency and hand-rolled container lifecycle plumbing. Rejected in favor of a dedicated Neon `test` branch (project already runs on Neon; branch creation needs only the already-installed Neon CLI, no new tooling).
