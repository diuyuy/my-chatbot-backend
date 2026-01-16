DROP INDEX "idx_document_resources_name";--> statement-breakpoint
CREATE INDEX "idx_document_resources_name_trgm" ON "document_resources" USING gin ("name" gin_trgm_ops);