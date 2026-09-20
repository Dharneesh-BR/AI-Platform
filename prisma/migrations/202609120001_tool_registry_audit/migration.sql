CREATE TABLE IF NOT EXISTS "ToolExecution" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "agentRunId" UUID NOT NULL,
  "agentStepId" UUID,
  "organizationId" UUID NOT NULL,
  "projectId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "agentProfileId" TEXT,
  "agentSlug" TEXT NOT NULL,
  "toolName" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "riskLevel" TEXT NOT NULL,
  "mutating" BOOLEAN NOT NULL DEFAULT false,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "durationMs" INTEGER,
  "inputSummary" JSONB NOT NULL DEFAULT '{}',
  "outputSummary" JSONB NOT NULL DEFAULT '{}',
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  "createdBy" UUID,
  "updatedBy" UUID
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ToolExecution_agentRunId_fkey') THEN
    ALTER TABLE "ToolExecution"
      ADD CONSTRAINT "ToolExecution_agentRunId_fkey"
      FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ToolExecution_agentStepId_fkey') THEN
    ALTER TABLE "ToolExecution"
      ADD CONSTRAINT "ToolExecution_agentStepId_fkey"
      FOREIGN KEY ("agentStepId") REFERENCES "AgentStep"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ToolExecution_agentRunId_toolName_idx" ON "ToolExecution"("agentRunId", "toolName");
CREATE INDEX IF NOT EXISTS "ToolExecution_organizationId_projectId_idx" ON "ToolExecution"("organizationId", "projectId");
CREATE INDEX IF NOT EXISTS "ToolExecution_toolName_status_idx" ON "ToolExecution"("toolName", "status");
CREATE INDEX IF NOT EXISTS "ToolExecution_status_idx" ON "ToolExecution"("status");
CREATE INDEX IF NOT EXISTS "ToolExecution_deletedAt_idx" ON "ToolExecution"("deletedAt");
