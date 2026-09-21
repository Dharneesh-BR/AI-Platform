UPDATE "BusinessAgentProfile"
SET
  "allowedTools" = '["vector_search","company_profile","readiness_report","document_lookup"]'::jsonb,
  "allowedSpecialists" = '["rag","analysis","writing","research"]'::jsonb,
  "capabilities" = '["rag","analysis","writing","planning"]'::jsonb,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'magnafic-ai'
  AND "deletedAt" IS NULL;
