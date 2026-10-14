/**
 * RECIPE (#11): testing a hook backed by a WatermelonDB `.observe()` query.
 * Copy this shape for any reactive hook (e.g. #5's observeAll consumer).
 * useTripCount itself is throwaway; the pattern is what to reuse.
 *
 * 1. Build a real in-memory DB: createDatabase(createLokiAdapter()). No mocks.
 * 2. `await renderHook(() => yourHook(...))` and assert the initial value.
 * 3. Write a row WHILE the hook is mounted, via `await db.write(...)`.
 *    (Direct writes are fine here: this tests the observe mechanism, not the
 *    app write path. Don't copy a direct write into app code.)
 * 4. `await waitFor(() => expect(result.current)...)`. The re-render lands
 *    after the write resolves, so asserting immediately would be flaky.
 *
 * Gotchas:
 * - observeCount() must be observeCount(false); the throttled default never
 *   emitted a second value under Jest. observe() is unaffected.
 * - In @testing-library/react-native v14, renderHook and waitFor return
 *   Promises: always await them.
 */
import { createDatabase } from '@/data/local/watermelon';
import { createLokiAdapter } from '@/test_utils';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useTripCount } from './useTripCount';
import { Trip as TripModel } from '../local/models/Trip';

test('reports rows that already exist at mount', async () => {
  const lokiAdapter = createLokiAdapter();
  const db = createDatabase(lokiAdapter);
  await db.write(() =>
    db.get<TripModel>('trips').create((trip) => {
      trip.ownerId = 'owner-1';
      trip.tripName = 'Spring';
      trip.destination = 'Paris';
      trip.isPublic = false;
      trip.clientCreatedAt = new Date();
      trip.serverCreatedAt = null;
      trip.syncState = 'pending';
    }),
  );
  const { result } = await renderHook(() => useTripCount(db));
  // The hook starts at useState(0); the real count arrives via the first
  // emission, so wait for it instead of asserting right after mount.
  await waitFor(() => expect(result.current).toBe(1));
});
test('trip count is 1 after insert', async () => {
  const lokiAdapter = createLokiAdapter();
  const db = createDatabase(lokiAdapter);
  const { result } = await renderHook(() => useTripCount(db));
  await db.write(() =>
    db.get<TripModel>('trips').create((trip) => {
      trip.ownerId = 'owner-1';
      trip.tripName = 'Spring';
      trip.destination = 'Paris';
      trip.isPublic = false;
      trip.clientCreatedAt = new Date();
      trip.serverCreatedAt = null;
      trip.syncState = 'pending';
    }),
  );
  await waitFor(() => expect(result.current).toBe(1));
});
