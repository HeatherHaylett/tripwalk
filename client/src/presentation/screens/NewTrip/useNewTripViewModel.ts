import { useState, useEffect } from 'react';
import { useSessionStore } from '@/core/session/sessionStore';

function useNewTripViewModel() {
  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');

  const ownerId = useSessionStore.getState().userId;

  return {
    tripName: tripName,
    setTripName: () => setTripName(tripName),
    destination: destination,
    setDestination: () => setDestination(destination),
    error: error,
    handleSubmit: () => console.log('handle submit'),
  };
}
