import { createTrip } from './createTrip';
import { TripRepository } from './TripRepository';
import { Trip, NewTripInput } from '../entities/Trip';

// A fake is correct here (CLAUDE.md Testing): the use case depends only on the
// repository interface, so its logic is verifiable without a real database.
function createFakeRepository() {
  const createCalls: Array<{ input: NewTripInput; ownerId: string }> = [];
  const repository: TripRepository = {
    async create(input, ownerId) {
      createCalls.push({ input, ownerId });
      const trip: Trip = {
        tripId: 'fake-trip-id',
        ownerId,
        tripName: input.tripName,
        destination: input.destination,
        isPublic: false,
        clientCreatedAt: 0,
        serverCreatedAt: null,
        syncStatus: 'pending',
      };
      return trip;
    },
    update: jest.fn(),
    delete: jest.fn(),
    getById: jest.fn(),
  };
  return { repository, createCalls };
}

describe('createTrip', () => {
  test.each([
    ['empty', ''],
    ['whitespace-only', '   \t\n'],
  ])('rejects an %s tripName without calling the repository', async (_, tripName) => {
    const { repository, createCalls } = createFakeRepository();

    await expect(
      createTrip(repository, { tripName, destination: 'Tokyo' }, 'user-1'),
    ).rejects.toThrow('Trip name is required');

    expect(createCalls).toHaveLength(0);
  });

  test('passes a valid input and the ownerId to repository.create as separate args', async () => {
    const { repository, createCalls } = createFakeRepository();
    const input = { tripName: 'First Trip', destination: 'Tokyo' };

    await createTrip(repository, input, 'user-1');

    expect(createCalls).toHaveLength(1);
    const [call] = createCalls;
    expect(call?.input).toEqual(input);
    expect(call?.input).not.toHaveProperty('ownerId');
    expect(call?.ownerId).toBe('user-1');
  });
});
