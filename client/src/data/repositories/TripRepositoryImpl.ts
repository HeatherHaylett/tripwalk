import { Database, Q } from '@nozbe/watermelondb';
import { Trip as TripModel } from '../local/models/Trip';
import { Trip, NewTripInput } from '../../domain/entities/Trip';
import { TripRepository } from '../../domain/usecases/TripRepository';
import { map, Observable } from 'rxjs';

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
  private async findRecordById(id: string): Promise<TripModel | undefined> {
    const tripRecords = await this.database
      .get<TripModel>('trips')
      .query(Q.where('id', id))
      .fetch();
    return tripRecords[0];
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
    const updatedTrip = await this.database.write(async () => {
      const record = await this.findRecordById(tripId);
      if (!record) throw new Error('Trip record not found');
      if (changes.tripName === undefined && changes.destination === undefined)
        return record;
      await record.update((trip) => {
        if (changes.tripName !== undefined) {
          trip.tripName = changes.tripName;
        }
        if (changes.destination !== undefined) {
          trip.destination = changes.destination;
        }
        trip.syncState = 'pending';
      });
      // When the outbox queue is built (separate, future work — see
      // architecture.md §5 and CLAUDE.md invariant #1), the outbox-entry
      // update() call joins here, inside this same database.write() block,
      // so the trip row and its outbox entry commit as one transaction.
      return record;
    });
    return toTrip(updatedTrip);
  }
  async delete(tripId: string): Promise<void> {
    await this.database.write(async () => {
      const record = await this.findRecordById(tripId);
      if (!record) return;
      await record.destroyPermanently();
      // When the outbox queue is built (separate, future work — see
      // architecture.md §5 and CLAUDE.md invariant #1), the outbox-entry
      // delete() call joins here, inside this same database.write() block,
      // so the trip row and its outbox entry commit as one transaction.
    });
  }
  async getById(tripId: string): Promise<Trip | null> {
    const record = await this.findRecordById(tripId);
    if (!record) return null;

    return toTrip(record);
  }
  observeAll(ownerId: string): Observable<Trip[]> {
    const tripRecords = this.database
      .get<TripModel>('trips')
      .query(Q.where('owner_id', ownerId))
      .observe();

    return tripRecords.pipe(map((models) => models.map(toTrip)));
  }
}
