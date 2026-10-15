import { updateTrip } from './updateTrip';
import { TripRepository } from './TripRepository';
import { TRIP_NAME_REQUIRED } from './usecases_utils';
import { Trip, NewTripInput } from '../entities/Trip';

// A fake is correct here (CLAUDE.md Testing): the use case depends only on the
// repository interface, so its logic is verifiable without a real database.
function createFakeRepository() {
  const createUpdates: Array<{
    tripId: string;
    changes: Partial<NewTripInput>;
  }> = [];
  const ownerId = 'OWNER-A';
  const originalTrip = {
    tripName: 'First Trip',
    destination: 'Tokyo',
  };
  const repository: TripRepository = {
    create: jest.fn(),
    async update(tripId: string, changes: Partial<NewTripInput>) {
      createUpdates.push({ tripId, changes });
      const trip: Trip = {
        tripId,
        ownerId,
        tripName: changes?.tripName || originalTrip.tripName,
        destination: changes?.destination || originalTrip.destination,
        isPublic: false,
        clientCreatedAt: 0,
        serverCreatedAt: null,
        syncStatus: 'synced',
      };
      return trip;
    },
    delete: jest.fn(),
    getById: jest.fn(),
    observeAll: jest.fn(),
  };
  return { repository, createUpdates };
}

describe('updateTrip', () => {
  test('reject empty or whitespace when tripName is provided', async () => {
    const { repository, createUpdates } = createFakeRepository();
    const tripId = '00-11-22';
    await expect(
      updateTrip(repository, tripId, {
        tripName: '',
        destination: 'Tokyo',
      }),
    ).rejects.toMatchObject({
      field: 'tripName',
      message: TRIP_NAME_REQUIRED,
    });
    expect(createUpdates).toHaveLength(0);
  });
  test('updates destination without providing trip name', async () => {
    const { repository, createUpdates } = createFakeRepository();
    const tripId = '00-11-22';
    await updateTrip(repository, tripId, { destination: 'Paris' });
    expect(createUpdates).toHaveLength(1);
    expect(createUpdates[0]?.changes.destination).toEqual('Paris');
  });
  test('updates trip name without providing destination', async () => {
    const { repository, createUpdates } = createFakeRepository();
    const tripId = '00-11-22';
    await updateTrip(repository, tripId, { tripName: 'New Trip' });
    expect(createUpdates).toHaveLength(1);
    expect(createUpdates[0]?.changes.tripName).toEqual('New Trip');
  });
  test('valid changes pass through unchanged', async () => {
    const { repository, createUpdates } = createFakeRepository();
    const tripId = '00-11-22';
    const changes = { tripName: 'New Trip', destination: 'Paris' };
    await updateTrip(repository, tripId, changes);

    expect(createUpdates).toEqual([{ tripId, changes }]);
  });
});
