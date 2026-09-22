CREATE EXTENSION IF NOT EXISTS vector;

DO $$ BEGIN
  CREATE TYPE "KnowledgeDocumentStatus" AS ENUM ('UPLOADED', 'QUEUED', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "KnowledgeDocument"
  ADD COLUMN IF NOT EXISTS "originalFilename" TEXT,
  ADD COLUMN IF NOT EXISTS "status" "KnowledgeDocumentStatus" NOT NULL DEFAULT 'UPLOADED',
  ADD COLUMN IF NOT EXISTS "storageKey" TEXT,
  ADD COLUMN IF NOT EXISTS "sizeBytes" INTEGER,
  ADD COLUMN IF NOT EXISTS "processingError" TEXT,
  ADD COLUMN IF NOT EXISTS "uploadedByUserId" UUID;

CREATE INDEX IF NOT EXISTS "KnowledgeDocument_status_idx"
  ON "KnowledgeDocument"("status");

CREATE INDEX IF NOT EXISTS "KnowledgeDocument_projectId_idx"
  ON "KnowledgeDocument"("projectId");

CREATE INDEX IF NOT EXISTS "DocumentChunk_embedding_hnsw_idx"
  ON "DocumentChunk" USING hnsw ("embedding" vector_cosine_ops)
  WHERE "embedding" IS NOT NULL AND "deletedAt" IS NULL;
