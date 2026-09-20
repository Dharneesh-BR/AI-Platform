# Backend

## Added Modules

- `project-profile`
- `onboarding`
- `discovery-jobs`
- `company-discovery`
- `website-analysis`
- `company-profile`
- `research`
- `conversations`
- `reports`
- `agents`
- `ai`
- `model-management`
- `prompt-library`
- `billing`
- `audit-logs`
- `notifications`
- `users`

## API Rules

- Controllers call use cases only.
- Use cases depend on ports.
- Prisma access remains inside repository adapters.
- Discovery execution is queued through BullMQ.
- Tenant context is required for project onboarding and discovery endpoints.

## Live Backend Coverage

- Project delivery APIs now cover onboarding, discovery, approved profile, knowledge, research plans, chat conversations, agent runs, and reports.
- Platform visibility APIs now cover model providers, prompt templates, billing account, users, audit logs, notifications, and AI execution records.
- LiteLLM-compatible AI generation is wired for chat, research plans, reports, and generic AI executions. AI endpoints fail clearly if `LITELLM_BASE_URL` and `LITELLM_API_KEY` are not configured.
