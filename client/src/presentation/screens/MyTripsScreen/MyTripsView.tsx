import { ActivityIndicator, FlatList, ListRenderItem, StyleSheet, Text, View } from 'react-native';
import { Trip } from '@/domain/entities/Trip';

const keyExtractor = (item: Trip) => item.tripId;
const renderTripRow: ListRenderItem<Trip> = ({ item }) => {
  return (
    <View>
      <Text>{item.tripName}</Text>
      <Text>{item.destination}</Text>
    </View>
  );
};

const emptyList = () => {
  return (
    <View>
      <Text>You don't have any trips yet.</Text>
    </View>
  )
}

interface MyTripsViewProps {
  trips: Trip[];
  error: string;
  loading: boolean;
}

// Pure rendering: everything arrives through props, so it can be rendered in a
// test or a preview without a repository or database.
export function MyTripsView({ trips, error, loading }: MyTripsViewProps) {
  return (
    <View style={styles.container}>
      {error ? <Text testID="my-trips-error">{error}</Text> : null}
      {loading ? <ActivityIndicator accessibilityLabel="Loading trips" /> : null}
      <FlatList
        data={trips}
        renderItem={renderTripRow}
        keyExtractor={keyExtractor}
        ListEmptyComponent={!loading && !error ? emptyList : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 200,
  },
});
