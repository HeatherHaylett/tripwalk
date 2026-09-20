import { Model } from '@nozbe/watermelondb';
import { date, field } from '@nozbe/watermelondb/decorators';

export class OutboxEntry extends Model {
  static table = 'outbox_entries';

  @field('entity_type') entityType!: 'trip' | 'itineraryItem';
  @field('entity_id') entityId!: string;
  @field('change_type') changeType!: 'create' | 'update' | 'delete';
  @field('attempt_count') attemptCount!: number;
  @date('created_at') createdAt!: Date;
}
