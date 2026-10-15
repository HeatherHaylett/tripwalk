import { NewTripInput } from '../entities/Trip';
import { ValidationError } from '../errors';

export const TRIP_NAME_REQUIRED = 'Trip name is required';

export function validateTripInput(input: Partial<NewTripInput>): void {
  // undefined means "not provided" (valid for updates); anything else must be
  // a non-blank string, including null/non-strings from untyped callers.
  if (input.tripName === undefined) return;
  if (typeof input.tripName !== 'string' || !input.tripName.trim()) {
    throw new ValidationError('tripName', TRIP_NAME_REQUIRED);
  }
}
