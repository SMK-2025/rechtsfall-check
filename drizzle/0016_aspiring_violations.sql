CREATE TABLE "email_delivery_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_event_id" text NOT NULL,
	"provider_message_id" text,
	"case_id" text,
	"email_kind" text,
	"event_type" text NOT NULL,
	"event_at" timestamp with time zone NOT NULL,
	"url" text,
	"reason" text,
	"response" text,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_delivery_events" ADD CONSTRAINT "email_delivery_events_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_delivery_events_provider_event_uq" ON "email_delivery_events" USING btree ("provider_event_id");--> statement-breakpoint
CREATE INDEX "email_delivery_events_case_event_idx" ON "email_delivery_events" USING btree ("case_id","event_at");--> statement-breakpoint
CREATE INDEX "email_delivery_events_message_idx" ON "email_delivery_events" USING btree ("provider_message_id");