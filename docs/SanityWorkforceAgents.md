# Sanity Workforce Agents

Workforce agents can be authored in Sanity with the `workforceAgent` document type.
When `SANITY_PROJECT_ID` is configured, the API reads enabled Sanity agents first and falls back to database-seeded agents when Sanity is unavailable.

## Required Environment

```env
SANITY_PROJECT_ID=
SANITY_DATASET=production
SANITY_API_TOKEN=
SANITY_API_VERSION=2026-09-19
```

`SANITY_API_TOKEN` is optional for published public datasets, but recommended for private datasets.
`SANITY_API_WRITE_TOKEN` or `SANITY_API_TOKEN` is required for the seed script.

## Agent Fields

- `name`: Display name in the workforce UI.
- `slug`: Stable value used by chat requests, for example `marketing`.
- `enabled`: Only `Enabled` agents are returned by the API.
- `department`: Used for grouping and agent identity.
- `description`: Short text shown in the agent picker.
- `systemInstructions`: Core behavior and safety instructions.
- `capabilities`: Runtime capabilities such as `rag`, `analysis`, `writing`, `calculation`, and `planning`.
- `allowedSpecialists`: Specialists the runtime may call.
- `allowedTools`: Tools the agent may use.
- `knowledgeScopes`: Project knowledge areas the agent may consult.
- `responseFormatInstructions`: Main formatting instruction for the final answer.
- `outputSections`: Required sections the final answer must include.
- `modelPolicy`: Model routing policy and optional allowed roles.
- `verificationPolicy`: Extra verification settings such as required phrases.

## Output Control

The final synthesis prompt uses `responseFormatInstructions` and required `outputSections`.
The verifier checks that each required section heading appears in the final answer. If a section is missing, the runtime asks for a revision according to the existing verification retry policy.

Example output sections:

- `Executive Summary`: Summarize the answer in 3 to 5 bullets.
- `Recommended Actions`: List prioritized actions with owners and timing.
- `Risks And Assumptions`: Call out missing data, assumptions, and risk areas.

## Studio

The active Sanity Studio lives at:

```text
apps/magnafic-ai
```

Run it with:

```powershell
pnpm sanity:dev
```

## Seed Existing Agents

Preview the six default workforce agents without writing:

```powershell
pnpm sanity:seed:workforce:dry
```

Create or update the six default workforce agents in Sanity:

```powershell
pnpm sanity:seed:workforce
```

The seed script is idempotent. It looks up existing published `workforceAgent` documents by `slug.current`, patches existing documents, and creates missing documents with Sanity-generated IDs.

## Runtime Flow

```text
Sanity Studio workforceAgent
  -> API /v1/agents reads enabled Sanity agents
  -> AI Workforce page displays the agents
  -> User sends a chat message with an agent slug
  -> Agent runtime loads that Sanity profile
  -> systemInstructions and outputSections shape the response
  -> verificationPolicy checks required sections or phrases
  -> final answer is saved to the conversation
```
