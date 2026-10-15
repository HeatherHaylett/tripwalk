import { Observable, delayWhen, throwError } from 'rxjs';
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

// Holds back everything the real query emits for one owner until release() is
// called, so a test can observe the loading window deterministically instead
// of racing the in-memory database. The real database is still underneath;
// only the delivery timing is controlled.
function holdEmissions(tripRepository: TripRepository, heldOwnerId: string) {
  let release!: () => void;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const realObserveAll = tripRepository.observeAll.bind(tripRepository);
  tripRepository.observeAll = (ownerId) =>
    ownerId === heldOwnerId
      ? realObserveAll(ownerId).pipe(delayWhen(() => released))
      : realObserveAll(ownerId);
  return release;
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
    const releaseA = holdEmissions(tripRepository, OWNER_A);
    const { result } = await renderHook(() =>
      useMyTripsViewModel(tripRepository),
    );
    // A's first emission is held, so this is the loading window, not a race.
    expect(result.current.isLoading).toEqual(true);

    await act(async () => {
      releaseA();
    });
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
    const releaseB = holdEmissions(tripRepository, OWNER_B);
    const { result } = await renderHook(() =>
      useMyTripsViewModel(tripRepository),
    );
    await waitFor(() => expect(result.current.isLoading).toEqual(false));
    await act(async () => {
      useSessionStore.setState({ userId: OWNER_B });
    });
    // B's first emission is held, so this is the loading window, not a race.
    expect(result.current.isLoading).toEqual(true);

    await act(async () => {
      releaseB();
    });
    await waitFor(() => expect(result.current.isLoading).toEqual(false));
  });
});

