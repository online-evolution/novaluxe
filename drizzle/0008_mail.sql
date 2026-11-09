CREATE TABLE "mail_connection" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"address" text NOT NULL,
	"encrypted_password" text NOT NULL,
	"notify_address" text,
	"last_sent_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mail_connection_single" CHECK ("mail_connection"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "mail_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"kind" text NOT NULL,
	"appointment_id" uuid,
	"contact_message_id" uuid,
	"status" text DEFAULT 'wachtend' NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mail_messages" ADD CONSTRAINT "mail_messages_contact_message_id_contact_messages_id_fk" FOREIGN KEY ("contact_message_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mail_messages_appointment_id_index" ON "mail_messages" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "mail_messages_status_created_at_index" ON "mail_messages" USING btree ("status","created_at");