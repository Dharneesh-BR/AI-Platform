import {getCliClient} from 'sanity/cli'
import {agentTeams} from './agent-teams.seed-data.mjs'
import {workforceAgents} from './workforce-agents.seed-data.mjs'

const dryRun = process.argv.includes('--dry-run')
const client = getCliClient({apiVersion: '2026-09-19'})

for (const agent of workforceAgents) {
  const existing = await client.fetch(
    '*[_type == "workforceAgent" && !(_id in path("drafts.**")) && slug.current == $slug][0]{_id}',
    {slug: agent.slug.current},
  )

  if (dryRun) {
    console.info(
      JSON.stringify({
        action: existing ? 'would-patch' : 'would-create',
        slug: agent.slug.current,
        name: agent.name,
        existingId: existing?._id ?? null,
      }),
    )
    continue
  }

  const document = {_type: 'workforceAgent', ...agent}

  if (existing?._id) {
    await client.patch(existing._id).set(document).commit({visibility: 'sync'})
    console.info(JSON.stringify({action: 'patched', slug: agent.slug.current, id: existing._id}))
    continue
  }

  const created = await client.create(document, {visibility: 'sync'})
  console.info(JSON.stringify({action: 'created', slug: agent.slug.current, id: created._id}))
}

for (const team of agentTeams) {
  const existing = await client.fetch(
    '*[_type == "agentTeam" && !(_id in path("drafts.**")) && teamSlug.current == $slug][0]{_id}',
    {slug: team.teamSlug.current},
  )
  const primaryAgent = await client.fetch(
    '*[_type == "workforceAgent" && !(_id in path("drafts.**")) && slug.current == $slug][0]{_id}',
    {slug: team.primaryAgentSlug},
  )

  if (dryRun) {
    console.info(
      JSON.stringify({
        action: existing ? 'would-patch-team' : 'would-create-team',
        slug: team.teamSlug.current,
        name: team.teamName,
        primaryAgentSlug: team.primaryAgentSlug,
        primaryAgentId: primaryAgent?._id ?? null,
        existingId: existing?._id ?? null,
      }),
    )
    continue
  }

  if (!primaryAgent?._id) {
    throw new Error(`Cannot seed team '${team.teamSlug.current}' because primary agent '${team.primaryAgentSlug}' was not found.`)
  }

  const {primaryAgentSlug, ...teamDocument} = team
  const document = {
    _type: 'agentTeam',
    ...teamDocument,
    primaryAgent: {_type: 'reference', _ref: primaryAgent._id},
  }

  if (existing?._id) {
    await client.patch(existing._id).set(document).commit({visibility: 'sync'})
    console.info(JSON.stringify({action: 'patched-team', slug: team.teamSlug.current, id: existing._id}))
    continue
  }

  const created = await client.create(document, {visibility: 'sync'})
  console.info(JSON.stringify({action: 'created-team', slug: team.teamSlug.current, id: created._id}))
}
