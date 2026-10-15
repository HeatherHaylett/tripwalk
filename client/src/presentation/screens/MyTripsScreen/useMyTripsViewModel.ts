import { useEffect, useState } from 'react';
import { TripRepository } from '@/domain/usecases/TripRepository';
import { Trip } from '@/domain/entities/Trip';
import { useCurrentUserId } from '@/core/session/useCurrentUserId';

const NO_TRIPS: Trip[] = [];

export function useMyTripsViewModel(repository: TripRepository) {
  // Each list is stored with the owner it was loaded for, so a list is never
  // shown to a different user: when the owner changes (or goes away) the
  // previous owner's trips are ignored on that very render, not after an effect.
  const [loaded, setLoaded] = useState<{ ownerId?: string; trips: Trip[] }>({
    trips: NO_TRIPS,
  });
  const { userId: ownerId, error } = useCurrentUserId();

  useEffect(() => {
    if (!ownerId) return;
    const newTrips = repository.observeAll(ownerId);
    const sub = newTrips.subscribe((trips) => setLoaded({ ownerId, trips }));
    return () => sub.unsubscribe();
  }, [repository, ownerId]);

  const myTrips = loaded.ownerId === ownerId ? loaded.trips : NO_TRIPS;
  const isLoading = Boolean(ownerId) && loaded.ownerId !== ownerId;
  return { isLoading, error, myTrips };
}
