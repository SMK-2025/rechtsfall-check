CREATE TABLE "api_rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rateLimit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"lastRequest" bigint NOT NULL
);
--> statement-breakpoint
CREATE INDEX "api_rate_limits_expires_idx" ON "api_rate_limits" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "auth_rate_limit_key_idx" ON "rateLimit" USING btree ("key");