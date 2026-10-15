import { deleteTrip } from './deleteTrip';
import { TripRepository } from './TripRepository';

// A fake is correct here (CLAUDE.md Testing): the use case depends only on the
// repository interface, so its logic is verifiable without a real database.
function createFakeRepository() {
  const repository: TripRepository = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    getById: jest.fn(),
    observeAll: jest.fn(),
  };
  return { repository };
}

describe('deleteTrip', () => {
  test('calls repository.delete with the id', async () => {
    const { repository } = createFakeRepository();
    await deleteTrip(repository, '00-11-22');
    expect(repository.delete).toHaveBeenCalledTimes(1);
    expect(repository.delete).toHaveBeenCalledWith('00-11-22');
  });
});
