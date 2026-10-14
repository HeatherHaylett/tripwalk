import { TripRepository } from '@/domain/usecases/TripRepository';
import { Trip } from '@/domain/entities/Trip';
export function useMyTripsViewModel(repository: TripRepository) {
  return { myTrips: [] as Trip[] };
}
