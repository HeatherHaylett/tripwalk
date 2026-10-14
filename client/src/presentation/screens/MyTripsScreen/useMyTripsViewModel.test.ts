import { createContainer } from '@/core/di/container';
import { createLokiAdapter } from '@/test_utils';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useSessionStore } from '@/core/session/sessionStore';
import { useMyTripsViewModel } from './useMyTripsViewModel';

useSessionStore.setState({ userId: 'owner-a' });

test('Before hook: show user trips from observeAll', async () => {
  const lokiAdapter = createLokiAdapter();
  const { tripRepository } = createContainer(lokiAdapter);
  const ownerId = useSessionStore.getState().userId;

  await tripRepository.create(
    {
      tripName: 'First Trip',
      destination: 'Tokyo',
    },
    ownerId,
  );
  const { result } = await renderHook(() =>
    useMyTripsViewModel(tripRepository),
  );
  await waitFor(() => expect(result.current.myTrips.length).toBe(1));
});

test('After hook: show user trips from observeAll', async () => {
  const lokiAdapter = createLokiAdapter();
  const { tripRepository } = createContainer(lokiAdapter);
  const ownerId = useSessionStore.getState().userId;

  const { result } = await renderHook(() =>
    useMyTripsViewModel(tripRepository),
  );
  await tripRepository.create(
    {
      tripName: 'First Trip',
      destination: 'Tokyo',
    },
    ownerId,
  );
  await waitFor(() =>
    expect(result.current.myTrips[0]?.tripName).toBe('First Trip'),
  );
});
