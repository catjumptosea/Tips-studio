import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, cpSync, readdirSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const distDir = join(root, 'dist')
const releaseDir = join(root, 'release')
const publicDir = join(root, 'public')

function copyBuiltDists(releaseTarget) {
  cpSync(distDir, releaseTarget, { recursive: true })
}

function inlineBuiltAssets(releaseTarget) {
  const indexPath = join(releaseTarget, 'index.html')
  let html = readFileSync(indexPath, 'utf8')

  const scriptPattern = /<script[^>]*\bsrc="\.\/assets\/([^"]+)"[^>]*><\/script>/g
  const expectedScriptClosings = (html.match(scriptPattern) || []).length
  html = html.replace(scriptPattern, (fullTag, assetName) => {
    const assetPath = join(releaseTarget, 'assets', assetName)
    if (!existsSync(assetPath)) throw new Error(`Missing JS asset: ${assetName}`)
    const js = readFileSync(assetPath, 'utf8')
    // Escape closing script sequences inside the bundle without touching the real HTML close tag.
    const safeJs = js.split('</script').join('<\\/script')
    const attributes = fullTag.slice(0, fullTag.indexOf('>')).replace(/\ssrc="[^"]*"/, '')
    rmSync(assetPath)
    return `${attributes}>\n${safeJs}\n</script>`
  })

  const stylePattern = /<link[^>]*\bhref="\.\/assets\/([^"]+)"[^>]*>/g
  html = html.replace(stylePattern, (_tag, assetName) => {
    const assetPath = join(releaseTarget, 'assets', assetName)
    if (!existsSync(assetPath)) throw new Error(`Missing CSS asset: ${assetName}`)
    const css = readFileSync(assetPath, 'utf8')
    rmSync(assetPath)
    return `<style>${css}</style>`
  })

  writeFileSync(indexPath, html, 'utf8')

  const leftover = readdirSync(join(releaseTarget, 'assets'))
  if (leftover.length === 0) {
    rmSync(join(releaseTarget, 'assets'), { recursive: true })
  }

  return expectedScriptClosings
}

function copySupportingFiles(releaseTarget) {
  for (const file of ['favicon.svg', 'icons.svg']) {
    const source = join(publicDir, file)
    if (!existsSync(source)) throw new Error(`Missing public file: ${file}`)
    cpSync(source, join(releaseTarget, file))
  }

  const tmSource = join(publicDir, 'tm')
  if (existsSync(tmSource)) {
    cpSync(tmSource, join(releaseTarget, 'tm'), { recursive: true })
  }

  const filesSource = join(publicDir, 'files')
  if (existsSync(filesSource)) {
    cpSync(filesSource, join(releaseTarget, 'files'), { recursive: true })
  }
}

function createZip(version, releaseTarget) {
  const zipPath = join(releaseDir, `tips-studio-${version}.zip`)
  if (existsSync(zipPath)) rmSync(zipPath)

  const entries = ['favicon.svg', 'icons.svg', 'index.html']
  if (existsSync(join(releaseTarget, 'tm'))) entries.push('tm')
  if (existsSync(join(releaseTarget, 'files'))) entries.push('files')

  execFileSync('tar', ['-a', '-c', '-f', zipPath, '-C', releaseTarget, ...entries], { stdio: 'inherit' })
  return zipPath
}

function verify(releaseTarget, expectedScriptClosings) {
  const indexPath = join(releaseTarget, 'index.html')
  const html = readFileSync(indexPath, 'utf8')

  const scriptClosings = (html.match(/<\/script>/g) || []).length
  if (scriptClosings !== expectedScriptClosings) {
    throw new Error(`Unexpected script close tags in release HTML: expected=${expectedScriptClosings} found=${scriptClosings}`)
  }

  if (!html.includes('<script type="module"')) {
    throw new Error('Release HTML is missing the inlined module script')
  }

  if (/src="\.\/assets\//.test(html) || /href="\.\/assets\//.test(html)) {
    throw new Error('Release HTML still references bundled assets; inlining did not finish')
  }

  if (existsSync(join(releaseTarget, 'assets'))) {
    const leftover = readdirSync(join(releaseTarget, 'assets'))
    if (leftover.length > 0) {
      throw new Error(`Release still contains un-inlined assets: ${leftover.join(', ')}`)
    }
  }

  if (!html.includes('<div id="root"></div>')) {
    throw new Error('Release HTML is missing the root mount node')
  }

  console.log(`Verified ${basename(indexPath)}: script tags balanced, assets inlined.`)
}

// Keep the release root available without touching previous version folders.
function ensureReleaseRoot() {
  if (!existsSync(releaseDir)) mkdirSync(releaseDir, { recursive: true })
}

const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version
const releaseTarget = join(releaseDir, `tips-studio-${version}`)

ensureReleaseRoot()
if (existsSync(releaseTarget)) rmSync(releaseTarget, { recursive: true })
mkdirSync(releaseTarget, { recursive: true })

copyBuiltDists(releaseTarget)
console.log(`Bundled build copied to ${releaseTarget}`)

const expectedScriptClosings = inlineBuiltAssets(releaseTarget)
copySupportingFiles(releaseTarget)
verify(releaseTarget, expectedScriptClosings)

const zipPath = createZip(version, releaseTarget)
console.log(`Created ${zipPath}`)
