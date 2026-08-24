# Milestone 3: Database Schema

## Status

Drafted for approval.

## Database

- PostgreSQL is the primary transactional database.
- pgvector stores embeddings for semantic retrieval.
- Prisma owns schema definition and migration generation.

## Universal Columns

Every persisted table includes:

- `id`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdBy`
- `updatedBy`

## Tenancy Strategy

- Organizations are the primary tenant boundary.
- Most business records belong to an organization.
- Project-scoped records also include `projectId`.
- Repository methods must always receive authorization context.
- Soft-deleted records are excluded by default.

## Core Data Domains

- Identity: users, organizations, memberships.
- Collaboration: projects, conversations, messages.
- Research: plans, findings, citations, validations.
- Knowledge: documents, chunks, embeddings, metadata.
- AI: model providers, model configs, executions, agent runs.
- Output: reports, report sections, generated artifacts.
- Operations: notifications, audit logs, billing usage.

## Vector Search

Document chunks store embeddings using `vector(1536)` by default. The embedding dimension is configurable at the model-management layer for future providers, but the initial database baseline targets OpenAI-compatible 1536-dimensional embeddings.

## Approval Gate

After approval, implementation proceeds to Prisma migrations, repository interfaces, and module-level persistence boundaries.

