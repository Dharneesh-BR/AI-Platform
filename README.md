# Magnafic AI

Production-ready modular monolith for AI-assisted consulting, market research, strategic analysis, planning, reporting, and knowledge retrieval.

## Architecture Principles

- Modular monolith with explicit module boundaries
- Clean Architecture and dependency inversion
- Domain Driven Design where the domain warrants it
- Provider-agnostic AI access through LiteLLM
- Agent orchestration through LangGraph state
- PostgreSQL with pgvector for transactional and semantic data
- Enterprise security, auditability, and tenant isolation by default

## Milestone Status

- Milestone 1: Folder structure approved
- Milestone 2: System architecture approved
- Milestone 3: Database schema implemented
- Milestone 4: Firebase authentication implemented
- Milestone 5: Supabase live database connected
- Milestone 6: LiteLLM-backed chat, research, reports, and AI executions implemented
- Milestone 7: Live project knowledge ingestion implemented

## Local Live Commands

Use the bundled pnpm path if `pnpm` is not globally installed:

```powershell
$pnpm = "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
```

Generate Prisma client and sync the live database schema:

```powershell
& $pnpm prisma:generate
& $pnpm exec prisma db push
```

Seed the first live organization/admin after setting `ADMIN_EMAIL` and `ADMIN_FIREBASE_UID`:

```powershell
& $pnpm prisma:seed
```

Run backend and frontend in separate terminals:

```powershell
& $pnpm --filter @platform/api dev
& $pnpm --filter @platform/web dev
```

Open the app:

```text
http://127.0.0.1:3000
```
