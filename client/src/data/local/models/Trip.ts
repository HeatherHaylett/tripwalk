import { Model } from '@nozbe/watermelondb';
import { field, text, date } from '@nozbe/watermelondb/decorators';
import { SyncStatus } from '../../../domain/entities/Trip';

export class Trip extends Model {
  static table = 'trips'; // must match the table name in database.ts EXACTLY

  @field('trip_id') tripId: string;
  @field('owner_id') ownerId: string;
  @text('trip_name') tripName: string;
  @text('destination') destination: string;
  @field('is_public') isPublic: boolean;
  @date('server_created_at') serverCreatedAt: Date | null;
  @date('client_created_at') clientCreatedAt: Date;
  @field('sync_status') syncState: SyncStatus;
}
