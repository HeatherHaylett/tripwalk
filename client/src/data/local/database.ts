import { appSchema, tableSchema } from '@nozbe/watermelondb';

// Mirrors the server schema in architecture.md §6, with one addition:
// syncStatus exists ONLY on the client (trips, itineraryItems) and is never
// sent to the server — see CLAUDE.md invariant #7.

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'trips',
      columns: [
        { name: 'trip_id', type: 'string', isIndexed: true }, // client-generated UUID
        { name: 'owner_id', type: 'string' },
        { name: 'trip_name', type: 'string' },
        { name: 'destination', type: 'string' },
        { name: 'is_public', type: 'boolean' },
        { name: 'client_created_at', type: 'number' },
        { name: 'server_created_at', type: 'number', isOptional: true },
        { name: 'sync_status', type: 'string' }, // 'pending' | 'synced' | 'failed'
      ],
    }),
    tableSchema({
      name: 'itinerary_items',
      columns: [
        { name: 'item_id', type: 'string', isIndexed: true },
        { name: 'trip_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'location', type: 'string' },
        { name: 'attachment', type: 'string', isOptional: true },
        { name: 'time_of_day', type: 'string', isOptional: true }, // null = unsorted
        { name: 'sync_status', type: 'string' },
      ],
    }),
    // Browse-feed LRU fallback cache (last 10-20 viewed) — architecture.md §7
    tableSchema({
      name: 'public_trips_cache',
      columns: [
        { name: 'trip_id', type: 'string', isIndexed: true },
        { name: 'owner_id', type: 'string' },
        { name: 'trip_name', type: 'string' },
        { name: 'destination', type: 'string' },
        { name: 'updated_at', type: 'number' },
        { name: 'last_viewed_at', type: 'number' }, // drives LRU eviction
      ],
    }),
    // Eagerly cached in full at bookmark-time — architecture.md §7
    tableSchema({
      name: 'bookmarks',
      columns: [
        { name: 'bookmark_id', type: 'string', isIndexed: true },
        { name: 'public_trip_id', type: 'string', isIndexed: true },
        { name: 'bookmarked_at', type: 'number' },
      ],
    }),
    // Referential outbox queue — architecture.md §5. Collapses to latest
    // state per entity; entries are ID + change type, not full payloads.
    tableSchema({
      name: 'outbox_entries',
      columns: [
        { name: 'entity_type', type: 'string' }, // 'trip' | 'itineraryItem'
        { name: 'entity_id', type: 'string', isIndexed: true },
        { name: 'change_type', type: 'string' }, // 'create' | 'update' | 'delete'
        { name: 'attempt_count', type: 'number' }, // caps at 3 — see architecture.md §5
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
