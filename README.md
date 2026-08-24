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
- Milestone 4: Role-based demo session implemented
- Milestone 5: Demo seed data implemented

## Local Demo Commands

Use the bundled pnpm path if `pnpm` is not globally installed:

```powershell
$pnpm = "C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
```

Start infrastructure:

```powershell
docker compose up -d postgres redis
```

Generate Prisma client, run migrations, and seed demo data:

```powershell
& $pnpm prisma:generate
& $pnpm prisma:migrate
& $pnpm prisma:seed
```

Enable development role-login JWTs:

```powershell
$env:ENABLE_DEV_AUTH = "true"
$env:NEXT_PUBLIC_ENABLE_DEV_AUTH = "true"
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
