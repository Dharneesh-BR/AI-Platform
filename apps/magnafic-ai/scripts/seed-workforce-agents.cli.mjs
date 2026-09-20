import {getCliClient} from 'sanity/cli'
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
