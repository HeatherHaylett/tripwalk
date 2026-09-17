import { boolean, index, pgEnum, pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    userId: uuid('user_id').primaryKey(),
    username: text('username').notNull(),
});

export const trips = pgTable('trips', {
    tripId: uuid('trip_id').primaryKey(),
    ownerId: uuid('owner_id').notNull().references(() => users.userId),
    tripName: text('trip_name').notNull(),
    destination: text('destination').notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    clientCreatedAt: timestamp('client_created_at').notNull(),
    serverCreatedAt: timestamp('server_created_at').defaultNow().notNull()
});

export const itemTypeEnum = pgEnum('item_type', ['flight', 'hotel', 'activity', 'restaurant', 'transport', 'other']);
export const timeOfDayEnum = pgEnum('time_of_day', ['morning', 'afternoon', 'evening']);
export const itineraryItems = pgTable('itinerary_items', {
    itemId: uuid('item_id').primaryKey(),
    tripId: uuid('trip_id').notNull().references(() => trips.tripId),
    title: text('title').notNull(),
    itemType: itemTypeEnum('item_type').notNull(),
    location: text('location').notNull(),
    attachment: text('attachment'),
    timeOfDay: timeOfDayEnum('time_of_day'),
});

export const publicTrips = pgTable('public_trips', {
    tripId: uuid('trip_id').primaryKey().references(() => trips.tripId),
    ownerId: uuid('owner_id').notNull().references(() => users.userId),
    tripName: text('trip_name').notNull(),
    destination: text('destination').notNull(),
    publishedAt: timestamp('published_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
    // /publicTrips cursor pagination sorts on (updatedAt, tripId) — see
    // architecture.md §6/§8. Without this, it degrades to a table scan as
    // the table grows. Don't drop either column from the index.
    index('public_trips_updated_at_trip_id_idx').on(table.updatedAt, table.tripId),
]);

export const bookmarks = pgTable('bookmarks', {
    bookmarkId: uuid('bookmark_id').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.userId),
    publicTripId: uuid('public_trip_id').notNull().references(() => publicTrips.tripId),
    bookmarkedAt: timestamp('bookmarked_at').defaultNow().notNull(),
});