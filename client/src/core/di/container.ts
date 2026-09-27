import { TripRepositoryImpl } from '@/data/repositories/TripRepositoryImpl';
import { TripRepository } from '@/domain/usecases/TripRepository';
import { createDatabase } from '@/data/local/watermelon';
import type { DatabaseAdapter } from '@nozbe/watermelondb/adapters/type';

export const createContainer = (adapter: DatabaseAdapter) => {
  const database = createDatabase(adapter);
  const tripRepository: TripRepository = new TripRepositoryImpl(database);
  return { database, tripRepository };
};
