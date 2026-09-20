import {spawnSync} from 'node:child_process'
import {cpSync, existsSync, readdirSync} from 'node:fs'
import {dirname, join, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createRequire} from 'node:module'

const rootDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const require = createRequire(import.meta.url)
const prismaCli = require.resolve('prisma/build/index.js')

const generate = spawnSync(process.execPath, [prismaCli, 'generate'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: false,
})

if (generate.status !== 0) {
  process.exit(generate.status ?? 1)
}

const rootClientPackage = require.resolve('@prisma/client/package.json')
const rootClientDir = dirname(rootClientPackage)
const generatedSource = resolve(rootClientDir, '..', '..', '.prisma')

if (!existsSync(generatedSource)) {
  throw new Error(`Generated Prisma client was not found at ${generatedSource}`)
}

const pnpmStore = resolve(rootDir, 'node_modules', '.pnpm')
if (!existsSync(pnpmStore)) {
  process.exit(0)
}

for (const entry of readdirSync(pnpmStore, {withFileTypes: true})) {
  if (!entry.isDirectory() || !entry.name.startsWith('@prisma+client@')) {
    continue
  }

  const target = join(pnpmStore, entry.name, 'node_modules', '.prisma')
  if (resolve(target) === resolve(generatedSource)) {
    continue
  }
  cpSync(generatedSource, target, {recursive: true, force: true})
}
