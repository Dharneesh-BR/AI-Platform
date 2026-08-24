# Milestone 8: Backend Modules

## Status

Drafted for approval.

## Module Template

Each NestJS module follows this structure:

```text
module-name/
├── presentation
│   ├── controllers
│   └── dto
├── application
│   ├── commands
│   ├── queries
│   ├── use-cases
│   └── ports
├── domain
│   ├── entities
│   ├── events
│   ├── repositories
│   └── value-objects
├── infrastructure
│   ├── prisma
│   ├── queues
│   └── external
└── module-name.module.ts
```

## Dependency Rule

```text
presentation -> application -> domain
infrastructure -> application/domain
domain -> no framework dependencies
```

## Module Responsibilities

- Auth: identity verification, token issuance, RBAC context.
- Users: profile lifecycle and user lookup.
- Organizations: tenancy, memberships, organization policies.
- Projects: consulting workspace lifecycle.
- Research: plans, findings, citations, validations.
- AI: provider-agnostic execution and token accounting.
- Knowledge Base: documents, chunks, embeddings, semantic search.
- Agents: LangGraph runs, graph state, supervision.
- Reports: report sections, generation jobs, exports.
- Conversations: messages and chat session history.
- Prompt Library: prompt templates, versions, approval workflow.
- Model Management: provider configs, routing policy, capabilities.
- Billing: subscriptions, usage records, metering.
- Notifications: in-app and email notifications.
- Audit Logs: append-only security and domain activity logs.
- Admin: platform operations and moderation.

