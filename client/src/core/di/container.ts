import { TripRepositoryImpl } from '@/data/repositories/TripRepositoryImpl';
import { TripRepository } from '@/domain/usecases/TripRepository';
import { Database } from '@nozbe/watermelondb';

export const tripRepository: TripRepository = new TripRepositoryImpl();

export const createContainer = (adapter) => {
  return new Database({
    adapter,
  });
};
