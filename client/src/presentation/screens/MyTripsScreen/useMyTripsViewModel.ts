import { useEffect, useState } from 'react';
import { TripRepository } from '@/domain/usecases/TripRepository';
import { Trip } from '@/domain/entities/Trip';
import { useCurrentUserId } from '@/core/session/useCurrentUserId';

const NO_TRIPS: Trip[] = [];
const LOAD_FAILED_MESSAGE = 'Could not load your trips.';

export function useMyTripsViewModel(repository: TripRepository) {
  // Both the loaded list and a failure are stored with the owner they belong
  // to, so neither is ever shown to a different user: when the owner changes
  // (or goes away) the previous owner's trips or failure are ignored on that
  // very render, not after an effect.
  const [loaded, setLoaded] = useState<{ ownerId?: string; trips: Trip[] }>({
    trips: NO_TRIPS,
  });
  const [failure, setFailure] = useState<{ ownerId: string } | null>(null);
  const { userId: ownerId, error: userError } = useCurrentUserId();

  useEffect(() => {
    // Clear before the no-owner return, so a failure can't outlive the owner
    // it belonged to and flash when that owner comes back.
    setFailure(null);
    if (!ownerId) return;
    const sub = repository.observeAll(ownerId).subscribe({
      next: (trips) => setLoaded({ ownerId, trips }),
      error: (err) => {
        console.error('Loading trips failed', err);
        setFailure({ ownerId });
      },
    });
    return () => sub.unsubscribe();
  }, [repository, ownerId]);

  const failed = Boolean(ownerId) && failure?.ownerId === ownerId;
  const myTrips = !failed && loaded.ownerId === ownerId ? loaded.trips : NO_TRIPS;
  const isLoading = Boolean(ownerId) && loaded.ownerId !== ownerId && !failed;
  const error = userError || (failed ? LOAD_FAILED_MESSAGE : '');
  return { isLoading, error, myTrips };
}
