CREATE TYPE "public"."gallery_kind" AS ENUM('photo', 'before_after');--> statement-breakpoint
CREATE TYPE "public"."photo_focus" AS ENUM('top', 'center', 'bottom');--> statement-breakpoint
CREATE TABLE "gallery_items" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"kind" "gallery_kind" NOT NULL,
	"image_id" uuid NOT NULL,
	"before_image_id" uuid,
	"category" "treatment_category",
	"caption" text,
	"alt" text,
	"focus" "photo_focus" DEFAULT 'center' NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_items_before_check" CHECK (("gallery_items"."kind" = 'before_after') = ("gallery_items"."before_image_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"storage_key" text NOT NULL,
	"url" text NOT NULL,
	"width" smallint NOT NULL,
	"height" smallint NOT NULL,
	"bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "images_storageKey_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "site_photos" (
	"shot" text PRIMARY KEY NOT NULL,
	"image_id" uuid NOT NULL,
	"alt" text,
	"focus" "photo_focus" DEFAULT 'center' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_before_image_id_images_id_fk" FOREIGN KEY ("before_image_id") REFERENCES "public"."images"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_photos" ADD CONSTRAINT "site_photos_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gallery_items_kind_published_sort_order_index" ON "gallery_items" USING btree ("kind","published","sort_order");