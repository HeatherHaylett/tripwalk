import { TripRepositoryImpl } from '@/data/repositories/TripRepositoryImpl';
import { TripRepository } from '@/domain/usecases/TripRepository';

export const tripRepository: TripRepository = new TripRepositoryImpl();
