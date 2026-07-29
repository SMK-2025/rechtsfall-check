ALTER TABLE "payments" ADD COLUMN "provider_mode" text DEFAULT 'UNKNOWN' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "invoice_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "invoice_number" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "invoice_status" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "invoice_pdf_url" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "hosted_invoice_url" text;