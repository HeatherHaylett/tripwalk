import { createContainer } from '@/core/di/container';
import { createLokiAdapter } from '@/test_utils';
import { useSessionStore } from '@/core/session/sessionStore';
import * as Crypto from 'expo-crypto';

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
