# API

## Project Onboarding and Discovery Endpoints

- `GET /api/v1/projects/:id/profile`
- `PUT /api/v1/projects/:id/profile`
- `POST /api/v1/projects/:id/onboarding/start`
- `POST /api/v1/projects/:id/onboarding/complete`
- `GET /api/v1/projects/:id/discovery/status`
- `POST /api/v1/projects/:id/discovery/retry`
- `GET /api/v1/projects/:id/company-profile`
- `GET /api/v1/projects/:id/knowledge`
- `GET /api/v1/projects/:projectId/research-plans`
- `POST /api/v1/projects/:projectId/research-plans`
- `GET /api/v1/projects/:projectId/research-plans/:researchPlanId`
- `GET /api/v1/projects/:projectId/conversations`
- `POST /api/v1/projects/:projectId/conversations`
- `POST /api/v1/conversations/:conversationId/messages`
- `GET /api/v1/projects/:projectId/reports`
- `POST /api/v1/projects/:projectId/reports`
- `GET /api/v1/reports/:reportId`
- `GET /api/v1/projects/:projectId/agent-runs`
- `POST /api/v1/projects/:projectId/agent-runs`

## Platform and Admin Endpoints

- `GET /api/v1/model-management/providers`
- `GET /api/v1/prompt-library`
- `GET /api/v1/billing/account`
- `GET /api/v1/users`
- `GET /api/v1/audit-logs`
- `GET /api/v1/notifications`
- `GET /api/v1/ai/executions`
- `POST /api/v1/ai/executions`

All endpoints require authentication, RBAC, and tenant context.
