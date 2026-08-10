CREATE TABLE "public_engagement_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"metric_date" text NOT NULL,
	"page_group" text NOT NULL,
	"event_type" text NOT NULL,
	"event_key" text NOT NULL,
	"source" text DEFAULT 'direct' NOT NULL,
	"medium" text DEFAULT 'none' NOT NULL,
	"campaign" text DEFAULT 'none' NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"total_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "public_engagement_metric_dimension_uq" ON "public_engagement_metrics" USING btree ("metric_date","page_group","event_type","event_key","source","medium","campaign");--> statement-breakpoint
CREATE INDEX "public_engagement_metric_date_idx" ON "public_engagement_metrics" USING btree ("metric_date");--> statement-breakpoint
CREATE INDEX "public_engagement_metric_event_idx" ON "public_engagement_metrics" USING btree ("event_type","event_key");