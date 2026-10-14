import { Observable } from 'rxjs';
import { createContainer } from '@/core/di/container';
import { createLokiAdapter } from '@/test_utils';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useSessionStore } from '@/core/session/sessionStore';
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

test('unsubscribes from observeAll when the screen unmounts', async () => {
  const { tripRepository } = createContainer(createLokiAdapter());
  // Wrap the real observable (the real database is still underneath) so the
  // test can see whether its teardown ran.
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

  const { unmount } = await renderHook(() =>
    useMyTripsViewModel(tripRepository),
  );
  expect(teardowns).toBe(0);

  await unmount();

  expect(teardowns).toBe(1);
});
