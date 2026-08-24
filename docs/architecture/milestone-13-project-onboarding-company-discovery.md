# Milestone 13: Project Onboarding and Company Discovery

## Status

Implemented as an additive foundation.

## Placement in Existing Roadmap

```mermaid
flowchart TD
  Auth["Authentication"] --> Orgs["Organizations"]
  Orgs --> Projects["Projects"]
  Projects --> Onboarding["Project Onboarding"]
  Onboarding --> Discovery["Company Discovery"]
  Discovery --> Research["Research Pipeline"]
  Research --> Knowledge["Knowledge Base"]
  Knowledge --> LangGraph["LangGraph"]
  LangGraph --> Chat["AI Chat"]
  Chat --> Reports["Reports"]
```

## Core Rules

- Project creation remains compatible with the existing flow.
- New projects should enter onboarding before research.
- Research should not start until onboarding completes.
- Company-specific AI context should not be used until discovery completes.
- Discovery is asynchronous and queued through BullMQ.
- Discovery outputs become research sources and knowledge inputs.

## Project Lifecycle

```mermaid
stateDiagram-v2
  [*] --> CREATED
  CREATED --> ONBOARDING
  CREATED --> AI_READY: legacy compatibility
  ONBOARDING --> DISCOVERY_PENDING
  DISCOVERY_PENDING --> DISCOVERY_RUNNING
  DISCOVERY_RUNNING --> DISCOVERY_COMPLETED
  DISCOVERY_COMPLETED --> KNOWLEDGE_READY
  KNOWLEDGE_READY --> AI_READY
  AI_READY --> DISCOVERY_PENDING: rediscovery
  DISCOVERY_PENDING --> FAILED
  DISCOVERY_RUNNING --> FAILED
  FAILED --> ONBOARDING
  FAILED --> DISCOVERY_PENDING
```

## Sequence

```mermaid
sequenceDiagram
  participant User
  participant Web as Next.js
  participant API as NestJS API
  participant Queue as BullMQ
  participant Worker as Discovery Worker
  participant DB as PostgreSQL

  User->>Web: Create project
  Web->>User: Redirect to /projects/:id/onboarding
  User->>Web: Complete onboarding
  Web->>API: POST /projects/:id/onboarding/complete
  API->>DB: Mark profile complete
  API->>DB: Transition to DISCOVERY_PENDING
  API->>Queue: Enqueue discovery job
  API-->>Web: Return immediately
  Worker->>Queue: Process discovery job
  Worker->>DB: Store company profile and research sources
  Worker->>DB: Transition lifecycle toward AI_READY
```

## Module Boundaries

- `project-profile`: onboarding data persistence.
- `onboarding`: lifecycle transition and discovery enqueue orchestration.
- `discovery-jobs`: queue job persistence, status, retry.
- `company-discovery`: independent discovery services.
- `website-analysis`: SSRF-aware website URL validation.
- `company-profile`: generated and user-reviewed company context.

