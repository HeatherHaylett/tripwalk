import { FlatList, ListRenderItem, StyleSheet, Text, View } from 'react-native';
import { useMyTripsViewModel } from './useMyTripsViewModel';
import { tripRepository } from '@/core/di/appContainer';
import { Trip } from '@/domain/entities/Trip';

const keyExtractor = (item: Trip) => item.tripId;
const renderTripRow: ListRenderItem<Trip> = ({ item }) => {
    return (
        <View>
            <Text>{item.tripName}</Text>
            <Text>{item.destination}</Text>
        </View>
    )
}

export default function MyTrips() {
    const { myTrips } = useMyTripsViewModel(tripRepository);

    return (
        <View style={styles.container}>
            <FlatList
                data={myTrips}
                renderItem={renderTripRow}
                keyExtractor={keyExtractor}
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