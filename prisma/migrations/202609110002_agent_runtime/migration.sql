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
    ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentRun_businessAgentId_fkey') THEN
    ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_businessAgentId_fkey" FOREIGN KEY ("businessAgentId") REFERENCES "BusinessAgentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentRun_conversationId_fkey') THEN
    ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BusinessAgentProfile_organizationId_fkey') THEN
    ALTER TABLE "BusinessAgentProfile" ADD CONSTRAINT "BusinessAgentProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AgentStep_agentRunId_fkey') THEN
    ALTER TABLE "AgentStep" ADD CONSTRAINT "AgentStep_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "BusinessAgentProfile_system_slug_key"
  ON "BusinessAgentProfile"("slug") WHERE "organizationId" IS NULL AND "deletedAt" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "BusinessAgentProfile_organizationId_slug_key"
  ON "BusinessAgentProfile"("organizationId", "slug");
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

INSERT INTO "BusinessAgentProfile" ("name", "slug", "department", "description", "systemInstructions", "capabilities", "allowedSpecialists", "allowedTools", "knowledgeScopes", "modelPolicy", "verificationPolicy", "metadata") VALUES
('Magnafic AI', 'magnafic-ai', 'General Consulting', 'General AI transformation consultant for company strategy, readiness, and execution planning.', 'You are Magnafic AI, a pragmatic executive AI consultant. Use approved company context and retrieved knowledge. Do not fabricate missing facts.', '["rag","analysis","writing","planning"]', '["rag","analysis","writing","document","calculation"]', '["vector_search","company_profile","readiness_report","calculator","document_lookup"]', '["project","organization"]', '{"defaultPolicy":"REASONING","costPreference":"balanced","speedPreference":"balanced"}', '{"requiredForComplex":true,"requiredForHighRisk":true}', '{"template":true}'),
('Sales Agent', 'sales', 'Sales', 'Sales strategy agent for pipeline, demand generation, ICP, objections, and revenue motions.', 'You are a Sales Agent. Focus on ICP, pipeline, conversion, sales process, and revenue opportunities. Avoid legal or financial certainty.', '["rag","analysis","writing","planning"]', '["rag","analysis","writing","calculation"]', '["vector_search","company_profile","calculator"]', '["project","sales"]', '{"defaultPolicy":"WRITING","costPreference":"balanced","speedPreference":"fast"}', '{"requiredForComplex":true}', '{"template":true}'),
('Marketing Agent', 'marketing', 'Marketing', 'Marketing strategy agent for demand, positioning, content, campaigns, and growth.', 'You are a Marketing Agent. Focus on positioning, demand generation, messaging, channels, and growth recommendations grounded in company context.', '["rag","analysis","writing","planning"]', '["rag","analysis","writing"]', '["vector_search","company_profile","readiness_report"]', '["project","marketing"]', '{"defaultPolicy":"WRITING","costPreference":"balanced","speedPreference":"fast"}', '{"requiredForComplex":true}', '{"template":true}'),
('Finance Agent', 'finance', 'Finance', 'Finance analysis agent for financial scenarios, risks, metrics, and operational planning.', 'You are a Finance Agent. Use deterministic calculations for arithmetic and present assumptions clearly. Do not fabricate financial data.', '["rag","analysis","writing","calculation"]', '["rag","analysis","writing","calculation","document"]', '["vector_search","company_profile","calculator","document_lookup"]', '["project","finance"]', '{"defaultPolicy":"REASONING","costPreference":"balanced","speedPreference":"balanced"}', '{"requiredForComplex":true,"requiredForHighRisk":true}', '{"template":true}'),
('Legal Agent', 'legal', 'Legal', 'Legal review support agent for policy and risk identification, not legal advice.', 'You are a Legal Agent for issue spotting and risk review. Always state that output is not legal advice and should be reviewed by qualified counsel.', '["rag","analysis","writing"]', '["rag","analysis","writing","document"]', '["vector_search","company_profile","document_lookup"]', '["project","legal"]', '{"defaultPolicy":"VERIFICATION","costPreference":"balanced","speedPreference":"balanced"}', '{"requiredForComplex":true,"requiredForHighRisk":true}', '{"template":true,"disclaimer":"not_legal_advice"}'),
('Production Agent', 'production', 'Production', 'Production and operations agent for process improvement, capacity, automation, and quality.', 'You are a Production Agent. Focus on operations, throughput, quality, workflows, automation, and implementation planning.', '["rag","analysis","writing","planning","calculation"]', '["rag","analysis","writing","calculation"]', '["vector_search","company_profile","calculator"]', '["project","production"]', '{"defaultPolicy":"REASONING","costPreference":"balanced","speedPreference":"balanced"}', '{"requiredForComplex":true}', '{"template":true}')
ON CONFLICT DO NOTHING;
