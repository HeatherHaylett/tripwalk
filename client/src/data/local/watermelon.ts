import { Platform } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './database';
import { Bookmark } from './models/Bookmark';
import { ItineraryItem } from './models/ItineraryItem';
import { OutboxEntry } from './models/OutboxEntry';
import { PublicTripsCache } from './models/PublicTripsCache';
import { Trip } from './models/Trip';

// First, create the adapter to the underlying database:
const adapter = new SQLiteAdapter({
  schema,
  dbName: 'tripwalk',
  jsi: Platform.OS === 'ios',
  onSetUpError: (error) => {
    console.error('Watermelon DB setup failed', error);
  },
});

// Then, make a Watermelon database from it!
export const database = new Database({
  adapter,
  modelClasses: [Bookmark, ItineraryItem, OutboxEntry, PublicTripsCache, Trip],
});
