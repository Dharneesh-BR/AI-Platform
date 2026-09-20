ALTER TABLE "AgentRun"
  ADD COLUMN IF NOT EXISTS "organizationId" UUID,
  ADD COLUMN IF NOT EXISTS "businessAgentId" UUID,
  ADD COLUMN IF NOT EXISTS "conversationId" UUID,
  ADD COLUMN IF NOT EXISTS "agentSlug" TEXT,
  ADD COLUMN IF NOT EXISTS "input" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "finalOutput" JSONB,
  ADD COLUMN IF NOT EXISTS "totalTokens" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "estimatedCostUsd" DECIMAL(12, 6),
  ADD COLUMN IF NOT EXISTS "failedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "BusinessAgentProfile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "organizationId" UUID,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "description" TEXT,
  "systemInstructions" TEXT NOT NULL,
  "capabilities" JSONB NOT NULL DEFAULT '[]',
  "allowedSpecialists" JSONB NOT NULL DEFAULT '[]',
  "allowedTools" JSONB NOT NULL DEFAULT '[]',
  "knowledgeScopes" JSONB NOT NULL DEFAULT '[]',
  "modelPolicy" JSONB NOT NULL DEFAULT '{}',
  "verificationPolicy" JSONB NOT NULL DEFAULT '{}',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  "createdBy" UUID,
  "updatedBy" UUID
);

CREATE TABLE IF NOT EXISTS "AgentStep" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "agentRunId" UUID NOT NULL,
  "node" TEXT NOT NULL,
  "specialist" TEXT,
  "status" "AiExecutionStatus" NOT NULL DEFAULT 'QUEUED',
  "model" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "tokenUsage" JSONB NOT NULL DEFAULT '{}',
  "costUsd" DECIMAL(12, 6),
  "error" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  "createdBy" UUID,
  "updatedBy" UUID
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentRun_organizationId_fkey') THEN
    ALTER TABLE "AgentRun"
      ADD CONSTRAINT "AgentRun_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentRun_businessAgentId_fkey') THEN
    ALTER TABLE "AgentRun"
      ADD CONSTRAINT "AgentRun_businessAgentId_fkey"
      FOREIGN KEY ("businessAgentId") REFERENCES "BusinessAgentProfile"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentRun_conversationId_fkey') THEN
    ALTER TABLE "AgentRun"
      ADD CONSTRAINT "AgentRun_conversationId_fkey"
      FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BusinessAgentProfile_organizationId_fkey') THEN
    ALTER TABLE "BusinessAgentProfile"
      ADD CONSTRAINT "BusinessAgentProfile_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentStep_agentRunId_fkey') THEN
    ALTER TABLE "AgentStep"
      ADD CONSTRAINT "AgentStep_agentRunId_fkey"
      FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "BusinessAgentProfile_system_slug_key"
  ON "BusinessAgentProfile"("slug") WHERE "organizationId" IS NULL AND "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "BusinessAgentProfile_org_slug_key"
  ON "BusinessAgentProfile"("organizationId", "slug") WHERE "organizationId" IS NOT NULL AND "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS "BusinessAgentProfile_slug_enabled_idx" ON "BusinessAgentProfile"("slug", "enabled");
CREATE INDEX IF NOT EXISTS "BusinessAgentProfile_organizationId_enabled_idx" ON "BusinessAgentProfile"("organizationId", "enabled");
CREATE INDEX IF NOT EXISTS "BusinessAgentProfile_deletedAt_idx" ON "BusinessAgentProfile"("deletedAt");
CREATE INDEX IF NOT EXISTS "AgentRun_organizationId_status_idx" ON "AgentRun"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "AgentRun_businessAgentId_idx" ON "AgentRun"("businessAgentId");
CREATE INDEX IF NOT EXISTS "AgentRun_conversationId_idx" ON "AgentRun"("conversationId");
CREATE INDEX IF NOT EXISTS "AgentStep_agentRunId_node_idx" ON "AgentStep"("agentRunId", "node");
CREATE INDEX IF NOT EXISTS "AgentStep_status_idx" ON "AgentStep"("status");
CREATE INDEX IF NOT EXISTS "AgentStep_deletedAt_idx" ON "AgentStep"("deletedAt");
