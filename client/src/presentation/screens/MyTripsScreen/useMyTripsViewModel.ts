import { useEffect, useState } from 'react';
import { TripRepository } from '@/domain/usecases/TripRepository';
import { deleteTrip } from '@/domain/usecases/deleteTrip';
import { Trip } from '@/domain/entities/Trip';
import { useCurrentUserId } from '@/core/session/useCurrentUserId';

const NO_TRIPS: Trip[] = [];
const LOAD_FAILED_MESSAGE = 'Could not load your trips.';
const DELETE_FAILED_MESSAGE = 'Could not delete the trip. Please try again.';

export function useMyTripsViewModel(repository: TripRepository) {
  // Both the loaded list and a failure are stored with the owner they belong
  // to, so neither is ever shown to a different user: when the owner changes
  // (or goes away) the previous owner's trips or failure are ignored on that
  // very render, not after an effect.
  const [loaded, setLoaded] = useState<{ ownerId?: string; trips: Trip[] }>({
    trips: NO_TRIPS,
  });
  const [failure, setFailure] = useState<{ ownerId: string } | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
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

  function requestDelete(tripId: string) {
    setDeleteError('');
    setPendingRemoval(tripId);
  }

  // Resolves even when the delete fails: the failure is reported through
  // `deleteError` (not `error`, which replaces the list) and the row stays.
  async function confirmDelete() {
    if (!pendingRemoval) return;
    try {
      await deleteTrip(repository, pendingRemoval);
    } catch (err) {
      console.error('Deleting trip failed', err);
      setDeleteError(DELETE_FAILED_MESSAGE);
    } finally {
      setPendingRemoval(null);
    }
  }

  function cancelDelete() {
    setPendingRemoval(null);
  }

  const failed = Boolean(ownerId) && failure?.ownerId === ownerId;
  const myTrips =
    !failed && loaded.ownerId === ownerId ? loaded.trips : NO_TRIPS;
  const isLoading = Boolean(ownerId) && loaded.ownerId !== ownerId && !failed;
  const error = userError || (failed ? LOAD_FAILED_MESSAGE : '');
  return {
    isLoading,
    error,
    myTrips,
    cancelDelete,
    confirmDelete,
    requestDelete,
    pendingRemoval,
    deleteError,
  };
}
