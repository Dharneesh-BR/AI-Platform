# Milestone 10: Docker Architecture

## Status

Drafted for approval.

## Local Compose Services

- `postgres`: PostgreSQL 16 with pgvector extension.
- `redis`: Redis 7 for queues, caching, and rate limiting.
- Future service profiles will add API, workers, and local LiteLLM when implementation reaches runtime wiring.

## Container Principles

- Runtime images must be minimal.
- Containers must run as non-root users where possible.
- Build and runtime stages must be separated.
- Environment variables must be injected at runtime.
- Health checks must exist for production services.

## Network Boundaries

- API talks to PostgreSQL and Redis.
- Workers talk to PostgreSQL, Redis, storage, and LiteLLM.
- Web talks to the API only.
- Browser clients never talk directly to PostgreSQL, Redis, storage backends, or AI providers.

