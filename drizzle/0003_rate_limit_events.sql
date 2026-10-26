CREATE TABLE "rate_limit_events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"scope" text NOT NULL,
	"key_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "rate_limit_events_scope_key_hash_created_at_index" ON "rate_limit_events" USING btree ("scope","key_hash","created_at");