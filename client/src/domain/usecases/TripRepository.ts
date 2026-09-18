import { Trip, NewTripInput } from '../entities/Trip';

// Domain use cases depend on THIS interface only — never on WatermelonDB or
// fetch directly. The concrete implementation lives in
// data/repositories/TripRepositoryImpl.ts and is wired in via core/di/container.ts.
// See architecture.md §3.
export interface TripRepository {
  create(input: NewTripInput, ownerId: string): Promise<Trip>;
  update(tripId: string, changes: Partial<NewTripInput>): Promise<Trip>;
  delete(tripId: string): Promise<void>;
  getById(tripId: string): Promise<Trip | null>;
  // Returns an observable, not a promise — screens subscribe to this for
  // reactive updates (see architecture.md §9 on why reactive queries matter
  // for the sync-status badge and background sync updates).
}
