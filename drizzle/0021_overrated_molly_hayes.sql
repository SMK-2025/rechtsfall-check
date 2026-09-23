DROP INDEX "public_engagement_metric_dimension_uq";--> statement-breakpoint
ALTER TABLE "public_engagement_metrics" ADD COLUMN "campaign_id" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "public_engagement_metrics" ADD COLUMN "content" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "public_engagement_metric_dimension_uq" ON "public_engagement_metrics" USING btree ("metric_date","page_group","event_type","event_key","source","medium","campaign","campaign_id","content");
