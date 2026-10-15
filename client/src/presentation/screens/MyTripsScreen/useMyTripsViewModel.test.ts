import { Observable } from 'rxjs';
import { createContainer } from '@/core/di/container';
import { createLokiAdapter } from '@/test_utils';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useSessionStore } from '@/core/session/sessionStore';
import { TripRepository } from '@/domain/usecases/TripRepository';
import { useMyTripsViewModel } from './useMyTripsViewModel';

const OWNER_A = 'owner-a';
const OWNER_B = 'owner-b';

beforeEach(() => {
  useSessionStore.setState({ userId: OWNER_A });
});

test('shows trips that already exist when the hook mounts', async () => {
  const { tripRepository } = createContainer(createLokiAdapter());

  await tripRepository.create(
    { tripName: 'First Trip', destination: 'Tokyo' },
    OWNER_A,
  );
  const { result } = await renderHook(() =>
    useMyTripsViewModel(tripRepository),
  );

  await waitFor(() =>
    expect(result.current.myTrips.map((trip) => trip.tripName)).toEqual([
      'First Trip',
    ]),
  );
});

test('shows a trip created after the hook mounted, without a refresh', async () => {
  const { tripRepository } = createContainer(createLokiAdapter());

  const { result } = await renderHook(() =>
    useMyTripsViewModel(tripRepository),
  );
  await act(async () => {
    await tripRepository.create(
      { tripName: 'First Trip', destination: 'Tokyo' },
      OWNER_A,
    );
  });

  await waitFor(() =>
    expect(result.current.myTrips.map((trip) => trip.tripName)).toEqual([
      'First Trip',
    ]),
  );
});

test("does not show another owner's trips", async () => {
  const { tripRepository } = createContainer(createLokiAdapter());

  await tripRepository.create(
    { tripName: 'A Trip', destination: 'Tokyo' },
    OWNER_A,
  );
  await tripRepository.create(
    { tripName: 'B Trip', destination: 'Rome' },
    OWNER_B,
  );
  const { result } = await renderHook(() =>
    useMyTripsViewModel(tripRepository),
  );

  await waitFor(() =>
    expect(result.current.myTrips.map((trip) => trip.tripName)).toEqual([
      'A Trip',
    ]),
  );
});

test('re-subscribes for the new owner when the session user changes', async () => {
  const { tripRepository } = createContainer(createLokiAdapter());

  await tripRepository.create(
    { tripName: 'A Trip', destination: 'Tokyo' },
    OWNER_A,
  );
  await tripRepository.create(
    { tripName: 'B Trip', destination: 'Rome' },
    OWNER_B,
  );
  const { result } = await renderHook(() =>
    useMyTripsViewModel(tripRepository),
  );
  await waitFor(() =>
    expect(result.current.myTrips.map((trip) => trip.tripName)).toEqual([
      'A Trip',
    ]),
  );

  await act(async () => {
    useSessionStore.setState({ userId: OWNER_B });
  });

  await waitFor(() =>
    expect(result.current.myTrips.map((trip) => trip.tripName)).toEqual([
      'B Trip',
    ]),
  );
});

test('shows an error instead of crashing when no user is set', async () => {
  const { tripRepository } = createContainer(createLokiAdapter());
  // EXPO_PUBLIC_DEV_USER_ID unset (always the case under Jest without setState)
  useSessionStore.setState({ userId: undefined as unknown as string });

  const { result } = await renderHook(() =>
    useMyTripsViewModel(tripRepository),
  );

  expect(result.current.myTrips).toEqual([]);
  expect(result.current.error).toMatch(/EXPO_PUBLIC_DEV_USER_ID/);
});

// Wraps the real observable (the real database is still underneath) so a test
// can see how many subscriptions have been torn down.
function countTeardowns(tripRepository: TripRepository) {
  let teardowns = 0;
  const realObserveAll = tripRepository.observeAll.bind(tripRepository);
  tripRepository.observeAll = (ownerId) =>
    new Observable((subscriber) => {
      const subscription = realObserveAll(ownerId).subscribe(subscriber);
      return () => {
        teardowns += 1;
        subscription.unsubscribe();
      };
    });
  return () => teardowns;
}

test('clears the list when the session user goes away', async () => {
  const { tripRepository } = createContainer(createLokiAdapter());
  await tripRepository.create(
    { tripName: 'A Trip', destination: 'Tokyo' },
    OWNER_A,
  );
  const { result } = await renderHook(() =>
    useMyTripsViewModel(tripRepository),
  );
  await waitFor(() => expect(result.current.myTrips).toHaveLength(1));

  await act(async () => {
    useSessionStore.setState({ userId: undefined as unknown as string });
  });

  // No new subscription means no new emission, so nothing can overwrite a
  // stale list: it must be cleared by the hook itself.
  expect(result.current.myTrips).toEqual([]);
});

test('tears down the previous subscription when the owner changes', async () => {
  const { tripRepository } = createContainer(createLokiAdapter());
  const teardowns = countTeardowns(tripRepository);
  const { unmount } = await renderHook(() =>
    useMyTripsViewModel(tripRepository),
  );
  expect(teardowns()).toBe(0);

  await act(async () => {
    useSessionStore.setState({ userId: OWNER_B });
  });
  expect(teardowns()).toBe(1);

  await unmount();
  expect(teardowns()).toBe(2);
});

test('unsubscribes from observeAll when the screen unmounts', async () => {
  const { tripRepository } = createContainer(createLokiAdapter());
  const teardowns = countTeardowns(tripRepository);

  const { unmount } = await renderHook(() =>
    useMyTripsViewModel(tripRepository),
  );
  expect(teardowns()).toBe(0);

  await unmount();

  expect(teardowns()).toBe(1);
});

describe('Loading State', () => {
  test('True right after mount, false after the first emission', async () => {
    const { tripRepository } = createContainer(createLokiAdapter());
    await tripRepository.create(
      { tripName: 'A Trip', destination: 'Tokyo' },
      OWNER_A,
    );
    await tripRepository.create(
      { tripName: 'B Trip', destination: 'Rome' },
      OWNER_B,
    );
    const { result } = await renderHook(() =>
      useMyTripsViewModel(tripRepository),
    );
    expect(result.current.isLoading).toEqual(true);
    await waitFor(() => expect(result.current.isLoading).toEqual(false));
  });
  test('False for an owner with zero trips, after the first emission', async () => {
    const { tripRepository } = createContainer(createLokiAdapter());
    const { result } = await renderHook(() =>
      useMyTripsViewModel(tripRepository),
    );
    await waitFor(() => expect(result.current.isLoading).toEqual(false));
    expect(result.current.myTrips).toEqual([]);
  });
  test('False when the owner is undefined', async () => {
    const { tripRepository } = createContainer(createLokiAdapter());
    const { result } = await renderHook(() =>
      useMyTripsViewModel(tripRepository),
    );
    await waitFor(() => expect(result.current.isLoading).toEqual(false));
    await act(async () => {
      useSessionStore.setState({ userId: undefined as unknown as string });
    });
    expect(result.current.isLoading).toEqual(false);
  });
  test('True again after the owner changes, until the new owner first emission arrives', async () => {
    const { tripRepository } = createContainer(createLokiAdapter());
    const { result } = await renderHook(() =>
      useMyTripsViewModel(tripRepository),
    );
    await waitFor(() => expect(result.current.isLoading).toEqual(false));
    await act(async () => {
      useSessionStore.setState({ userId: OWNER_B });
    });
    expect(result.current.isLoading).toEqual(true);
    await waitFor(() => expect(result.current.isLoading).toEqual(false));
  });
});
