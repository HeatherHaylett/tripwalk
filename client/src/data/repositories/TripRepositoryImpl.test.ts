import { createContainer } from '@/core/di/container';
import { createLokiAdapter } from '@/test_utils';
import { Trip as TripModel } from '../local/models/Trip';
import { useSessionStore } from '@/core/session/sessionStore';
import * as Crypto from 'expo-crypto';
import { Database } from '@nozbe/watermelondb';
import { NewTripInput } from '../../domain/entities/Trip';

test(`Watermelon record's id matches a UUID pattern and equals the returned tripId`, async () => {
  const lokiAdapter = createLokiAdapter();
  const { database, tripRepository } = createContainer(lokiAdapter);
  const ownerId = useSessionStore.getState().userId;
  const tripInput = {
    tripName: 'First Trip',
    destination: 'Tokyo',
  };

  const newTrip = await tripRepository.create(tripInput, ownerId);
  const tripIds = (await database.get('trips').query().fetch()).map(
    (trip) => trip.id,
  );

  expect(newTrip.tripId).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  expect(tripIds).toEqual([newTrip.tripId]);
});

describe('create', () => {
  test('persists the trip so it is queryable afterward', async () => {
    const { database, tripRepository } = createContainer(createLokiAdapter());
    const ownerId = 'user-1';

    const newTrip = await tripRepository.create(
      { tripName: 'First Trip', destination: 'Tokyo' },
      ownerId,
    );

    const record = await database.get<TripModel>('trips').find(newTrip.tripId);
    expect(record.tripName).toEqual('First Trip');
    expect(record.destination).toEqual('Tokyo');
    expect(record.ownerId).toEqual(ownerId);
    expect(record.isPublic).toBe(false);
    expect(record.syncState).toEqual('pending');
    expect(await tripRepository.getById(newTrip.tripId)).toEqual(newTrip);
  });

  test('generates the tripId, ignoring any caller-supplied one', async () => {
    const { tripRepository } = createContainer(createLokiAdapter());
    const ownerId = 'user-1';
    const callerSuppliedId = 'caller-supplied-id';

    const newTrip = await tripRepository.create(
      {
        tripName: 'First Trip',
        destination: 'Tokyo',
        tripId: callerSuppliedId,
      } as NewTripInput,
      ownerId,
    );

    expect(newTrip.tripId).not.toEqual(callerSuppliedId);
    expect(newTrip.tripId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  test('returns a Trip matching the domain entity shape', async () => {
    const { tripRepository } = createContainer(createLokiAdapter());
    const ownerId = 'user-1';
    const before = Date.now();

    const newTrip = await tripRepository.create(
      { tripName: 'First Trip', destination: 'Tokyo' },
      ownerId,
    );

    expect(newTrip).toEqual({
      tripId: expect.any(String),
      ownerId,
      tripName: 'First Trip',
      destination: 'Tokyo',
      isPublic: false,
      clientCreatedAt: expect.any(Number),
      serverCreatedAt: null,
      syncStatus: 'pending',
    });
    expect(newTrip.clientCreatedAt).toBeGreaterThanOrEqual(before);
    expect(newTrip.clientCreatedAt).toBeLessThanOrEqual(Date.now());
  });
});

// Puts a trip into the 'synced' state, which the repository can't do (create
// always sets 'pending'), then re-reads it so a silently failed setup can't
// make a later 'pending' assertion pass vacuously.
async function markSynced(database: Database, tripId: string) {
  const record = await database.get<TripModel>('trips').find(tripId);
  await database.write(() =>
    record.update((trip) => {
      trip.syncState = 'synced';
    }),
  );
  const reread = await database.get<TripModel>('trips').find(tripId);
  expect(reread.syncState).toEqual('synced');
}

describe('update', () => {
  test('returns the updated trip, with the new name and the old destination', async () => {
    const lokiAdapter = createLokiAdapter();
    const { tripRepository } = createContainer(lokiAdapter);
    const ownerId = useSessionStore.getState().userId;
    const tripInput = {
      tripName: 'First Trip',
      destination: 'Tokyo',
    };
    const newTrip = await tripRepository.create(tripInput, ownerId);
    const updatedTripName = await tripRepository.update(newTrip.tripId, {
      tripName: 'Update Trip',
    });

    expect(updatedTripName).toEqual({
      ...newTrip,
      tripName: 'Update Trip',
      destination: 'Tokyo',
    });

    const updatedTripDestination = await tripRepository.update(newTrip.tripId, {
      destination: 'Paris',
    });

    expect(updatedTripDestination).toEqual({
      ...newTrip,
      tripName: 'Update Trip',
      destination: 'Paris',
    });
  });
  test('persists the change to the database', async () => {
    const lokiAdapter = createLokiAdapter();
    const { database, tripRepository } = createContainer(lokiAdapter);
    const ownerId = useSessionStore.getState().userId;
    const tripInput = {
      tripName: 'First Trip',
      destination: 'Tokyo',
    };
    const newTrip = await tripRepository.create(tripInput, ownerId);
    await tripRepository.update(newTrip.tripId, {
      tripName: 'Update Trip',
    });

    const record = await database.get<TripModel>('trips').find(newTrip.tripId);

    expect(record.destination).toEqual('Tokyo');
    expect(record.tripName).toEqual('Update Trip');
  });
  test('missing id throws an error', async () => {
    const lokiAdapter = createLokiAdapter();
    const { tripRepository } = createContainer(lokiAdapter);
    const unknownTripId = Crypto.randomUUID();

    await expect(
      tripRepository.update(unknownTripId, { tripName: 'X' }),
    ).rejects.toThrow(/not found/i);
  });
  test(`sync state is 'pending' after update`, async () => {
    const lokiAdapter = createLokiAdapter();
    const { database, tripRepository } = createContainer(lokiAdapter);
    const ownerId = useSessionStore.getState().userId;
    const tripInput = {
      tripName: 'First Trip',
      destination: 'Tokyo',
    };
    const newTrip = await tripRepository.create(tripInput, ownerId);
    await markSynced(database, newTrip.tripId);
    const result = await tripRepository.update(newTrip.tripId, {
      tripName: 'Update Trip',
    });
    expect(result.syncStatus).toEqual('pending');
    const record = await database.get<TripModel>('trips').find(newTrip.tripId);
    expect(record.syncState).toEqual('pending');
  });
  test(`sync state is 'synced' updating with empty object or undefined value`, async () => {
    const lokiAdapter = createLokiAdapter();
    const { database, tripRepository } = createContainer(lokiAdapter);
    const ownerId = useSessionStore.getState().userId;
    const tripInput = {
      tripName: 'First Trip',
      destination: 'Tokyo',
    };
    const newTrip = await tripRepository.create(tripInput, ownerId);
    await markSynced(database, newTrip.tripId);
    const resultEmptyObj =await tripRepository.update(newTrip.tripId, {});
    expect(resultEmptyObj.syncStatus).toEqual('synced');
    const resultDestUndefined = await tripRepository.update(newTrip.tripId, {
      destination: undefined,
    });
    expect(resultDestUndefined.syncStatus).toEqual('synced');
    const resultNameUndefined = await tripRepository.update(newTrip.tripId, {
      tripName: undefined,
    });
    expect(resultNameUndefined.syncStatus).toEqual('synced');
    const record = await database.get<TripModel>('trips').find(newTrip.tripId);
    expect(record.syncState).toEqual('synced');
  });
});

describe('delete', () => {
  test('deletes the correct trip', async () => {
    const lokiAdapter = createLokiAdapter();
    const { database, tripRepository } = createContainer(lokiAdapter);
    const ownerId = useSessionStore.getState().userId;
    const tripInputA = {
      tripName: 'First Trip',
      destination: 'Tokyo',
    };
    const tripInputB = {
      tripName: 'Second Trip',
      destination: 'Rome',
    };

    const newTripA = await tripRepository.create(tripInputA, ownerId);
    const newTripB = await tripRepository.create(tripInputB, ownerId);
    await tripRepository.delete(newTripB.tripId);
    const tripIds = (await database.get('trips').query().fetch()).map(
      (trip) => trip.id,
    );
    expect(tripIds).not.toContain(newTripB.tripId);
    expect(tripIds).toEqual([newTripA.tripId]);
  });

  test('missing id does not throw an error', async () => {
    const { tripRepository } = createContainer(createLokiAdapter());
    await expect(
      tripRepository.delete(Crypto.randomUUID()),
    ).resolves.toBeUndefined();
  });
});

describe('getById', () => {
  test('returns the correct trip', async () => {
    const lokiAdapter = createLokiAdapter();
    const { tripRepository } = createContainer(lokiAdapter);
    const ownerId = useSessionStore.getState().userId;
    const tripInputA = {
      tripName: 'First Trip',
      destination: 'Tokyo',
    };
    const tripInputB = {
      tripName: 'Second Trip',
      destination: 'Rome',
    };

    await tripRepository.create(tripInputA, ownerId);
    const newTripB = await tripRepository.create(tripInputB, ownerId);

    const foundTrip = await tripRepository.getById(newTripB.tripId);

    expect(newTripB).toEqual(foundTrip);
  });

  test('returns null for a missing id', async () => {
    const lokiAdapter = createLokiAdapter();
    const { tripRepository } = createContainer(lokiAdapter);
    const ownerId = useSessionStore.getState().userId;
    const tripInputA = {
      tripName: 'First Trip',
      destination: 'Tokyo',
    };

    await tripRepository.create(tripInputA, ownerId);
    const unknownTripId = Crypto.randomUUID();
    const foundTrip = await tripRepository.getById(unknownTripId);

    expect(foundTrip).toBeNull();
  });
});
