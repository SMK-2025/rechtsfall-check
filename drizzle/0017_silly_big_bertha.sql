CREATE TABLE "lawyer_legal_areas" (
	"id" text PRIMARY KEY NOT NULL,
	"lawyer_id" text NOT NULL,
	"legal_area" text NOT NULL,
	"designation_type" text DEFAULT 'ACTIVITY_FOCUS' NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lawyer_matches" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"lawyer_id" text NOT NULL,
	"status" text DEFAULT 'SUGGESTED' NOT NULL,
	"distance_km" integer,
	"matched_legal_area" text NOT NULL,
	"user_consent_at" timestamp with time zone,
	"consent_version" text,
	"consented_data_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"selected_by_user_at" timestamp with time zone,
	"disclosed_at" timestamp with time zone,
	"lawyer_responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lawyer_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"professional_title" text DEFAULT 'Rechtsanwalt' NOT NULL,
	"bar_association" text NOT NULL,
	"official_directory_url" text,
	"admitted_since" timestamp with time zone,
	"firm_name" text NOT NULL,
	"street" text NOT NULL,
	"postal_code" text NOT NULL,
	"city" text NOT NULL,
	"biography" text,
	"website_url" text,
	"public_email" text,
	"public_phone" text,
	"latitude_e6" integer,
	"longitude_e6" integer,
	"practice_radius_km" integer DEFAULT 25 NOT NULL,
	"accepts_new_mandates" boolean DEFAULT false NOT NULL,
	"verification_note" text,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lawyer_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"lawyer_id" text NOT NULL,
	"status" text DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"provider_customer_id" text,
	"provider_subscription_id" text,
	"provider_invoice_id" text,
	"currency" text DEFAULT 'eur' NOT NULL,
	"annual_net_amount_cents" integer DEFAULT 588000 NOT NULL,
	"annual_media_budget_cents" integer DEFAULT 294000 NOT NULL,
	"annual_platform_fee_cents" integer DEFAULT 294000 NOT NULL,
	"vat_rate_basis_points" integer DEFAULT 1900 NOT NULL,
	"term_starts_at" timestamp with time zone,
	"term_ends_at" timestamp with time zone,
	"cancellation_deadline_at" timestamp with time zone,
	"cancellation_requested_at" timestamp with time zone,
	"cancels_at_term_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_role" text DEFAULT 'MEMBER' NOT NULL;--> statement-breakpoint
ALTER TABLE "lawyer_legal_areas" ADD CONSTRAINT "lawyer_legal_areas_lawyer_id_lawyer_profiles_user_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."lawyer_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_matches" ADD CONSTRAINT "lawyer_matches_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_matches" ADD CONSTRAINT "lawyer_matches_lawyer_id_lawyer_profiles_user_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."lawyer_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_profiles" ADD CONSTRAINT "lawyer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_subscriptions" ADD CONSTRAINT "lawyer_subscriptions_lawyer_id_lawyer_profiles_user_id_fk" FOREIGN KEY ("lawyer_id") REFERENCES "public"."lawyer_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lawyer_legal_areas_lawyer_area_uq" ON "lawyer_legal_areas" USING btree ("lawyer_id","legal_area");--> statement-breakpoint
CREATE INDEX "lawyer_legal_areas_area_idx" ON "lawyer_legal_areas" USING btree ("legal_area");--> statement-breakpoint
CREATE UNIQUE INDEX "lawyer_matches_case_lawyer_uq" ON "lawyer_matches" USING btree ("case_id","lawyer_id");--> statement-breakpoint
CREATE INDEX "lawyer_matches_lawyer_status_idx" ON "lawyer_matches" USING btree ("lawyer_id","status");--> statement-breakpoint
CREATE INDEX "lawyer_matches_case_status_idx" ON "lawyer_matches" USING btree ("case_id","status");--> statement-breakpoint
CREATE INDEX "lawyer_profiles_status_idx" ON "lawyer_profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lawyer_profiles_location_idx" ON "lawyer_profiles" USING btree ("latitude_e6","longitude_e6");--> statement-breakpoint
CREATE UNIQUE INDEX "lawyer_subscriptions_provider_subscription_uq" ON "lawyer_subscriptions" USING btree ("provider_subscription_id");--> statement-breakpoint
CREATE INDEX "lawyer_subscriptions_lawyer_status_idx" ON "lawyer_subscriptions" USING btree ("lawyer_id","status");--> statement-breakpoint
CREATE INDEX "lawyer_subscriptions_term_end_idx" ON "lawyer_subscriptions" USING btree ("term_ends_at");