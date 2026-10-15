import { useMyTripsViewModel } from './useMyTripsViewModel';
import { MyTripsView } from './MyTripsView';
import { tripRepository } from '@/core/di/appContainer';

// Wires the viewmodel (and the real repository) to the pure view.
export default function MyTrips() {
    const { myTrips, error, isLoading } = useMyTripsViewModel(tripRepository);

    return <MyTripsView trips={myTrips} error={error} loading={isLoading} />;
}
