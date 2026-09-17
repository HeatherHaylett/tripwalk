export type ItemType =
  | 'flight'
  | 'hotel'
  | 'activity'
  | 'restaurant'
  | 'transport'
  | 'other';

// null = unsorted collection (Pinterest-card default). The user can
// optionally drag a card into a slot — see PRD.md user story #2 and
// architecture.md §6 for why this is nullable rather than required.
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | null;

export interface ItineraryItem {
  itemId: string; // client-generated UUID
  tripId: string;
  title: string;
  type: ItemType;
  location: string;
  attachment: string | null; // a URL only — never a file/blob, see architecture.md §5
  timeOfDay: TimeOfDay;
  syncStatus: 'pending' | 'synced' | 'failed'; // client-only
}

export interface NewItineraryItemInput {
  tripId: string;
  title: string;
  type: ItemType;
  location: string;
  attachment?: string;
  timeOfDay?: TimeOfDay;
}
