import { TripRepository } from './TripRepository';
import { Trip, NewTripInput } from '../entities/Trip';
import { validateTripInput } from './usecases_utils';

export async function updateTrip(
  repository: TripRepository,
  tripId: string,
  changes: Partial<NewTripInput>,
): Promise<Trip> {
  validateTripInput(changes);
  return repository.update(tripId, changes);
}
