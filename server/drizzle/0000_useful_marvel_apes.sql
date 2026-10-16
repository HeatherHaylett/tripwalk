CREATE TYPE "public"."item_type" AS ENUM('flight', 'hotel', 'activity', 'restaurant', 'transport', 'other');--> statement-breakpoint
CREATE TYPE "public"."time_of_day" AS ENUM('morning', 'afternoon', 'evening');--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"bookmark_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"public_trip_id" uuid NOT NULL,
	"bookmarked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itinerary_items" (
	"item_id" uuid PRIMARY KEY NOT NULL,
	"trip_id" uuid NOT NULL,
	"title" text NOT NULL,
	"item_type" "item_type" NOT NULL,
	"location" text NOT NULL,
	"attachment" text,
	"time_of_day" time_of_day
);
--> statement-breakpoint
CREATE TABLE "public_trips" (
	"trip_id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"trip_name" text NOT NULL,
	"destination" text NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"trip_id" uuid PRIMARY KEY NOT NULL,
	"owner_id" uuid NOT NULL,
	"trip_name" text NOT NULL,
	"destination" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"client_created_at" timestamp NOT NULL,
	"server_created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"username" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_public_trip_id_public_trips_trip_id_fk" FOREIGN KEY ("public_trip_id") REFERENCES "public"."public_trips"("trip_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_trip_id_trips_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("trip_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_trips" ADD CONSTRAINT "public_trips_trip_id_trips_trip_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("trip_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_trips" ADD CONSTRAINT "public_trips_owner_id_users_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_owner_id_users_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "public_trips_updated_at_trip_id_idx" ON "public_trips" USING btree ("updated_at","trip_id");