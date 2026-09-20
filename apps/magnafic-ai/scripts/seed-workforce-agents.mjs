import {existsSync, readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {workforceAgents} from './workforce-agents.seed-data.mjs'

const scriptDir = fileURLToPath(new URL('.', import.meta.url))
const rootDir = resolve(scriptDir, '..', '..', '..')
const studioDir = resolve(scriptDir, '..')

loadEnvFile(resolve(rootDir, '.env'))
loadEnvFile(resolve(studioDir, '.env'))

const dryRun = process.argv.includes('--dry-run')
const projectId = env('SANITY_PROJECT_ID') || env('SANITY_STUDIO_PROJECT_ID') || '3x48zjk7'
const dataset = env('SANITY_DATASET') || env('SANITY_STUDIO_DATASET') || 'production'
const apiVersion = env('SANITY_API_VERSION') || '2026-09-19'
const token = env('SANITY_API_WRITE_TOKEN') || env('SANITY_API_TOKEN')

async function main() {
  if (!token && !dryRun) {
    throw new Error('SANITY_API_WRITE_TOKEN or SANITY_API_TOKEN is required to seed Sanity.')
  }

  console.info(
    JSON.stringify({
      mode: dryRun ? 'dry-run' : 'write',
      projectId,
      dataset,
      apiVersion,
      agentCount: workforceAgents.length,
    }),
  )

  for (const agent of workforceAgents) {
    const existing = await findPublishedAgentBySlug(agent.slug.current)

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

    if (existing) {
      await mutate([{patch: {id: existing._id, set: toSanityDocument(agent)}}])
      console.info(JSON.stringify({action: 'patched', slug: agent.slug.current, id: existing._id}))
      continue
    }

    const result = await mutate([{create: toSanityDocument(agent)}])
    const createdId = result?.transactionId ?? null
    console.info(JSON.stringify({action: 'created', slug: agent.slug.current, transactionId: createdId}))
  }
}

async function findPublishedAgentBySlug(slug) {
  const query = '*[_type == "workforceAgent" && !(_id in path("drafts.**")) && slug.current == $slug][0]{_id}'
  const url = queryUrl(query, {slug})
  const response = await fetch(url, {headers: readHeaders()})

  if (!response.ok) {
    throw new Error(`Sanity query failed: ${response.status} ${response.statusText} ${await response.text()}`)
  }

  const body = await response.json()
  return body.result ?? null
}

async function mutate(mutations) {
  const response = await fetch(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}?returnIds=true&visibility=sync`,
    {
      method: 'POST',
      headers: {
        ...writeHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({mutations}),
    },
  )

  if (!response.ok) {
    throw new Error(`Sanity mutation failed: ${response.status} ${response.statusText} ${await response.text()}`)
  }

  return response.json()
}

function toSanityDocument(agent) {
  return {
    _type: 'workforceAgent',
    ...agent,
  }
}

function queryUrl(query, params = {}) {
  const searchParams = new URLSearchParams({
    query,
    ...Object.fromEntries(Object.entries(params).map(([key, value]) => [`$${key}`, JSON.stringify(value)])),
  })

  return `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?${searchParams.toString()}`
}

function readHeaders() {
  return token ? {Authorization: `Bearer ${token}`} : {}
}

function writeHeaders() {
  return {Authorization: `Bearer ${token}`}
}

function env(name) {
  return process.env[name]?.trim()
}

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return
  }

  const contents = readFileSync(path, 'utf8')
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/)
    if (!match || process.env[match[1]] !== undefined) {
      continue
    }

    process.env[match[1]] = unquote(match[2])
  }
}

function unquote(value) {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
