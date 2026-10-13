import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { Trip as TripModel } from '../local/models/Trip';
import { Trip, NewTripInput } from '../../domain/entities/Trip';
import { TripRepository } from '../../domain/usecases/TripRepository';

export class TripRepositoryImpl implements TripRepository {
  private readonly database: Database;
  constructor(database: Database) {
    this.database = database;
  }
  async create(input: NewTripInput, ownerId: string): Promise<Trip> {
    const newTripModel = await this.database.write(async () => {
      return await this.database.get<TripModel>('trips').create((trip) => {
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
      tripId: newTripModel.id,
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
    const tripRecords = await this.database
      .get<TripModel>('trips')
      .query(Q.where('id', tripId))
      .fetch();
    const record = tripRecords[0];
    if (!record) return null;

    return {
      tripId: record.id,
      ownerId: record.ownerId,
      tripName: record.tripName,
      destination: record.destination,
      isPublic: record.isPublic,
      clientCreatedAt: record.clientCreatedAt.getTime(),
      serverCreatedAt:
        record.serverCreatedAt instanceof Date
          ? record.serverCreatedAt.getTime()
          : null,
      syncStatus: record.syncState,
    };
  }
}
