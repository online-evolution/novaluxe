CREATE TYPE "public"."option_kind" AS ENUM('nail_art', 'removal_before_new_set');--> statement-breakpoint
CREATE TYPE "public"."treatment_category" AS ENUM('nails', 'extensions');--> statement-breakpoint
CREATE TYPE "public"."variant_kind" AS ENUM('standard', 'new_set', 'refill');--> statement-breakpoint
CREATE TYPE "public"."block_kind" AS ENUM('break', 'vacation', 'personal', 'other');--> statement-breakpoint
CREATE TYPE "public"."exception_kind" AS ENUM('closed', 'custom_hours');--> statement-breakpoint
CREATE TYPE "public"."appointment_actor" AS ENUM('customer', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."appointment_source" AS ENUM('online', 'admin', 'release');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'no_show', 'expired');--> statement-breakpoint
CREATE TABLE "treatment_option_rules" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"option_id" uuid NOT NULL,
	"treatment_id" uuid NOT NULL,
	"variant_kind" "variant_kind",
	CONSTRAINT "treatment_option_rules_optionId_treatmentId_variantKind_unique" UNIQUE NULLS NOT DISTINCT("option_id","treatment_id","variant_kind")
);
--> statement-breakpoint
CREATE TABLE "treatment_options" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"kind" "option_kind" NOT NULL,
	"name" text NOT NULL,
	"price_cents" integer,
	"price_confirmed" boolean DEFAULT true NOT NULL,
	"duration_minutes" smallint,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "treatment_options_kind_unique" UNIQUE("kind"),
	CONSTRAINT "treatment_options_price_check" CHECK ("treatment_options"."price_cents" >= 0),
	CONSTRAINT "treatment_options_duration_check" CHECK ("treatment_options"."duration_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "treatment_variants" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"treatment_id" uuid NOT NULL,
	"label" text NOT NULL,
	"kind" "variant_kind" DEFAULT 'standard' NOT NULL,
	"length_cm" smallint,
	"weft_rows" smallint,
	"price_cents" integer,
	"duration_minutes" smallint,
	"note" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "treatment_variants_treatmentId_label_kind_lengthCm_weftRows_unique" UNIQUE NULLS NOT DISTINCT("treatment_id","label","kind","length_cm","weft_rows"),
	CONSTRAINT "treatment_variants_price_check" CHECK ("treatment_variants"."price_cents" >= 0),
	CONSTRAINT "treatment_variants_duration_check" CHECK ("treatment_variants"."duration_minutes" > 0),
	CONSTRAINT "treatment_variants_weft_rows_check" CHECK ("treatment_variants"."weft_rows" between 1 and 10)
);
--> statement-breakpoint
CREATE TABLE "treatments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"slug" text NOT NULL,
	"category" "treatment_category" NOT NULL,
	"name" text NOT NULL,
	"summary" text,
	"publicly_bookable" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "treatments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "availability_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"date" date NOT NULL,
	"kind" "exception_kind" NOT NULL,
	"opens_at" time,
	"closes_at" time,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "availability_exceptions_shape_check" CHECK (("availability_exceptions"."kind" = 'closed' and "availability_exceptions"."opens_at" is null and "availability_exceptions"."closes_at" is null)
        or ("availability_exceptions"."kind" = 'custom_hours' and "availability_exceptions"."opens_at" is not null and "availability_exceptions"."closes_at" > "availability_exceptions"."opens_at"))
);
--> statement-breakpoint
CREATE TABLE "blocked_periods" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"kind" "block_kind" DEFAULT 'other' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocked_periods_range_check" CHECK ("blocked_periods"."end_at" > "blocked_periods"."start_at")
);
--> statement-breakpoint
CREATE TABLE "business_hours" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"weekday" smallint NOT NULL,
	"opens_at" time NOT NULL,
	"closes_at" time NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_hours_weekday_check" CHECK ("business_hours"."weekday" between 1 and 7),
	CONSTRAINT "business_hours_range_check" CHECK ("business_hours"."closes_at" > "business_hours"."opens_at")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment_events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"from_status" "appointment_status",
	"to_status" "appointment_status" NOT NULL,
	"actor" "appointment_actor" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointment_options" (
	"appointment_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_cents" integer,
	"duration_minutes" smallint NOT NULL,
	CONSTRAINT "appointment_options_appointment_id_option_id_pk" PRIMARY KEY("appointment_id","option_id")
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"customer_id" uuid NOT NULL,
	"treatment_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone,
	"source" "appointment_source" DEFAULT 'online' NOT NULL,
	"release_id" uuid,
	"treatment_name" text NOT NULL,
	"variant_label" text NOT NULL,
	"price_cents" integer,
	"duration_minutes" smallint NOT NULL,
	"nail_art_requested" boolean DEFAULT false NOT NULL,
	"nail_art_description" text,
	"customer_notes" text,
	"internal_notes" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointments_range_check" CHECK ("appointments"."end_at" > "appointments"."start_at"),
	CONSTRAINT "appointments_pending_expiry_check" CHECK ("appointments"."status" <> 'pending' or ("appointments"."expires_at" is not null and "appointments"."expires_at" <= "appointments"."start_at")),
	CONSTRAINT "appointments_nail_art_check" CHECK ("appointments"."nail_art_requested" or "appointments"."nail_art_description" is null)
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"internal_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "extension_releases" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"customer_id" uuid NOT NULL,
	"consult_appointment_id" uuid,
	"variant_id" uuid NOT NULL,
	"price_cents" integer NOT NULL,
	"duration_minutes" smallint NOT NULL,
	"colour_notes" text,
	"deposit_cents" integer,
	"deposit_paid_at" timestamp with time zone,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "extension_releases_tokenHash_unique" UNIQUE("token_hash"),
	CONSTRAINT "extension_releases_price_check" CHECK ("extension_releases"."price_cents" >= 0),
	CONSTRAINT "extension_releases_duration_check" CHECK ("extension_releases"."duration_minutes" > 0)
);
--> statement-breakpoint
ALTER TABLE "treatment_option_rules" ADD CONSTRAINT "treatment_option_rules_option_id_treatment_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."treatment_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_option_rules" ADD CONSTRAINT "treatment_option_rules_treatment_id_treatments_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment_variants" ADD CONSTRAINT "treatment_variants_treatment_id_treatments_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_events" ADD CONSTRAINT "appointment_events_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_options" ADD CONSTRAINT "appointment_options_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_options" ADD CONSTRAINT "appointment_options_option_id_treatment_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."treatment_options"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_treatment_id_treatments_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_variant_id_treatment_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."treatment_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_release_id_extension_releases_id_fk" FOREIGN KEY ("release_id") REFERENCES "public"."extension_releases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extension_releases" ADD CONSTRAINT "extension_releases_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extension_releases" ADD CONSTRAINT "extension_releases_consult_appointment_id_appointments_id_fk" FOREIGN KEY ("consult_appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extension_releases" ADD CONSTRAINT "extension_releases_variant_id_treatment_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."treatment_variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "treatment_variants_treatment_id_sort_order_index" ON "treatment_variants" USING btree ("treatment_id","sort_order");--> statement-breakpoint
CREATE INDEX "treatments_category_sort_order_index" ON "treatments" USING btree ("category","sort_order");--> statement-breakpoint
CREATE INDEX "availability_exceptions_date_index" ON "availability_exceptions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "blocked_periods_start_at_end_at_index" ON "blocked_periods" USING btree ("start_at","end_at");--> statement-breakpoint
CREATE INDEX "business_hours_weekday_index" ON "business_hours" USING btree ("weekday");--> statement-breakpoint
CREATE INDEX "appointment_events_appointment_id_created_at_index" ON "appointment_events" USING btree ("appointment_id","created_at");--> statement-breakpoint
CREATE INDEX "appointments_start_at_index" ON "appointments" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "appointments_status_start_at_index" ON "appointments" USING btree ("status","start_at");--> statement-breakpoint
CREATE INDEX "appointments_customer_id_index" ON "appointments" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_email_unique" ON "customers" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "extension_releases_customer_id_index" ON "extension_releases" USING btree ("customer_id");