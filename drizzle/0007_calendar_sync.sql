CREATE TABLE "calendar_busy_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"all_day" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_connection" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"apple_id" text NOT NULL,
	"encrypted_password" text NOT NULL,
	"target_calendar_url" text NOT NULL,
	"busy_calendar_urls" text[] DEFAULT '{}' NOT NULL,
	"last_sync_at" timestamp with time zone,
	"last_error" text,
	"sync_started_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_connection_single" CHECK ("calendar_connection"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "calendar_event_links" (
	"appointment_id" uuid PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"etag" text,
	"synced_start_at" timestamp with time zone NOT NULL,
	"synced_end_at" timestamp with time zone NOT NULL,
	"drift" text,
	"remote_start_at" timestamp with time zone,
	"remote_end_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_event_links" ADD CONSTRAINT "calendar_event_links_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calendar_busy_blocks_start_at_end_at_index" ON "calendar_busy_blocks" USING btree ("start_at","end_at");