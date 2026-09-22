import { useState } from 'react';
import { useSessionStore } from '@/core/session/sessionStore';
import { TripRepository } from '@/domain/usecases/TripRepository';
import { createTrip } from '@/domain/usecases/createTrip';
import { NewTripInput } from '@/domain/entities/Trip';

export function useNewTripViewModel(repository: TripRepository) {
  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');

  const ownerId = useSessionStore.getState().userId;

  async function onSubmit() {
    const tripInput: NewTripInput = {
      tripName,
      destination,
    };
    try {
      await createTrip(repository, tripInput, ownerId);
    } catch (error: any) {
      setError(error.message);
      console.error('Create trip failed', error);
    }
  }

  return {
    tripName,
    setTripName,
    destination,
    setDestination,
    error,
    handleSubmit: onSubmit,
  };
}
