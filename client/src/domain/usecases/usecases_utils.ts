import { NewTripInput } from '../entities/Trip';

export function validateTripInput(input: Partial<NewTripInput>): void {
  if (!input.tripName.trim()) {
    throw new Error('Trip name is required');
  }
}
