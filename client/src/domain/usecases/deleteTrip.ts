import { TripRepository } from './TripRepository';

// Thin pass-through so screens never import the repository directly. Awaited so
// a repository failure rejects this promise instead of being dropped.
export async function deleteTrip(
  repository: TripRepository,
  tripId: string,
): Promise<void> {
  await repository.delete(tripId);
}
