import { TripRepository } from '../../../domain/usecases/TripRepository';
import { Trip, NewTripInput, SyncStatus } from '../../../domain/entities/Trip';
import * as Crypto from 'expo-crypto';
import { renderHook, act } from '@testing-library/react-native';
import { useNewTripViewModel } from './useNewTripViewModel';
import { useSessionStore } from '@/core/session/sessionStore';

export class TripRepositoryTest implements TripRepository {
  lastInput: NewTripInput;
  lastOwnerId: string;
  constructor() {
    this.lastInput = { tripName: '', destination: '' };
    this.lastOwnerId = '';
  }

  async create(input: NewTripInput, ownerId: string): Promise<Trip> {
    this.lastInput = input;
    this.lastOwnerId = ownerId;
    return {
      tripId: Crypto.randomUUID(),
      ownerId: ownerId,
      tripName: input.tripName,
      destination: input.destination,
      isPublic: false,
      clientCreatedAt: Date.now(),
      serverCreatedAt: null,
      syncStatus: 'pending',
    };
  }
  async update(tripId: string, changes: Partial<NewTripInput>): Promise<Trip> {
    throw new Error('not implemented');
  }
  async delete(tripId: string): Promise<void> {
    throw new Error('not implemented');
  }
  async getById(tripId: string): Promise<Trip | null> {
    throw new Error('not implemented');
  }
}

const tripRepositoryTest: TripRepositoryTest = new TripRepositoryTest();
const ownerId = useSessionStore.getState().userId;

test('submitting valid input calls through with the right ownerId and input shape.', async () => {
  const { result } = await renderHook(() =>
    useNewTripViewModel(tripRepositoryTest),
  );
  await act(() => {
    result.current.setTripName('First trip');
    result.current.setDestination('Tokyo');
  });

  await act(async () => {
    await result.current.handleSubmit();
  });
  expect(tripRepositoryTest.lastInput).toStrictEqual({
    tripName: 'First trip',
    destination: 'Tokyo',
  });
  expect(tripRepositoryTest.lastOwnerId).toBe(ownerId);
});
