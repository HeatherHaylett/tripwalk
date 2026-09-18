import { TripRepository } from './TripRepository';
import { Trip, NewTripInput } from '../entities/Trip';

// Storage-agnostic — depends only on the repository interface.
//
// IMPORTANT (architecture.md §5, invariant #1 in CLAUDE.md): the repository
// implementation behind this call MUST write to WatermelonDB and enqueue the
// outbox entry as a single atomic transaction. Do not split those two steps
// across separate calls, here or anywhere else — that's what guarantees a
// crash mid-write can never leave a trip written-but-not-queued.
export async function createTrip(
  repository: TripRepository,
  input: NewTripInput
): Promise<Trip> {
  validateTripInput(input);
  return repository.create(input);
}

function validateTripInput(input: NewTripInput): void {
  if (!input.tripName.trim()) {
    throw new Error('Trip name is required');
  }
}
