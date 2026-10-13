#!/usr/bin/env node
/**
 * Build language-scoped speech plans from lesson JSON (no audio is generated).
 *
 *   node content/tools/build_plans.mjs --language fr --lessons-dir content/fr/A1/lessons --range 1-3
 *   node content/tools/build_plans.mjs --language fr --lessons-dir /tmp/fr/lessons \
 *     --audio-dir /tmp/fr/audio --meta-path /tmp/fr/plans-meta.json --range 1-1
 *
 * English keeps its established content/audio/ layout. French and Spanish are
 * isolated under content/audio/fr/ and content/audio/es/. Existing plans are not
 * replaced unless --overwrite is explicit.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const TOOL_DIR = dirname(fileURLToPath(import.meta.url))
const CONFIG = JSON.parse(readFileSync(join(TOOL_DIR, 'language-config.json'), 'utf8'))
const usage = `Usage: node content/tools/build_plans.mjs --language <en|fr|es> --lessons-dir <path> --range <from-to> [--audio-dir <path>] [--meta-path <path>] [--overwrite]`
const resolvePath = (p) => isAbsolute(p) ? p : resolve(ROOT, p)
const isWithin = (path, parent) => { const rel = relative(parent, path); return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel)) }
const normalizeLabel = (line) => /^\s*([\p{L}][\p{L} .'-]{0,24}):\s*/u.exec(line)?.[1] ?? null
const slug = (text) => String(text).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '')

const EN_NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const EN_TENS = { 2: 'twenty', 3: 'thirty', 4: 'forty', 5: 'fifty', 6: 'sixty', 7: 'seventy', 8: 'eighty', 9: 'ninety' }
const EN_DAYS = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }
function spellEnglishNumber(raw) {
  const n = Number(raw)
  if (!Number.isSafeInteger(n) || n < 0) return String(raw).split('').map((digit) => EN_NUMBERS[Number(digit)]).join(' ')
  if (n < 20) return EN_NUMBERS[n]
  if (n < 100) return `${EN_TENS[Math.floor(n / 10)]}${n % 10 ? ` ${EN_NUMBERS[n % 10]}` : ''}`
  return String(raw).split('').map((digit) => EN_NUMBERS[Number(digit)]).join(' ')
}

export function normalizeTts(raw, language = 'en') {
  let text = String(raw ?? '')
    .replace(/^\s*[\p{L}][\p{L} .'-]{0,24}:\s*/gmu, '')
    .replace(/…/g, '.')
    .replace(/[“”]/g, '"')
    .replace(/\s*\/[^/\s]+\/\s*/g, ' ')
  if (language === 'en') {
    text = text
      .replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b\.?/g, (match) => EN_DAYS[match.replace('.', '')] ?? match)
      .replace(/\b(\d{4})\b/g, (match) => match.split('').map((digit) => EN_NUMBERS[Number(digit)]).join(' '))
      .replace(/\b(\d+)\b/g, (match) => spellEnglishNumber(match))
  }
  return text.replace(/\s{2,}/g, ' ').replace(/^[.\s]+/, '').trim()
}

function parseArgs(argv) {
  const options = { overwrite: false, positional: [] }
  const keys = { language: 'language', 'lessons-dir': 'lessonsDir', 'audio-dir': 'audioDir', 'meta-path': 'metaPath', range: 'range' }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--overwrite') { options.overwrite = true; continue }
    const equal = /^--([^=]+)=(.*)$/.exec(arg)
    if (equal && keys[equal[1]]) { options[keys[equal[1]]] = equal[2]; continue }
    if (arg.startsWith('--') && keys[arg.slice(2)]) {
      const value = argv[++i]
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}\n${usage}`)
      options[keys[arg.slice(2)]] = value
      continue
    }
    if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}\n${usage}`)
    options.positional.push(arg)
  }
  if (options.positional.length > 1) throw new Error(`Only one positional lessons directory is supported.\n${usage}`)
  options.lessonsDir ??= options.positional[0]
  return options
}

