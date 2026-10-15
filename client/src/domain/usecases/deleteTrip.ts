import { TripRepository } from './TripRepository';

export async function deleteTrip(
  repository: TripRepository,
  tripId: string,
): Promise<void> {
  try {
    await repository.delete(tripId);
  } catch {
    // swallowed: deliberately wrong, so the propagation test fails (red)
  }
}
