ALTER TABLE "cases" ALTER COLUMN "product_code" SET DEFAULT 'CASE_CHECK_19';--> statement-breakpoint
UPDATE "cases" SET "product_code" = 'CASE_CHECK_19' WHERE "payment_status" <> 'PAID' AND "product_code" = 'CASE_CHECK_39';
