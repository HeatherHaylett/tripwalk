// Plain TS types only — no WatermelonDB or network dependency in this file.
// See architecture.md §6 for the full field-by-field reasoning behind this shape.

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface Trip {
  tripId: string; // client-generated UUID — see architecture.md §5 (idempotent creates)
  ownerId: string;
  tripName: string;
  destination: string;
  isPublic: boolean;
  clientCreatedAt: number;
  serverCreatedAt: number | null; // null until the server has confirmed it
  syncStatus: SyncStatus; // client-only, never sent to the server
}

export interface NewTripInput {
  tripName: string;
  destination: string;
}
