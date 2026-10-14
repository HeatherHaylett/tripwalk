import { render, screen } from '@testing-library/react-native';
import { Trip } from '@/domain/entities/Trip';
import { MyTripsView } from './MyTripsView';

function makeTrip(overrides: Partial<Trip>): Trip {
  return {
    tripId: 'trip-1',
    ownerId: 'owner-a',
    tripName: 'First Trip',
    destination: 'Tokyo',
    isPublic: false,
    clientCreatedAt: 0,
    serverCreatedAt: null,
    syncStatus: 'pending',
    ...overrides,
  };
}

test('renders each trip name and destination', async () => {
  const trips = [
    makeTrip({ tripId: 'trip-1', tripName: 'First Trip', destination: 'Tokyo' }),
    makeTrip({ tripId: 'trip-2', tripName: 'Second Trip', destination: 'Rome' }),
  ];

  await render(<MyTripsView trips={trips} error="" />);

  expect(screen.getByText('First Trip')).toBeTruthy();
  expect(screen.getByText('Tokyo')).toBeTruthy();
  expect(screen.getByText('Second Trip')).toBeTruthy();
  expect(screen.getByText('Rome')).toBeTruthy();
});

test('renders the error message when there is one', async () => {
  await render(<MyTripsView trips={[]} error="No user is set." />);

  expect(screen.getByTestId('my-trips-error')).toHaveTextContent(
    'No user is set.',
  );
});

test('renders no error element when there is no error', async () => {
  await render(<MyTripsView trips={[]} error="" />);

  // Any error text would live in this element, so its absence rules out every
  // message, not just one particular string.
  expect(screen.queryByTestId('my-trips-error')).toBeNull();
});
