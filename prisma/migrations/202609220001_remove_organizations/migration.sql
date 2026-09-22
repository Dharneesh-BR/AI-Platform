-- Remove organization/tenant ownership. Projects are owned directly by User via Project.createdBy.

-- Preserve project ownership before dropping organization membership data.
DO $$
BEGIN
  IF to_regclass('"OrganizationMembership"') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'Project' AND column_name = 'organizationId'
     ) THEN
    UPDATE "Project" p
    SET "createdBy" = COALESCE(
      p."createdBy",
      (
        SELECT om."userId"
        FROM "OrganizationMembership" om
        WHERE om."organizationId" = p."organizationId"
          AND om."deletedAt" IS NULL
        ORDER BY
          CASE om."role"
            WHEN 'SUPER_ADMIN' THEN 0
            WHEN 'ADMIN' THEN 1
            ELSE 2
          END,
          om."createdAt" ASC
        LIMIT 1
      )
    )
    WHERE p."createdBy" IS NULL;
  END IF;
END $$;

-- Billing accounts move from organization-owned to user-owned.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'BillingAccount' AND column_name = 'organizationId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'BillingAccount' AND column_name = 'userId'
  ) THEN
    ALTER TABLE "BillingAccount" ADD COLUMN "userId" UUID;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'BillingAccount' AND column_name = 'organizationId'
  ) AND to_regclass('"OrganizationMembership"') IS NOT NULL THEN
    UPDATE "BillingAccount" ba
    SET "userId" = COALESCE(
      ba."userId",
      (
        SELECT om."userId"
        FROM "OrganizationMembership" om
        WHERE om."organizationId" = ba."organizationId"
          AND om."deletedAt" IS NULL
        ORDER BY om."createdAt" ASC
        LIMIT 1
      ),
      (SELECT u.id FROM "User" u WHERE u."deletedAt" IS NULL ORDER BY u."createdAt" ASC LIMIT 1),
      gen_random_uuid()
    )
    WHERE ba."userId" IS NULL;
  ELSE
    UPDATE "BillingAccount" ba
    SET "userId" = COALESCE(
      ba."userId",
      (SELECT u.id FROM "User" u WHERE u."deletedAt" IS NULL ORDER BY u."createdAt" ASC LIMIT 1),
      gen_random_uuid()
    )
    WHERE ba."userId" IS NULL;
  END IF;
END $$;

ALTER TABLE "BillingAccount" DROP CONSTRAINT IF EXISTS "BillingAccount_organizationId_fkey";
ALTER TABLE "BillingAccount" DROP CONSTRAINT IF EXISTS "BillingAccount_organizationId_key";
DROP INDEX IF EXISTS "BillingAccount_organizationId_key";
ALTER TABLE "BillingAccount" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "BillingAccount" ALTER COLUMN "userId" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "BillingAccount_userId_key" ON "BillingAccount"("userId");

-- Drop foreign keys and indexes tied to organizations/tenants.
ALTER TABLE "Project" DROP CONSTRAINT IF EXISTS "Project_organizationId_fkey";
ALTER TABLE "ProjectProfile" DROP CONSTRAINT IF EXISTS "ProjectProfile_organizationId_fkey";
ALTER TABLE "DiscoveryJob" DROP CONSTRAINT IF EXISTS "DiscoveryJob_organizationId_fkey";
ALTER TABLE "CompanyProfile" DROP CONSTRAINT IF EXISTS "CompanyProfile_organizationId_fkey";
ALTER TABLE "CompanyTechnology" DROP CONSTRAINT IF EXISTS "CompanyTechnology_organizationId_fkey";
ALTER TABLE "CompanyCompetitor" DROP CONSTRAINT IF EXISTS "CompanyCompetitor_organizationId_fkey";
ALTER TABLE "CompanyGoal" DROP CONSTRAINT IF EXISTS "CompanyGoal_organizationId_fkey";
ALTER TABLE "ResearchSource" DROP CONSTRAINT IF EXISTS "ResearchSource_organizationId_fkey";
ALTER TABLE "KnowledgeDocument" DROP CONSTRAINT IF EXISTS "KnowledgeDocument_organizationId_fkey";
ALTER TABLE "AgentRun" DROP CONSTRAINT IF EXISTS "AgentRun_organizationId_fkey";
ALTER TABLE "BusinessAgentProfile" DROP CONSTRAINT IF EXISTS "BusinessAgentProfile_organizationId_fkey";
ALTER TABLE "ToolExecution" DROP CONSTRAINT IF EXISTS "ToolExecution_organizationId_fkey";
ALTER TABLE "Report" DROP CONSTRAINT IF EXISTS "Report_organizationId_fkey";
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_organizationId_fkey";

