import { updateTrip } from './updateTrip';
import { TripRepository } from './TripRepository';
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

describe('Update Trip', () => {
  test('If trip name is provided, reject empty or whitespace', async () => {
    const { repository, createUpdates } = createFakeRepository();
    const tripId = '00-11-22';
    await expect(
      updateTrip(repository, tripId, {
        tripName: '',
        destination: 'Tokyo',
      }),
    ).rejects.toThrow('Trip name is required');
    expect(createUpdates).toHaveLength(0);
  });
});
