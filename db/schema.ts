import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable("users", {
  id: text("id").primaryKey(), email: text("email").notNull(), displayName: text("display_name"), ...timestamps,
}, (table) => [uniqueIndex("users_email_uq").on(table.email)]);
export const cases = pgTable("cases", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull().references(() => users.id),
  legalArea: text("legal_area").notNull().default("consumer_purchase_dummy"),
  status: text("status").notNull().default("DRAFT"), title: text("title").notNull(),
  retentionUntil: timestamp("retention_until", { withTimezone: true }), ...timestamps,
}, (table) => [index("cases_owner_updated_idx").on(table.ownerId, table.updatedAt)]);
export const documents = pgTable("documents", {
  id: text("id").primaryKey(), caseId: text("case_id").notNull().references(() => cases.id),
  objectKey: text("object_key").notNull(), originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(), sizeBytes: integer("size_bytes").notNull(),
  sha256: text("sha256").notNull(), scanStatus: text("scan_status").notNull().default("PENDING"),
  extractionStatus: text("extraction_status").notNull().default("PENDING"), ...timestamps,
}, (table) => [index("documents_case_idx").on(table.caseId)]);
export const facts = pgTable("facts", {
  id: text("id").primaryKey(), caseId: text("case_id").notNull().references(() => cases.id),
  predicate: text("predicate").notNull(), value: text("value").notNull(),
  status: text("status").notNull().default("UNVERIFIED"), confidence: integer("confidence").notNull().default(0), ...timestamps,
}, (table) => [index("facts_case_idx").on(table.caseId)]);
export const evidenceLinks = pgTable("evidence_links", {
  id: text("id").primaryKey(), factId: text("fact_id").notNull().references(() => facts.id),
  documentId: text("document_id").notNull().references(() => documents.id), page: integer("page"), quote: text("quote"), ...timestamps,
});
export const questions = pgTable("questions", {
  id: text("id").primaryKey(), caseId: text("case_id").notNull().references(() => cases.id),
  questionKey: text("question_key").notNull(), prompt: text("prompt").notNull(), answer: text("answer"),
  status: text("status").notNull().default("OPEN"), ...timestamps,
}, (table) => [index("questions_case_idx").on(table.caseId)]);
export const assessments = pgTable("assessments", {
  id: text("id").primaryKey(), caseId: text("case_id").notNull().references(() => cases.id),
  version: integer("version").notNull(), decision: text("decision").notNull(),
  payloadJson: jsonb("payload_json").notNull(), legalContentVersion: text("legal_content_version").notNull(), ...timestamps,
}, (table) => [uniqueIndex("assessments_case_version_uq").on(table.caseId, table.version)]);
export const auditEvents = pgTable("audit_events", {
  id: text("id").primaryKey(), caseId: text("case_id"), actorId: text("actor_id"),
  eventType: text("event_type").notNull(), targetType: text("target_type"), targetId: text("target_id"),
  metadataJson: jsonb("metadata_json").notNull().default({}), ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("audit_case_created_idx").on(table.caseId, table.createdAt)]);
