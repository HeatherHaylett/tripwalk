import { TextInput, Button, Text, View } from 'react-native';
import { useNewTripViewModel } from './useNewTripViewModel';
import { tripRepository } from '@/core/di/appContainer';

export default function NewTrip() {
    const { tripName, setTripName, destination, setDestination, error, handleSubmit } =
        useNewTripViewModel(tripRepository);

    return (
        <View>
            <TextInput value={tripName} onChangeText={setTripName} placeholder="Trip name" />
            <TextInput value={destination} onChangeText={setDestination} placeholder="Destination" />
            {error && <Text>{error}</Text>}
            <Button title="Create Trip" onPress={handleSubmit} />
        </View>
    );
}