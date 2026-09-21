import { Model } from '@nozbe/watermelondb';
import { date, field } from '@nozbe/watermelondb/decorators';

export class Bookmark extends Model {
  static table = 'bookmarks';

  @field('bookmark_id') bookmarkId: string;
  @field('public_trip_id') publicTripId: string;
  @date('bookmarked_at') bookmarkedAt: Date;
}
