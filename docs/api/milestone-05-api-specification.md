# Milestone 5: API Specification

## Status

Drafted for approval.

## API Style

- REST APIs are versioned under `/api/v1`.
- OpenAPI documentation is generated through Swagger decorators.
- Request validation uses DTO classes and validation pipes.
- Response contracts are stable and shared with the frontend through `packages/contracts`.
- All endpoints require authentication unless explicitly marked public.

## Global API Standards

### Headers

- `Authorization: Bearer <jwt>` for authenticated requests.
- `X-Organization-Id` for tenant-scoped requests.
- `Idempotency-Key` for write operations that may be retried.

### Pagination

List endpoints use cursor pagination:

```json
{
  "items": [],
  "pageInfo": {
    "nextCursor": "string | null",
    "hasNextPage": true
  }
}
```

### Error Contract

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": {},
    "requestId": "uuid"
  }
}
```

## Endpoint Groups

### Authentication

- `POST /api/v1/auth/session` verifies Firebase identity and issues platform JWT.
- `GET /api/v1/auth/me` returns the authenticated user and memberships.
- `POST /api/v1/auth/logout` invalidates server-side session metadata where applicable.

### Users

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/users/:id`
- `GET /api/v1/users`

### Organizations

- `POST /api/v1/organizations`
- `GET /api/v1/organizations`
- `GET /api/v1/organizations/:id`
- `PATCH /api/v1/organizations/:id`
- `DELETE /api/v1/organizations/:id`
- `POST /api/v1/organizations/:id/memberships`
- `PATCH /api/v1/organizations/:id/memberships/:membershipId`

### Projects

- `POST /api/v1/projects`
- `GET /api/v1/projects`
- `GET /api/v1/projects/:id`
- `PATCH /api/v1/projects/:id`
- `DELETE /api/v1/projects/:id`

### Research

- `POST /api/v1/projects/:projectId/research-plans`
- `GET /api/v1/projects/:projectId/research-plans`
- `GET /api/v1/research-plans/:id`
- `POST /api/v1/research-plans/:id/run`
- `GET /api/v1/research-plans/:id/findings`
- `GET /api/v1/research-plans/:id/citations`
- `GET /api/v1/research-plans/:id/validations`

### Knowledge Base

- `POST /api/v1/projects/:projectId/documents`
- `GET /api/v1/projects/:projectId/documents`
- `GET /api/v1/documents/:id`
- `DELETE /api/v1/documents/:id`
- `POST /api/v1/knowledge/search`
- `POST /api/v1/knowledge/semantic-search`

### Conversations

- `POST /api/v1/projects/:projectId/conversations`
- `GET /api/v1/projects/:projectId/conversations`
- `GET /api/v1/conversations/:id`
- `POST /api/v1/conversations/:id/messages`

### Agents

- `POST /api/v1/projects/:projectId/agent-runs`
- `GET /api/v1/projects/:projectId/agent-runs`
- `GET /api/v1/agent-runs/:id`
- `POST /api/v1/agent-runs/:id/cancel`

### AI Model Management

- `GET /api/v1/model-providers`
- `POST /api/v1/model-providers`
- `PATCH /api/v1/model-providers/:id`
- `GET /api/v1/model-configurations`
- `POST /api/v1/model-configurations`
- `PATCH /api/v1/model-configurations/:id`

### Prompt Library

- `POST /api/v1/prompt-templates`
- `GET /api/v1/prompt-templates`
- `GET /api/v1/prompt-templates/:id`
- `POST /api/v1/prompt-templates/:id/versions`
- `POST /api/v1/prompt-templates/:id/approve`

### Reports

- `POST /api/v1/projects/:projectId/reports`
- `GET /api/v1/projects/:projectId/reports`
- `GET /api/v1/reports/:id`
- `POST /api/v1/reports/:id/generate`
- `GET /api/v1/reports/:id/export`

### Notifications

- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`

### Billing

- `GET /api/v1/billing/account`
- `GET /api/v1/billing/usage`

### Audit Logs

- `GET /api/v1/audit-logs`

### Admin

- `GET /api/v1/admin/platform-health`
- `GET /api/v1/admin/usage`
- `GET /api/v1/admin/organizations`

## Authorization Policy

- Super Admin can access platform administration.
- Admin can manage organization resources.
- Consultant can create projects, research, reports, and agent runs.
- Client can collaborate on assigned projects.
- Viewer can read assigned resources only.

