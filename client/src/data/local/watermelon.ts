import { Platform } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema } from './schema';
import { Bookmark } from './models/Bookmark';
import { ItineraryItem } from './models/ItineraryItem';
import { OutboxEntry } from './models/OutboxEntry';
import { PublicTripsCache } from './models/PublicTripsCache';
import { Trip } from './models/Trip';
import type { DatabaseAdapter } from '@nozbe/watermelondb/adapters/type';

export const createSQLiteAdapter = () => {
  return new SQLiteAdapter({
    schema,
    dbName: 'tripwalk',
    jsi: Platform.OS === 'ios',
    onSetUpError: (error) => {
      console.error('Watermelon DB setup failed', error);
    },
  });
};

export const createDatabase = (adapter: DatabaseAdapter) => {
  return new Database({
    adapter,
    modelClasses: [
      Bookmark,
      ItineraryItem,
      OutboxEntry,
      PublicTripsCache,
      Trip,
    ],
  });
};
