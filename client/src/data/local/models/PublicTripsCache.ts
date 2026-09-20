import { Model } from '@nozbe/watermelondb';
import { field, text, date } from '@nozbe/watermelondb/decorators';

export class PublicTripsCache extends Model {
  static table = 'public_trips_cache'; // must match the table name in database.ts EXACTLY

  @field('trip_id') tripId!: string;
  @field('owner_id') ownerId!: string;
  @text('trip_name') tripName!: string;
  @text('destination') destination!: string;
  @date('updated_at') updatedAt!: Date;
  @date('last_viewed_at') lastViewedAt!: Date;
}
