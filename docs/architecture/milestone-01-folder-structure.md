# Milestone 1: Folder Structure

## Status

Approved.

## Root Layout

```text
apps/
  web/
  api/
packages/
  config/
  contracts/
  domain/
  ui/
  utils/
services/
  ai-gateway/
  agent-runtime/
  document-processing/
  notification-worker/
infrastructure/
  docker/
  github-actions/
  terraform/
  scripts/
prisma/
sanity/
docs/
tests/
```

## Ownership

- `apps/web` owns the Next.js App Router frontend.
- `apps/api` owns the NestJS modular monolith API.
- `packages/contracts` owns shared validation and API contracts.
- `packages/domain` owns reusable domain primitives and cross-module value objects.
- `packages/ui` owns the shadcn/ui-based design system.
- `services` owns independently runnable background and AI runtime processes.
- `prisma` owns database schema, migrations, and seed data.
- `docs` owns all architecture milestone decisions.

## Boundary Rules

- Application modules may depend on shared packages.
- Shared packages must not depend on application modules.
- Domain code must not depend on infrastructure code.
- Cross-module access must happen through exported module interfaces.
- Circular dependencies are prohibited.