describe('Error State', () => {
  beforeEach(() => {
    // The hook logs the real error; keep the test output quiet.
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Makes observeAll fail for one owner and behave normally for the others.
  function failFor(tripRepository: TripRepository, failingOwnerId: string) {
    const realObserveAll = tripRepository.observeAll.bind(tripRepository);
    tripRepository.observeAll = (ownerId) =>
      ownerId === failingOwnerId
        ? throwError(() => new Error('db failed'))
        : realObserveAll(ownerId);
  }

  test('reports a failed query: message set, not loading, no trips', async () => {
    const { tripRepository } = createContainer(createLokiAdapter());
    failFor(tripRepository, OWNER_A);

    const { result } = await renderHook(() =>
      useMyTripsViewModel(tripRepository),
    );

    await waitFor(() =>
      expect(result.current.error).toMatch(/could not load your trips/i),
    );
    expect(result.current.isLoading).toEqual(false);
    expect(result.current.myTrips).toEqual([]);
  });

  test("does not show one owner's failure to the next owner", async () => {
    const { tripRepository } = createContainer(createLokiAdapter());
    failFor(tripRepository, OWNER_A);
    const { result } = await renderHook(() =>
      useMyTripsViewModel(tripRepository),
    );
    await waitFor(() => expect(result.current.error).not.toEqual(''));

    await act(async () => {
      useSessionStore.setState({ userId: OWNER_B });
    });

    await waitFor(() => expect(result.current.isLoading).toEqual(false));
    expect(result.current.error).toEqual('');
  });

  test('clears the failure when the same owner resubscribes to a working repository', async () => {
    const { tripRepository } = createContainer(createLokiAdapter());
    // Same real database underneath; only observeAll is made to fail.
    const failingRepository: TripRepository = Object.create(tripRepository);
    failingRepository.observeAll = () =>
      throwError(() => new Error('db failed'));

    const { result, rerender } = await renderHook<
      ReturnType<typeof useMyTripsViewModel>,
      { repository: TripRepository }
    >(({ repository }) => useMyTripsViewModel(repository), {
      initialProps: { repository: failingRepository },
    });
    await waitFor(() => expect(result.current.error).not.toEqual(''));

    await rerender({ repository: tripRepository });

    await waitFor(() => expect(result.current.isLoading).toEqual(false));
    expect(result.current.error).toEqual('');
  });

  test('never renders the old failure when the same owner returns after going away', async () => {
    const { tripRepository } = createContainer(createLokiAdapter());
    let ownerAFails = true;
    const realObserveAll = tripRepository.observeAll.bind(tripRepository);
    tripRepository.observeAll = (ownerId) =>
      ownerId === OWNER_A && ownerAFails
        ? throwError(() => new Error('db failed'))
        : realObserveAll(ownerId);
    // act() flushes the effect that would correct a stale render, so record
    // every render to see what the hook actually returned on the way.
    const renders: ReturnType<typeof useMyTripsViewModel>[] = [];
    const { result } = await renderHook(() => {
      const viewModel = useMyTripsViewModel(tripRepository);
      renders.push(viewModel);
      return viewModel;
    });
    await waitFor(() => expect(result.current.error).not.toEqual(''));
    await act(async () => {
      useSessionStore.setState({ userId: undefined as unknown as string });
    });
    ownerAFails = false;
    const rendersBeforeReturn = renders.length;

    await act(async () => {
      useSessionStore.setState({ userId: OWNER_A });
    });

    const rendersAfterReturn = renders.slice(rendersBeforeReturn);
    expect(rendersAfterReturn.length).toBeGreaterThan(0);
    expect(rendersAfterReturn.map((viewModel) => viewModel.error)).toEqual(
      rendersAfterReturn.map(() => ''),
    );
  });

  test('clears an earlier failure when the owner returns and the query now works', async () => {
    const { tripRepository } = createContainer(createLokiAdapter());
    let ownerAFails = true;
    const realObserveAll = tripRepository.observeAll.bind(tripRepository);
    tripRepository.observeAll = (ownerId) =>
      ownerId === OWNER_A && ownerAFails
        ? throwError(() => new Error('db failed'))
        : realObserveAll(ownerId);
    const { result } = await renderHook(() =>
      useMyTripsViewModel(tripRepository),
    );
    await waitFor(() => expect(result.current.error).not.toEqual(''));

    await act(async () => {
      useSessionStore.setState({ userId: OWNER_B });
    });
    await waitFor(() => expect(result.current.isLoading).toEqual(false));
    ownerAFails = false;
    await act(async () => {
      useSessionStore.setState({ userId: OWNER_A });
    });

    await waitFor(() => expect(result.current.isLoading).toEqual(false));
    expect(result.current.error).toEqual('');
  });
});

describe('delete', () => {
  test('removes row after request and confirm', async () => {
    const { tripRepository } = createContainer(createLokiAdapter());

    await tripRepository.create(
      { tripName: 'A Trip', destination: 'Tokyo' },
      OWNER_A,
    );
    await tripRepository.create(
      { tripName: 'B Trip', destination: 'Rome' },
      OWNER_A,
    );
    const { result } = await renderHook(() =>
      useMyTripsViewModel(tripRepository),
    );
    const tripToRemove = await result.current.myTrips.find(
      (trip) => trip.tripName === 'B Trip',
    );
    await act(async () => {
      !!tripToRemove && result.current.requestDelete(tripToRemove?.tripId);
    });
    await act(async () => {
      await result.current.confirmDelete();
    });
    await waitFor(() =>
      expect(result.current.myTrips.map((t) => t.tripName)).toEqual(['A Trip']),
    );
  });
  test('retains row after request and cancel', async () => {
    const { tripRepository } = createContainer(createLokiAdapter());

    await tripRepository.create(
      { tripName: 'A Trip', destination: 'Tokyo' },
      OWNER_A,
    );
    await tripRepository.create(
      { tripName: 'B Trip', destination: 'Rome' },
      OWNER_A,
    );
    const { result } = await renderHook(() =>
      useMyTripsViewModel(tripRepository),
    );
    const tripToRemove = await result.current.myTrips.find(
      (trip) => trip.tripName === 'B Trip',
    );
    await expect(tripToRemove).toBeDefined();
    await act(async () => {
      result.current.requestDelete(tripToRemove!.tripId);
    });
    await act(async () => {
      await result.current.cancelDelete();
    });
    await waitFor(() =>
      expect(result.current.myTrips.map((t) => t.tripName)).toEqual([
        'A Trip',
        'B Trip',
      ]),
    );
    await waitFor(() => expect(result.current.pendingRemoval).toBeNull());
  });
  test('removes nothing without error if confirm with nothing pending', async () => {
    const { tripRepository } = createContainer(createLokiAdapter());

    await tripRepository.create(
      { tripName: 'A Trip', destination: 'Tokyo' },
      OWNER_A,
    );
    await tripRepository.create(
      { tripName: 'B Trip', destination: 'Rome' },
      OWNER_A,
    );
    const { result } = await renderHook(() =>
      useMyTripsViewModel(tripRepository),
    );
    // Observes the call without replacing it: the real delete still runs. Needed
    // because repository.delete on a missing id is a silent no-op, so the list
    // alone can't show whether confirmDelete tried to delete.
    const deleteSpy = jest.spyOn(tripRepository, 'delete');
    await act(async () => {
      await result.current.confirmDelete();
    });
    expect(deleteSpy).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(result.current.myTrips.map((t) => t.tripName)).toEqual([
        'A Trip',
        'B Trip',
      ]),
    );
    await waitFor(() => expect(result.current.pendingRemoval).toBeNull());
  });

  async function renderWithTwoTrips() {
    const { tripRepository } = createContainer(createLokiAdapter());
    await tripRepository.create(
      { tripName: 'A Trip', destination: 'Tokyo' },
      OWNER_A,
    );
    await tripRepository.create(
      { tripName: 'B Trip', destination: 'Rome' },
      OWNER_A,
    );
    const { result } = await renderHook(() =>
      useMyTripsViewModel(tripRepository),
    );
    await waitFor(() => expect(result.current.myTrips).toHaveLength(2));
    const tripB = result.current.myTrips.find((t) => t.tripName === 'B Trip')!;
    return { tripRepository, result, tripBId: tripB.tripId };
  }

  test('clears the pending trip after a successful confirm', async () => {
    const { result, tripBId } = await renderWithTwoTrips();

    await act(async () => {
      result.current.requestDelete(tripBId);
    });
    await act(async () => {
      await result.current.confirmDelete();
    });

    await waitFor(() => expect(result.current.pendingRemoval).toBeNull());
    expect(result.current.deleteError).toEqual('');
  });

  test('when delete fails: sets deleteError, keeps the row, clears pending', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { tripRepository, result, tripBId } = await renderWithTwoTrips();
    jest
      .spyOn(tripRepository, 'delete')
      .mockRejectedValue(new Error('db failed'));

    await act(async () => {
      result.current.requestDelete(tripBId);
    });
    await act(async () => {
      await result.current.confirmDelete();
    });

    expect(result.current.deleteError).not.toEqual('');
    expect(result.current.pendingRemoval).toBeNull();
    expect(result.current.myTrips.map((t) => t.tripName)).toEqual([
      'A Trip',
      'B Trip',
    ]);
    // A failed delete is not a failed load: the list error stays empty.
    expect(result.current.error).toEqual('');
  });

  test('a new delete request clears the previous deleteError', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { tripRepository, result, tripBId } = await renderWithTwoTrips();
    jest
      .spyOn(tripRepository, 'delete')
      .mockRejectedValueOnce(new Error('db failed'));
    await act(async () => {
      result.current.requestDelete(tripBId);
    });
    await act(async () => {
      await result.current.confirmDelete();
    });
    expect(result.current.deleteError).not.toEqual('');

    await act(async () => {
      result.current.requestDelete(tripBId);
    });

    expect(result.current.deleteError).toEqual('');
  });
});
