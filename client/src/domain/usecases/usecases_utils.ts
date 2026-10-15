import { NewTripInput } from '../entities/Trip';
import { ValidationError } from '../errors';

export const TRIP_NAME_REQUIRED = 'Trip name is required';

export function validateTripInput(input: Partial<NewTripInput>): void {
  if (input.tripName !== undefined && !input.tripName.trim()) {
    throw new ValidationError('tripName', TRIP_NAME_REQUIRED);
  }
}