function inferLanguage(path) {
  if (!path) return null
  const rel = relative(ROOT, path).split('\\').join('/')
  return /^content\/(en|fr|es)(?:\/|$)/i.exec(rel)?.[1]?.toLowerCase() ?? null
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!options.range) throw new Error(`--range is required to protect unrelated plan files.\n${usage}`)
  const hinted = options.lessonsDir ? resolvePath(options.lessonsDir) : null
  const inferred = inferLanguage(hinted)
  const language = options.language ?? inferred ?? 'en'
  const languageConfig = CONFIG.languages[language]
  if (!languageConfig) throw new Error(`Unsupported language: ${language}\n${usage}`)
  if (inferred && inferred !== language) throw new Error(`Language mismatch: --language ${language}, but lessons path belongs to ${inferred}`)
  const lessonsDir = hinted ?? CONFIG.levels.map((level) => resolvePath(`${languageConfig.lesson_root}/${level}/lessons`)).find(existsSync)
  if (!lessonsDir || !existsSync(lessonsDir)) throw new Error(`Lessons directory does not exist.\n${usage}`)
  const audioDir = options.audioDir ? resolvePath(options.audioDir) : resolvePath(languageConfig.audio_root)
  const configuredAudioDir = resolvePath(languageConfig.audio_root)
  const productionAudioRoot = resolve(ROOT, 'content/audio')
  if (isWithin(audioDir, productionAudioRoot) && audioDir !== configuredAudioDir)
    throw new Error(`Refusing cross-language audio output: ${audioDir}; expected ${configuredAudioDir}`)
  const metaPath = options.metaPath ? resolvePath(options.metaPath) : resolvePath(languageConfig.plans_meta)
  if (isWithin(metaPath, productionAudioRoot) && metaPath !== resolvePath(languageConfig.plans_meta))
    throw new Error(`Refusing shared/cross-language plans metadata path: ${metaPath}; expected ${resolvePath(languageConfig.plans_meta)}`)
  const rangeMatch = options.range?.match(/^L?(\d{1,3})-L?(\d{1,3})$/i)
  if (options.range && !rangeMatch) throw new Error(`Invalid range ${options.range}; use 1-3 or L001-L003.`)
  const from = rangeMatch ? Number(rangeMatch[1]) : undefined
  const to = rangeMatch ? Number(rangeMatch[2]) : undefined
  if (from !== undefined && (from < 1 || to > 999 || from > to)) throw new Error(`Invalid lesson range ${options.range}`)

  const files = readdirSync(lessonsDir).filter((file) => /^L\d{3}\.json$/i.test(file)).sort()
  const selected = files.filter((file) => {
    const number = Number(file.slice(1, 4))
    return from === undefined || (number >= from && number <= to)
  }).map((file) => join(lessonsDir, file))
  if (!selected.length) throw new Error(`No lessons found in selected range in ${lessonsDir}`)
  if (from !== undefined) {
    const found = new Set(selected.map((path) => Number(basename(path).slice(1, 4))))
    const missing = Array.from({ length: to - from + 1 }, (_, i) => from + i).filter((n) => !found.has(n))
    if (missing.length) throw new Error(`Missing lessons in selected range: ${missing.map((n) => `L${String(n).padStart(3, '0')}`).join(', ')}`)
  }
  const lessons = selected.map((path) => ({ path, doc: JSON.parse(readFileSync(path, 'utf8')) }))
  for (const { path, doc } of lessons) {
    if (doc.lesson?.language_code !== language) throw new Error(`${path}: lesson language ${doc.lesson?.language_code} does not match ${language}`)
  }
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'))
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) throw new Error(`Invalid plans metadata object: ${metaPath}`)

  const plans = []
  for (const { path, doc } of lessons) {
    const id = `L${String(doc.lesson.order_index).padStart(3, '0')}`
    const mapping = meta[id]
    if (!mapping) throw new Error(`Missing language-scoped metadata for ${id}: ${metaPath}`)
    const prefix = languageConfig.voice_prefix
    const readRole = mapping.reading_role ?? `${prefix}-READ-F`
    if (!readRole.startsWith(`${prefix}-`)) throw new Error(`${metaPath}:${id} has cross-language reading role ${readRole}`)
    for (const [label, role] of Object.entries(mapping.listening_roles ?? {})) {
      if (!role.startsWith(`${prefix}-`)) throw new Error(`${metaPath}:${id} listening role for ${label} is outside ${prefix} namespace: ${role}`)
    }
    const clips = []
    const push = (clip) => clips.push({ ...clip, chars: clip.tts_text.length })
    const c = doc.content
    const charRole = (speaker) => `${prefix}-CHAR-${speaker === 'B' ? 'B' : 'A'}`

    c.dialogue.lines.forEach((line, i) => push({
      id: `${id}-${language}-dialogue-${i + 1}`, role: charRole(line.speaker), source: `dialogue.lines[${i}]`,
      tts_text: normalizeTts(line.target, language), priority: 'P1', language,
    }))

    const rawLines = String(c.listening.script ?? '').split('\n').map((line) => line.trim()).filter(Boolean)
    const labels = rawLines.map(normalizeLabel)
    const uniqueLabels = [...new Set(labels.filter(Boolean))]
    rawLines.forEach((line, i) => {
      const label = labels[i]
      let role
      if (mapping.listening_roles && label && mapping.listening_roles[label]) role = mapping.listening_roles[label]
      else if (uniqueLabels.length <= 1) role = readRole
      else role = charRole(i % 2 === 0 ? 'A' : 'B')
      push({ id: `${id}-${language}-listening-${i + 1}`, role, source: `listening.script[${i}]`, tts_text: normalizeTts(line, language), priority: 'P1', language })
    })

    c.vocabulary.items.forEach((vocab, i) => push({
      id: `${id}-${language}-vocab-${slug(vocab.term)}`, role: `${prefix}-VOCAB`, source: `vocabulary.items[${i}]`,
      tts_text: normalizeTts(`${vocab.term}. ${vocab.example}`, language), priority: 'P2', language,
    }))
    c.grammar.table.rows.forEach((row, i) => push({
      id: `${id}-${language}-grammar-row-${i + 1}`, role: `${prefix}-VOCAB`, source: `grammar.table.rows[${i}]`,
      tts_text: normalizeTts(row[1], language), priority: 'P2', language,
    }))
    c.examples.items.forEach((example, i) => push({
      id: `${id}-${language}-examples-${i + 1}`, role: `${prefix}-VOCAB`, source: `examples.items[${i}]`,
      tts_text: normalizeTts(example.target, language), priority: 'P3', language,
    }))
    push({ id: `${id}-${language}-reading`, role: readRole, source: 'reading.text', tts_text: normalizeTts(c.reading.text, language), priority: 'P4', language })
    for (const item of mapping.fa ?? []) push({
      id: `${id}-fa-${item.name}`, role: 'FA-COACH', source: item.source,
      tts_text: normalizeTts(item.tts_text, 'fa'), priority: item.priority ?? 'P2', language: 'fa',
    })
    for (const sample of mapping.samples ?? []) {
      const clip = clips.find((item) => item.id === sample.id)
      if (clip) { clip.sample = true; clip.file = sample.file }
      else console.warn(`Warning: sample ${sample.id} is not in ${id} plan; ignored.`)
    }
    plans.push({ id, path: join(audioDir, `${id}.plan.json`), doc: {
      lesson: id, language, level: doc.lesson.level ?? 'A1', needs_audio: Boolean(c.listening?.needs_audio),
      voice_registry_ref: languageConfig.voice_registry, generated_by: 'content/tools/build_plans.mjs',
      mapping_note: 'Speaker labels in the listening script select the matching role; an unlabelled monologue uses the reading role.',
      clips,
    } })
  }

  const existing = plans.filter((plan) => existsSync(plan.path))
  if (existing.length && !options.overwrite) throw new Error(`Refusing to overwrite existing audio plan(s): ${existing.map((plan) => plan.id).join(', ')}. Use --overwrite only for an intentional rebuild.`)
  mkdirSync(audioDir, { recursive: true })
  for (const plan of plans) {
    writeFileSync(plan.path, JSON.stringify(plan.doc, null, 2) + '\n', { flag: options.overwrite ? 'w' : 'wx' })
    console.log(`${plan.id}: ${plan.doc.clips.length} clips (${language} ${plan.doc.clips.filter((clip) => clip.language === language).length} · fa ${plan.doc.clips.filter((clip) => clip.language === 'fa').length})`)
  }
  console.log(`\nWrote ${plans.length} plan(s) to ${audioDir} (${language}). No audio files were generated.`)
}

try { main() } catch (error) { console.error(`ERROR: ${error.message}`); process.exit(1) }
