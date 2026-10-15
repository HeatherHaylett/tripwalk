import { render, screen } from '@testing-library/react-native';
import { Trip } from '@/domain/entities/Trip';
import { MyTripsView } from './MyTripsView';

const EMPTY_MESSAGE = "You don't have any trips yet.";
const LOADING_LABEL = 'Loading trips';

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

  await render(<MyTripsView trips={trips} error="" loading={false} />);

  expect(screen.getByText('First Trip')).toBeTruthy();
  expect(screen.getByText('Tokyo')).toBeTruthy();
  expect(screen.getByText('Second Trip')).toBeTruthy();
  expect(screen.getByText('Rome')).toBeTruthy();
});

test('renders the error message when there is one', async () => {
  await render(
    <MyTripsView trips={[]} error="No user is set." loading={false} />,
  );

  expect(screen.getByRole('alert')).toHaveTextContent('No user is set.');
});

test('renders no error element when there is no error', async () => {
  await render(<MyTripsView trips={[]} error="" loading={false} />);

  // Any error message is rendered as an alert, so its absence rules out every
  // message, not just one particular string.
  expect(screen.queryByRole('alert')).toBeNull();
});

describe('loading state', () => {
  test('shows a loading indicator while loading', async () => {
    await render(<MyTripsView trips={[]} error="" loading={true} />);

    expect(screen.getByRole('progressbar', { name: LOADING_LABEL })).toBeTruthy();
  });

  test('does not show a loading indicator once loaded', async () => {
    await render(<MyTripsView trips={[]} error="" loading={false} />);

    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});

describe('empty state', () => {
  test('shows the empty message when loaded with no trips and no error', async () => {
    await render(<MyTripsView trips={[]} error="" loading={false} />);

    expect(screen.getByText(EMPTY_MESSAGE)).toBeTruthy();
  });

  test('does not show the empty message while loading', async () => {
    await render(<MyTripsView trips={[]} error="" loading={true} />);

    expect(screen.queryByText(EMPTY_MESSAGE)).toBeNull();
  });

  test('does not show the empty message when there is an error', async () => {
    await render(
      <MyTripsView
        trips={[]}
        error="Could not load your trips."
        loading={false}
      />,
    );

    expect(screen.queryByText(EMPTY_MESSAGE)).toBeNull();
  });

  test('does not show the empty message when there are trips', async () => {
    await render(
      <MyTripsView trips={[makeTrip({})]} error="" loading={false} />,
    );

    expect(screen.queryByText(EMPTY_MESSAGE)).toBeNull();
  });
});
