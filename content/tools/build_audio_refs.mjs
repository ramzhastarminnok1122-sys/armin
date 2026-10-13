#!/usr/bin/env node
/**
 * Build lesson audio references only from present MP3s with a plausible MPEG Layer III frame.
 *
 * Safe by default: dry-run only. Add --apply to write lesson JSON and the language-scoped
 * registry. French/Spanish use separate plans, generated directories, and registries.
 * Use --replace only when intentionally replacing non-empty audio references.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync, mkdirSync, renameSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { sectionOf, orderIn, dialogueIndex } from './lib/audio-map.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const TOOL_DIR = dirname(fileURLToPath(import.meta.url))
const CONFIG = JSON.parse(readFileSync(join(TOOL_DIR, 'language-config.json'), 'utf8'))
const resolvePath = (p) => isAbsolute(p) ? p : resolve(ROOT, p)
const isWithin = (path, parent) => { const rel = relative(parent, path); return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel)) }
const usage = 'Usage: node content/tools/build_audio_refs.mjs --language <en|fr|es> [--lessons-dir path] [--audio-dir path] [--range from-to] [--apply] [--replace]'

function parseArgs(argv) {
  const opts = { apply: false, replace: false, positional: [] }
  const keys = { language: 'language', 'lessons-dir': 'lessonsDir', 'audio-dir': 'audioDir', 'registry-path': 'registryPath', range: 'range' }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--apply') { opts.apply = true; continue }
    if (arg === '--replace') { opts.replace = true; continue }
    const eq = /^--([^=]+)=(.*)$/.exec(arg)
    if (eq && keys[eq[1]]) { opts[keys[eq[1]]] = eq[2]; continue }
    if (arg.startsWith('--') && keys[arg.slice(2)]) {
      const value = argv[++i]
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}. ${usage}`)
      opts[keys[arg.slice(2)]] = value
      continue
    }
    if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}. ${usage}`)
    opts.positional.push(arg)
  }
  return opts
}

function mp3FramePresent(filePath) {
  let data
  try { data = readFileSync(filePath) } catch { return false }
  let start = 0
  if (data.subarray(0, 3).toString() === 'ID3' && data.length >= 10) {
    const size = (data[6] & 0x7f) * 2 ** 21 + (data[7] & 0x7f) * 2 ** 14 + (data[8] & 0x7f) * 2 ** 7 + (data[9] & 0x7f)
    start = 10 + size + ((data[5] & 0x10) ? 10 : 0)
  }
  const limit = Math.min(data.length - 3, start + 8192)
  for (let i = start; i < limit; i++) {
    const h = data.readUInt32BE(i)
    const version = (h >>> 19) & 3, layer = (h >>> 17) & 3
    const bitrate = (h >>> 12) & 15, sampleRate = (h >>> 10) & 3
    if ((h >>> 21) === 0x7ff && version !== 1 && layer === 1 && bitrate !== 0 && bitrate !== 15 && sampleRate !== 3) return true
  }
  return false
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.positional.length && opts.positional.some((x) => !/^L\d{3}$/.test(x))) throw new Error(`Lesson IDs must look like L001. ${usage}`)
  const lessonsDir = opts.lessonsDir ? resolvePath(opts.lessonsDir) : null
  const inferred = lessonsDir ? /^content\/(en|fr|es)\//i.exec(relative(ROOT, lessonsDir).split('\\').join('/'))?.[1]?.toLowerCase() : null
  const language = opts.language ?? inferred ?? 'en'
  const languageConfig = CONFIG.languages[language]
  if (!languageConfig) throw new Error(`Unsupported language ${language}. ${usage}`)
  if (inferred && inferred !== language) throw new Error(`Language mismatch: --language ${language}, but lessons directory belongs to ${inferred}`)
  const selectedLessonsDir = lessonsDir ?? resolvePath(`${languageConfig.lesson_root}/B1/lessons`)
  if (!existsSync(selectedLessonsDir)) throw new Error(`Lessons directory does not exist: ${selectedLessonsDir}`)
  const audioDir = opts.audioDir ? resolvePath(opts.audioDir) : resolvePath(languageConfig.audio_root)
  const configuredAudioDir = resolvePath(languageConfig.audio_root)
  const productionAudioRoot = resolve(ROOT, 'content/audio')
  if (isWithin(audioDir, productionAudioRoot) && audioDir !== configuredAudioDir)
    throw new Error(`Refusing cross-language audio output: ${audioDir}; expected ${configuredAudioDir}`)
  const registryPath = opts.registryPath ? resolvePath(opts.registryPath) : join(audioDir, 'registry.json')
  const configuredRegistry = join(configuredAudioDir, 'registry.json')
  if (isWithin(registryPath, productionAudioRoot) && registryPath !== configuredRegistry)
    throw new Error(`Refusing shared/cross-language audio registry path: ${registryPath}; expected ${configuredRegistry}`)
  const match = opts.range?.match(/^L?(\d{1,3})-L?(\d{1,3})$/i)
  if (opts.range && !match) throw new Error(`Invalid range ${opts.range}. Use 1-3 or L001-L003.`)
  const from = match ? Number(match[1]) : undefined, to = match ? Number(match[2]) : undefined
  const requested = new Set(opts.positional)
  if (opts.apply && from === undefined && requested.size === 0)
    throw new Error('Applying audio references requires an explicit --range or lesson ID list to protect unrelated lessons.')
  const files = readdirSync(selectedLessonsDir).filter((name) => /^L\d{3}\.json$/i.test(name)).sort()
  const selected = files.filter((name) => {
    const number = Number(name.slice(1, 4)), id = name.slice(0, 4)
    return (!requested.size || requested.has(id)) && (from === undefined || (number >= from && number <= to))
  }).map((name) => join(selectedLessonsDir, name))
  if (!selected.length) throw new Error('No lessons selected')
  if (from !== undefined) {
    const found = new Set(selected.map((path) => Number(basename(path).slice(1, 4))))
    const missing = Array.from({ length: to - from + 1 }, (_, i) => from + i).filter((n) => !found.has(n))
    if (missing.length) throw new Error(`Missing lessons in selected range: ${missing.map((n) => `L${String(n).padStart(3, '0')}`).join(', ')}`)
  }

  const registry = existsSync(registryPath) ? JSON.parse(readFileSync(registryPath, 'utf8')) : { clips: {} }
  if (!registry.clips || typeof registry.clips !== 'object' || Array.isArray(registry.clips)) registry.clips = {}
  const changes = []
  const report = []
  for (const lessonPath of selected) {
    const lesson = JSON.parse(readFileSync(lessonPath, 'utf8'))
    const id = basename(lessonPath, '.json')
    if (lesson.lesson?.language_code !== language) throw new Error(`${lessonPath}: lesson language does not match ${language}`)
    const planPath = join(audioDir, `${id}.plan.json`)
    const plan = existsSync(planPath) ? JSON.parse(readFileSync(planPath, 'utf8')) : null
    if (!plan) throw new Error(`Missing audio plan: ${planPath}`)
    if (plan.language !== language) throw new Error(`${planPath}: plan language does not match ${language}`)
    const lines = lesson.content?.dialogue?.lines ?? []
    const out = {}
    let validFiles = 0, invalidFiles = 0
    for (const clip of plan.clips ?? []) {
      const file = join(audioDir, 'generated', id, `${clip.id}.mp3`)
      if (!existsSync(file) || statSync(file).size <= 512) continue
      if (!mp3FramePresent(file)) { invalidFiles++; continue }
      const section = sectionOf(clip)
      if (!section) continue
      const buffer = readFileSync(file)
      const hash8 = createHash('sha256').update(buffer).digest('hex').slice(0, 8)
      const ref = { id: clip.id, section, lang: clip.language, role: clip.role, text: clip.tts_text, path: `${clip.language}/${hash8}.mp3`, hash: hash8, bytes: buffer.length }
      const lineIndex = dialogueIndex(clip)
      if (lineIndex !== null) {
        ref.line = lineIndex
        if (lines[lineIndex]?.speaker) ref.speaker = lines[lineIndex].speaker
      }
      ;(out[section] = out[section] ?? []).push(ref)
      registry.clips[clip.id] = {
        lesson: id, section, lang: clip.language, role: clip.role,
        file: relative(ROOT, file).split('\\').join('/'), hash: hash8, bytes: buffer.length,
        path: ref.path, uploaded: registry.clips[clip.id]?.uploaded ?? false,
        public_url: registry.clips[clip.id]?.public_url ?? null,
        verified_at: registry.clips[clip.id]?.verified_at ?? null,
      }
      validFiles++
    }
    const fixed = {}
    for (const section of Object.keys(out).sort()) {
      out[section].sort((a, b) => orderIn(a) - orderIn(b))
      fixed[section] = out[section]
    }
    const existingRefs = Object.values(lesson.content?.audio ?? {}).flat()
    if (existingRefs.length && !opts.replace && opts.apply) throw new Error(`${id} already has audio references; pass --replace only to deliberately replace them.`)
    const oldAudio = lesson.content.audio
    lesson.content.audio = fixed
    const same = JSON.stringify(oldAudio) === JSON.stringify(fixed)
    changes.push({ id, lessonPath, lesson, same })
    report.push(`${id}: ${Object.values(fixed).flat().length} verified refs in ${Object.keys(fixed).length} sections; invalid MP3s skipped: ${invalidFiles}`)
  }
  report.forEach((line) => console.log(line))
  console.log(`Mode: ${opts.apply ? 'apply' : 'dry-run'} · language: ${language} · selected: ${selected.length}`)
  if (!opts.apply) return
  registry.generated_at = new Date().toISOString()
  registry.bucket = 'lesson-audio'
  registry.path_rule = '<lang>/<hash8>.mp3'
  registry.language = language
  for (const item of changes) {
    if (item.same) continue
    const temp = `${item.lessonPath}.tmp-${process.pid}`
    writeFileSync(temp, JSON.stringify(item.lesson, null, 2) + '\n')
    renameSync(temp, item.lessonPath)
  }
  mkdirSync(dirname(registryPath), { recursive: true })
  const registryTemp = `${registryPath}.tmp-${process.pid}`
  writeFileSync(registryTemp, JSON.stringify(registry, null, 2) + '\n')
  renameSync(registryTemp, registryPath)
  console.log(`Applied lesson refs and registry: ${relative(ROOT, registryPath).split('\\').join('/')}`)
}

try { main() } catch (error) { console.error(`ERROR: ${error.message}`); process.exit(1) }
