UPDATE "cases" SET "legal_area" = 'consumer_purchase' WHERE "legal_area" = 'consumer_purchase_dummy';
ALTER TABLE "cases" ALTER COLUMN "legal_area" SET DEFAULT 'other_unsure';
