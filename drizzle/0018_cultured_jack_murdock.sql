CREATE TABLE "lawyer_match_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"match_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"sender_role" text NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lawyer_subscriptions" ADD COLUMN "provider_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "lawyer_match_messages" ADD CONSTRAINT "lawyer_match_messages_match_id_lawyer_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."lawyer_matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_match_messages" ADD CONSTRAINT "lawyer_match_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lawyer_match_messages_match_created_idx" ON "lawyer_match_messages" USING btree ("match_id","created_at");--> statement-breakpoint
CREATE INDEX "lawyer_match_messages_sender_idx" ON "lawyer_match_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lawyer_subscriptions_provider_checkout_uq" ON "lawyer_subscriptions" USING btree ("provider_checkout_session_id");