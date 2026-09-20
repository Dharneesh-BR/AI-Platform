# Deployment Guide

This project deploys best as separate services from the same pnpm monorepo:

- `apps/web`: Next.js web app.
- `apps/api`: NestJS API and queue workers.
- PostgreSQL with `pgvector`: primary database.
- Redis: BullMQ queues and worker coordination.
- Sanity Studio: optional content/workforce-agent studio in `apps/magnafic-ai`.

Run the deploy check before publishing:

```bash
pnpm install --frozen-lockfile
pnpm deploy:check
```

`pnpm deploy:check` validates TypeScript, lint, unit tests, and production builds for the web/API apps. The Sanity Studio build is intentionally separate because it needs outbound access to Sanity CDN and a configured Sanity deployment.

## Recommended Hosting Split

Use this split for the first production launch:

- Web: Vercel, with the Next.js project rooted at `apps/web`.
- API and workers: Railway or Render, with build/start commands from the repository root.
- Database: Supabase Postgres or another managed PostgreSQL provider with `pgvector` enabled.
- Redis: managed Redis from the API host or Upstash/Redis Cloud.
- Storage: S3-compatible storage or Firebase Storage.
- Sanity Studio: Sanity hosted Studio when the content model is ready.

This keeps the frontend on a Next-optimized host while the API runs on a persistent Node service that can also process background jobs.

## Required Build Commands

From the repository root:

```bash
pnpm --filter @platform/web build
pnpm --filter @platform/api build
```

Production start commands:

```bash
pnpm --filter @platform/web start
pnpm --filter @platform/api start
```

The API build runs `pnpm prisma:generate` first so a fresh hosting build has a generated Prisma client.

## Environment Variables

Set these on the API service:

```text
NODE_ENV=production
PORT=3001
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
JWT_EXPIRES_IN_SECONDS=3600
CORS_ORIGIN=https://your-web-domain.example
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_CHECK_REVOKED=true
LITELLM_BASE_URL=
LITELLM_API_KEY=
LITELLM_DEFAULT_MODEL=
STORAGE_PROVIDER=s3
AWS_REGION=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
SANITY_PROJECT_ID=
SANITY_DATASET=production
SANITY_API_TOKEN=
DISCOVERY_WORKER_ENABLED=false
DOCUMENT_WORKER_ENABLED=true
AGENT_WORKER_ENABLED=true
AUTH_BYPASS_ENABLED=false
```

Set these on the web service:

```text
NEXT_PUBLIC_API_URL=https://your-api-domain.example/v1
NEXT_PUBLIC_ORGANIZATION_ID=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_AUTH_BYPASS_ENABLED=false
```

Do not set auth bypass variables to `true` in production.

## Database Publishing Steps

1. Create a managed PostgreSQL database.
2. Enable the `pgcrypto` and `pgvector` extensions.
3. Set `DATABASE_URL` on the API service.
4. Generate and apply migrations:

```bash
pnpm prisma:generate
pnpm exec prisma migrate deploy
```

If this is the first live workspace, seed the initial organization/admin only after setting:

```text
ADMIN_EMAIL=
ADMIN_FIREBASE_UID=
ADMIN_DISPLAY_NAME=
LIVE_ORGANIZATION_NAME=
LIVE_ORGANIZATION_SLUG=
```

Then run:

```bash
pnpm prisma:seed
```

## Platform Setup

### Vercel for Web

Create a Vercel project for `apps/web`.

- Root directory: `apps/web`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @platform/web build`
- Output directory: use the Next.js default
- Environment variables: web variables listed above

After the API is live, set `NEXT_PUBLIC_API_URL` to the API `/v1` URL and redeploy.

### Railway for API and Workers

Create one service for the API from the monorepo.

- Build command: `pnpm --filter @platform/api build`
- Start command: `pnpm --filter @platform/api start`
- Add PostgreSQL and Redis plugins, or point `DATABASE_URL` and `REDIS_URL` at external managed services.
- Set all API environment variables.

For heavier worker traffic, create a second API service with the same build/start command and worker env flags enabled, then disable public HTTP routing on the worker service if your host supports it.

### Render for API and Workers

Create a web service from the repository.

- Root directory: repository root
- Build command: `pnpm install --frozen-lockfile && pnpm --filter @platform/api build`
- Start command: `pnpm --filter @platform/api start`
- Add managed Redis and PostgreSQL, or use external providers.
- Set all API environment variables.

### Fly.io or Container Hosts

Use Fly.io or another container host when you want tighter control over regions, machines, and networking. Keep the same service split: one image/process for API, optional separate worker process, and managed Postgres/Redis.

Before using a container host, add Dockerfiles for the web and API images and run `pnpm deploy:check` locally.

### Sanity Studio

Build/deploy Studio separately:

```bash
pnpm --filter magnafic-ai build
pnpm --filter magnafic-ai deploy
```

The Studio build requires network access to Sanity CDN. If Sanity warns about missing `appId`, configure it in Sanity Manage before production Studio rollout.

## Pre-Publish Checklist

- `pnpm deploy:check` passes.
- `DATABASE_URL` points to a database with `pgvector` enabled.
- `pnpm exec prisma migrate deploy` succeeds.
- Firebase Auth has the deployed web domain in authorized domains.
- API `CORS_ORIGIN` exactly includes the deployed web URL.
- Web `NEXT_PUBLIC_API_URL` points to the deployed API `/v1` URL.
- `AUTH_BYPASS_ENABLED=false` and no bypass token is exposed.
- Redis is reachable from the API service.
- Object storage credentials are production credentials.
- Initial admin user has been seeded.
- API docs are reachable at `/api/docs` after login/security review.
