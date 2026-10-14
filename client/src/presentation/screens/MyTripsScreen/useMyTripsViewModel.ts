import { useEffect, useState } from 'react';
import { TripRepository } from '@/domain/usecases/TripRepository';
import { Trip } from '@/domain/entities/Trip';
import { useSessionStore } from '@/core/session/sessionStore';

export function useMyTripsViewModel(repository: TripRepository) {
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const ownerId = useSessionStore((state) => state.userId);

  useEffect(() => {
    const newTrips = repository.observeAll(ownerId);
    const sub = newTrips.subscribe(setMyTrips);
    return () => sub.unsubscribe();
  }, [repository, ownerId]);
  return { myTrips };
}
