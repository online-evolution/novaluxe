CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"message" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_messages_reachable" CHECK ("contact_messages"."email" is not null or "contact_messages"."phone" is not null)
);
--> statement-breakpoint
CREATE INDEX "contact_messages_created_at_index" ON "contact_messages" USING btree ("created_at");