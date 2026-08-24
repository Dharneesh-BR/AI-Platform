# Milestone 14: Discovery Worker

## Status

Implemented as a foundational worker processor.

## Purpose

The discovery worker consumes BullMQ `discovery` queue jobs, updates progress, generates company profile context, writes research sources, and transitions the project lifecycle to `DISCOVERY_COMPLETED`.

## Runtime Behavior

- API process enqueues discovery jobs after onboarding completion.
- Worker is disabled by default unless `DISCOVERY_WORKER_ENABLED=true`.
- Worker progress is persisted to `DiscoveryJob`.
- Output is persisted to `CompanyProfile`, related company entities, and `ResearchSource`.
- Company profile remains unapproved until user review.

## Local Worker Command

```powershell
$env:DISCOVERY_WORKER_ENABLED="true"
pnpm --filter @platform/api dev
```

Use a separate terminal from the API process when running worker-enabled development.

