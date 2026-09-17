import { View, Text } from 'react-native';

// Placeholder root component. Real navigation/screens wiring (MyTripsScreen,
// TripDetailScreen, BrowseScreen, BookmarksScreen) is not built yet - see
// README.md "Status" for what exists so far.
export default function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Tripwalk</Text>
    </View>
  );
}
