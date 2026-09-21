import { database } from '../local/watermelon';
import { Trip as TripModel } from '../local/models/Trip';
import { Trip, NewTripInput } from '../../domain/entities/Trip';
import { TripRepository } from '../../domain/usecases/TripRepository';
import * as Crypto from 'expo-crypto';

export class TripRepositoryImpl implements TripRepository {
  async create(input: NewTripInput, ownerId: string): Promise<Trip> {
    const newTripModel = await database.write(async () => {
      return await database.get<TripModel>('trips').create((trip) => {
        trip.tripId = Crypto.randomUUID();
        trip.ownerId = ownerId;
        trip.tripName = input.tripName;
        trip.destination = input.destination;
        trip.isPublic = false;
        trip.clientCreatedAt = new Date(Date.now());
        trip.serverCreatedAt = null;
        trip.syncState = 'pending';
      });
      // When the outbox queue is built (separate, future work — see
      // architecture.md §5 and CLAUDE.md invariant #1), the outbox-entry
      // create() call joins here, inside this same database.write() block,
      // so the trip row and its outbox entry commit as one transaction.
    });
    const newTrip = {
      tripId: newTripModel.tripId,
      ownerId: newTripModel.ownerId,
      tripName: newTripModel.tripName,
      destination: newTripModel.destination,
      isPublic: newTripModel.isPublic,
      clientCreatedAt: newTripModel.clientCreatedAt.getTime(),
      serverCreatedAt:
        newTripModel.serverCreatedAt instanceof Date
          ? newTripModel.serverCreatedAt.getTime()
          : null,
      syncStatus: newTripModel.syncState,
    };
    return newTrip;
  }
  async update(tripId: string, changes: Partial<NewTripInput>): Promise<Trip> {
    throw new Error('not implemented');
  }
  async delete(tripId: string): Promise<void> {
    throw new Error('not implemented');
  }
  async getById(tripId: string): Promise<Trip | null> {
    throw new Error('not implemented');
  }
}
