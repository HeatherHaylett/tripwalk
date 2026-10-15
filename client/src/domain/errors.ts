// Thrown by use cases when user-supplied input is invalid. `field` lets a
// screen show the message next to the offending input.
export class ValidationError extends Error {
  readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
