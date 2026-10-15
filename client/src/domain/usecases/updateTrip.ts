import { TripRepository } from './TripRepository';
import { Trip, NewTripInput } from '../entities/Trip';

export async function updateTrip(
  repository: TripRepository,
  tripId: string,
  changes: Partial<NewTripInput>,
): Promise<Trip> {
  return repository.update(tripId, changes);
}

// reject invalid trip name
