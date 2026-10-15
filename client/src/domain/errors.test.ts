import { ValidationError } from './errors';

describe('ValidationError', () => {
  test('is an Error and a ValidationError', () => {
    const error = new ValidationError('tripName', 'Trip name is required');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ValidationError);
  });

  test('carries the message and the failing field', () => {
    const error = new ValidationError('tripName', 'Trip name is required');

    expect(error.message).toBe('Trip name is required');
    expect(error.field).toBe('tripName');
  });
});
