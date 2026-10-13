import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import { Trip as TripModel } from '../local/models/Trip';
import { Trip, NewTripInput } from '../../domain/entities/Trip';
import { TripRepository } from '../../domain/usecases/TripRepository';

function toTrip(model: TripModel): Trip {
  return {
    tripId: model.id,
    ownerId: model.ownerId,
    tripName: model.tripName,
    destination: model.destination,
    isPublic: model.isPublic,
    clientCreatedAt: model.clientCreatedAt.getTime(),
    serverCreatedAt:
      model.serverCreatedAt instanceof Date
        ? model.serverCreatedAt.getTime()
        : null,
    syncStatus: model.syncState,
  };
}

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
    return toTrip(newTripModel);
  }
  async update(tripId: string, changes: Partial<NewTripInput>): Promise<Trip> {
    throw new Error('not implemented');
  }
  async delete(tripId: string): Promise<void> {
    await this.database.write(async () => {
      const tripRecords = await this.database
        .get<TripModel>('trips')
        .query(Q.where('id', tripId))
        .fetch();
      const record = tripRecords[0];
      if (!record) return;
      await record.destroyPermanently();
      // When the outbox queue is built (separate, future work — see
      // architecture.md §5 and CLAUDE.md invariant #1), the outbox-entry
      // delete() call joins here, inside this same database.write() block,
      // so the trip row and its outbox entry commit as one transaction.
    });
  }
  async getById(tripId: string): Promise<Trip | null> {
    const tripRecords = await this.database
      .get<TripModel>('trips')
      .query(Q.where('id', tripId))
      .fetch();
    const record = tripRecords[0];
    if (!record) return null;

    return toTrip(record);
  }
}
