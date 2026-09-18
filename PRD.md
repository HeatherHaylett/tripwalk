# Tripwalk — PRD

## 1. Problem / Overview

Trip planning today is scattered across notes apps, screenshots, and saved map pins, and the inspiration people draw on is generic listicle content rather than real people's actual plans. As a result, spontaneous travel ideas get lost before they ever become a plan, and there's no single place to both capture a "someday" trip and discover real itineraries from other travelers.

The app is best thought of as **"Pinterest for trip planning"** — a place to collect and browse itinerary ideas for their own sake, not just a utilitarian booking tool.

## 2. Goals & Success Metrics

1. **Trip planning consolidates into the app**, replacing scattered notes/screenshots
   - *% of users who add an item via share-to-app within their first week*
2. **Users share trips through the app** instead of workarounds like text/notes
   - *# of trips shared per active user per month*
3. **"Someday" ideas get captured instead of lost**
   - *% of trips with zero items in the first session that get revisited later*
4. **Users find real travel inspiration from other people**, not generic content
   - *avg. # of trips bookmarked per active user; % of users who bookmark ≥1 trip in their first month*

## 3. Users

**Primary user:** a hobbyist trip-planner — someone who enjoys researching and building itineraries (hotels, restaurants, activities) as an activity in itself, not only when actively booking a trip. They want a dedicated, enjoyable place to build and browse itineraries — including hypothetical "dream trip" ideas — and to share that work and draw inspiration from others who do the same.

## 4. User Stories

1. As a hobbyist trip-planner, I want to create a trip with no fixed dates, so that I can capture a "someday" dream trip idea without committing to a schedule.
2. As a hobbyist trip-planner, I want to add a location to a trip, so that I can collect hotels, restaurants, and activities in one place instead of scattering them across notes and screenshots.
3. As a hobbyist trip-planner, I want to publish my trip publicly, so that I can build a reputation as a trip planner and inspire others with my itineraries.
4. As a hobbyist trip-planner, I want to bookmark other people's published trips, so that I can reference real itineraries later for inspiration when planning my own trips.
5. As a hobbyist trip-planner, I want to share a link directly into the app from wherever I find it (Google Maps, a website, etc.), so that I'm not copy-pasting into notes in an unorganized way.

## 5. Requirements

### 5a. Functional Requirements

- **My Trips** — create, edit, delete trips (name/destination, no fixed dates); private by default
- **Itinerary items** — items are collected as cards within a trip, unorganized by default; optionally assignable to a Morning/Afternoon/Evening slot (e.g. via drag); unassigned items live in a general collection
- **Offline** — full read/write for own trips with no connectivity; syncs automatically once reconnected
- **Publish** — owner can make a trip publicly visible (manual action, not automatic)
- **Browse** — view other users' published trips
- **Bookmark** — save a reference to someone else's published trip; available offline once bookmarked
- **Share-to-app** — external links can be shared into the app to help create an itinerary item
- **Accounts** — required, for ownership, privacy, and publishing

### 5b. Non-Functional Requirements

- **Performance** — instant (no-spinner) reads for own trips; smooth, virtualized scrolling in the browse feed
- **Data durability** — top priority; an offline-created/edited trip must never be lost, even across app crashes or failed syncs
- **Scale** — small today (hundreds of users), architected (indexed queries, cursor pagination) so it doesn't require a rewrite at 10k+ users
- **Privacy** — private-by-default trips must never leak; enforced server-side, not just client-side

## 6. Non-Goals

- Image/file attachments — attachments are links only
- Multi-device sync — single device only, no cross-device reconciliation
- Real-time multi-user collaboration on a trip
- Social features beyond publish/bookmark — no likes, comments, follows, or profiles

### Future ideas (not in scope now, worth revisiting)

- Export/share a trip to non-users (e.g. a shareable read-only link or PDF, sent via text/email, no app required)
- Public profile / reputation-building for trip planners (tied to user story #3)

## 7. Open Questions / Risks

- **Bookmark staleness:** bookmarks reflect the owner's *last published* version of a trip, not live edits. May need a "last updated" indicator on bookmarked trips to make this visible rather than silent.
- **Discovery:** how users actually find other people's trips to browse — search, explore feed, following — left open during design.
- **Auth method:** underlying account auth (email/password vs. social login vs. guest) not yet decided; biometric login (Face ID/Touch ID) wanted as a fast-unlock layer on top of whichever is chosen. (In the meantime, `server/src/plugins/authStub.ts` is a temporary dev-only placeholder — an unverified `x-user-id` header — used only to unblock server route development; it is not a candidate answer to this open question.)
- **Trip detail UI:** exact visual design for a trip containing both time-slotted and unsorted items is undecided — needs a design pass.
