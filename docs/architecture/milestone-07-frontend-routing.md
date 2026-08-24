# Milestone 7: Frontend Routing

## Status

Drafted for approval.

## Routing Strategy

The frontend uses Next.js App Router with route groups for authentication, dashboard UX, and admin surfaces.

```text
apps/web/src/app
├── layout.tsx
├── page.tsx
├── (auth)
│   ├── login
│   │   └── page.tsx
│   └── callback
│       └── page.tsx
├── (dashboard)
│   ├── layout.tsx
│   ├── dashboard
│   │   └── page.tsx
│   ├── organizations
│   │   ├── page.tsx
│   │   └── [organizationId]
│   │       ├── page.tsx
│   │       └── settings
│   │           └── page.tsx
│   ├── projects
│   │   ├── page.tsx
│   │   └── [projectId]
│   │       ├── page.tsx
│   │       ├── research
│   │       │   └── page.tsx
│   │       ├── chat
│   │       │   └── page.tsx
│   │       ├── knowledge
│   │       │   └── page.tsx
│   │       ├── reports
│   │       │   ├── page.tsx
│   │       │   └── [reportId]
│   │       │       └── page.tsx
│   │       └── settings
│   │           └── page.tsx
│   ├── prompt-library
│   │   └── page.tsx
│   ├── model-management
│   │   └── page.tsx
│   ├── billing
│   │   └── page.tsx
│   └── settings
│       └── page.tsx
└── admin
    ├── page.tsx
    ├── organizations
    │   └── page.tsx
    ├── users
    │   └── page.tsx
    ├── audit-logs
    │   └── page.tsx
    └── system
        └── page.tsx
```

## Feature Mapping

- `features/auth`: Firebase login, session exchange, logout.
- `features/organizations`: tenant selection and membership management.
- `features/projects`: project lifecycle and workspace navigation.
- `features/research`: research planning, pipeline runs, evidence review.
- `features/ai-chat`: project-scoped AI conversations.
- `features/knowledge-base`: upload, parse status, semantic search.
- `features/reports`: consulting report generation and exports.
- `features/admin`: platform operations and observability.

## State Boundaries

- TanStack Query manages server state and cache invalidation.
- Zustand manages local UI state such as sidebar, theme, draft panels, and selected organization.
- React Hook Form manages form state.
- Zod validates form and API boundary data.

