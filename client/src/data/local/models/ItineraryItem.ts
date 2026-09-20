import { Model } from '@nozbe/watermelondb';
import { field, text } from '@nozbe/watermelondb/decorators';
import {
  ItemType,
  SyncStatus,
  TimeOfDay,
} from '../../../domain/entities/ItineraryItem';

export class ItineraryItem extends Model {
  static table = 'itinerary_items'; // must match the table name in database.ts EXACTLY

  @field('item_id') itemId!: string;
  @field('trip_id') tripId!: string;
  @text('title') title!: string;
  @field('type') type!: ItemType;
  @text('location') location!: string;
  @text('attachment') attachment!: string | null;
  @field('time_of_day') timeOfDay!: TimeOfDay;
  @field('sync_status') syncState!: SyncStatus;
}
