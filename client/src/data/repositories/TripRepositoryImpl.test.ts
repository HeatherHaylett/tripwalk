import { createContainer } from '@/core/di/container';
import { createLokiAdapter } from '@/test_utils';
import { useSessionStore } from '@/core/session/sessionStore';

test(`Watermelon record's id matches a UUID pattern and equals the returned tripId`, async () => {
  const lokiAdapter = createLokiAdapter();
  const { database, tripRepository } = createContainer(lokiAdapter);
  const ownerId = useSessionStore.getState().userId;
  const tripInput = {
    tripName: 'First Trip',
    destination: 'Tokyo',
  };

  const newTrip = await tripRepository.create(tripInput, ownerId);
  const trip = await database.get('trips').find(newTrip.tripId);

  expect(trip.id).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  expect(trip.id).toBe(newTrip.tripId);
});