DROP INDEX IF EXISTS "Project_organizationId_slug_key";
DROP INDEX IF EXISTS "Project_organizationId_status_idx";
DROP INDEX IF EXISTS "Project_organizationId_lifecycleState_idx";
DROP INDEX IF EXISTS "ProjectProfile_tenantId_projectId_idx";
DROP INDEX IF EXISTS "ProjectProfile_organizationId_projectId_idx";
DROP INDEX IF EXISTS "DiscoveryJob_tenantId_projectId_idx";
DROP INDEX IF EXISTS "DiscoveryJob_organizationId_projectId_idx";
DROP INDEX IF EXISTS "CompanyProfile_tenantId_projectId_idx";
DROP INDEX IF EXISTS "CompanyProfile_organizationId_projectId_idx";
DROP INDEX IF EXISTS "CompanyTechnology_tenantId_projectId_idx";
DROP INDEX IF EXISTS "CompanyTechnology_organizationId_projectId_idx";
DROP INDEX IF EXISTS "CompanyCompetitor_tenantId_projectId_idx";
DROP INDEX IF EXISTS "CompanyCompetitor_organizationId_projectId_idx";
DROP INDEX IF EXISTS "CompanyGoal_tenantId_projectId_idx";
DROP INDEX IF EXISTS "CompanyGoal_organizationId_projectId_idx";
DROP INDEX IF EXISTS "ResearchSource_tenantId_projectId_idx";
DROP INDEX IF EXISTS "ResearchSource_organizationId_projectId_idx";
DROP INDEX IF EXISTS "KnowledgeDocument_organizationId_status_idx";
DROP INDEX IF EXISTS "AgentRun_organizationId_status_idx";
DROP INDEX IF EXISTS "BusinessAgentProfile_organizationId_slug_key";
DROP INDEX IF EXISTS "BusinessAgentProfile_organizationId_slug_idx";
DROP INDEX IF EXISTS "BusinessAgentProfile_organizationId_enabled_idx";
DROP INDEX IF EXISTS "ToolExecution_organizationId_projectId_idx";
DROP INDEX IF EXISTS "Report_organizationId_projectId_idx";
DROP INDEX IF EXISTS "AuditLog_organizationId_createdAt_idx";

-- Drop organization/tenant columns from all runtime tables.
ALTER TABLE "Project" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "ProjectProfile" DROP COLUMN IF EXISTS "tenantId", DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "DiscoveryJob" DROP COLUMN IF EXISTS "tenantId", DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "CompanyProfile" DROP COLUMN IF EXISTS "tenantId", DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "CompanyTechnology" DROP COLUMN IF EXISTS "tenantId", DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "CompanyCompetitor" DROP COLUMN IF EXISTS "tenantId", DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "CompanyGoal" DROP COLUMN IF EXISTS "tenantId", DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "ResearchSource" DROP COLUMN IF EXISTS "tenantId", DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "KnowledgeDocument" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "AgentRun" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "BusinessAgentProfile" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "ToolExecution" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Report" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "AuditLog" DROP COLUMN IF EXISTS "organizationId";

CREATE UNIQUE INDEX IF NOT EXISTS "Project_createdBy_slug_key" ON "Project"("createdBy", "slug");
CREATE INDEX IF NOT EXISTS "Project_createdBy_status_idx" ON "Project"("createdBy", "status");
CREATE INDEX IF NOT EXISTS "Project_createdBy_lifecycleState_idx" ON "Project"("createdBy", "lifecycleState");
CREATE UNIQUE INDEX IF NOT EXISTS "BusinessAgentProfile_slug_key" ON "BusinessAgentProfile"("slug");

DROP TABLE IF EXISTS "OrganizationMembership";
DROP TABLE IF EXISTS "Organization";
