import { useEffect, useState } from 'react';
import { TripRepository } from '@/domain/usecases/TripRepository';
import { Trip } from '@/domain/entities/Trip';
import { useCurrentUserId } from '@/core/session/useCurrentUserId';

export function useMyTripsViewModel(repository: TripRepository) {
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const { userId: ownerId, error } = useCurrentUserId();

  useEffect(() => {
    if (!ownerId) return;
    const newTrips = repository.observeAll(ownerId);
    const sub = newTrips.subscribe(setMyTrips);
    return () => sub.unsubscribe();
  }, [repository, ownerId]);
  return { myTrips, error };
}
