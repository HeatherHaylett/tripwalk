import { TripRepository } from './TripRepository';

export async function deleteTrip(
  repository: TripRepository,
  tripId: string,
): Promise<void> {
  await repository.delete(tripId);
}
