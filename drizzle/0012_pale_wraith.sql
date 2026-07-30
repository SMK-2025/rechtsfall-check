CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"review_type" text NOT NULL,
	"rating" integer NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"display_mode" text DEFAULT 'FIRST_NAME_INITIAL' NOT NULL,
	"display_name" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"publication_consent_at" timestamp with time zone NOT NULL,
	"moderated_by" text,
	"moderated_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_owner_type_uq" ON "reviews" USING btree ("owner_id","review_type");--> statement-breakpoint
CREATE INDEX "reviews_status_published_idx" ON "reviews" USING btree ("status","published_at");