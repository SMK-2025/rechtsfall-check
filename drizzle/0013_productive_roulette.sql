CREATE TABLE "public_page_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"metric_date" text NOT NULL,
	"page_group" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "public_page_metrics_date_group_uq" ON "public_page_metrics" USING btree ("metric_date","page_group");--> statement-breakpoint
CREATE INDEX "public_page_metrics_date_idx" ON "public_page_metrics" USING btree ("metric_date");