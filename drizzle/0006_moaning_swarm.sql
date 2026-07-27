ALTER TABLE "documents" ADD COLUMN "extraction_json" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "required" boolean DEFAULT true NOT NULL;