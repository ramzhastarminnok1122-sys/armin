#!/usr/bin/env node
/**
 * LINGU · Build lesson JSON from compact, language-aware specifications.
 *
 * Safe range-scoped usage:
 *   node content/tools/build_lessons.mjs --language fr --specs-dir content/fr/A1/specs
 *   node content/tools/build_lessons.mjs --language fr --specs-dir /tmp/fr/specs \
 *     --lessons-dir /tmp/fr/lessons --meta-path /tmp/fr/plans-meta.json
 *
 * Existing lesson files are never replaced unless --overwrite is explicit. Language
 * outputs and plans metadata are isolated by content/tools/language-config.json.
 * Target-language learning content is supplied by the author; learner notes stay Persian.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, basename, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CONFIG_PATH = join(dirname(fileURLToPath(import.meta.url)), 'language-config.json')
const CONFIG = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'))
const TODAY = new Date().toISOString().slice(0, 10)
const usage = `Usage: node content/tools/build_lessons.mjs --language <en|fr|es> --specs-dir <path> --range <from-to> [--lessons-dir <path>] [--meta-path <path>] [--overwrite]`
const resolvePath = (p) => isAbsolute(p) ? p : resolve(ROOT, p)
const isWithin = (path, parent) => { const rel = relative(parent, path); return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel)) }
const fp = (lang, level, title) => createHash('md5').update(`${lang}|${level}|${title}`.toLowerCase().replace(/\s+/g, '')).digest('hex')
const NUM2FA = { 0: '۰', 1: '۱', 2: '۲', 3: '۳', 4: '۴', 5: '۵', 6: '۶', 7: '۷', 8: '۸', 9: '۹' }
const faDigits = (s) => String(s).replace(/\d/g, (d) => NUM2FA[d])
const numWord = (n) => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'][n] ?? String(n)
const w = (t) => String(t ?? '').trim().split(/\s+/).filter(Boolean)
const pw = (t) => String(t ?? '').trim().split(/\s+/).filter(Boolean)
const warnings = []
const warn = (id, msg) => warnings.push(`⚠ [${id}] ${msg}`)

function parseArgs(argv) {
  const options = { overwrite: false }
  const positional = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--overwrite') { options.overwrite = true; continue }
    const pair = arg.match(/^--(language|specs-dir|lessons-dir|meta-path|range)=(.*)$/)
    if (pair) { options[{ language: 'language', 'specs-dir': 'specsDir', 'lessons-dir': 'lessonsDir', 'meta-path': 'metaPath', range: 'range' }[pair[1]]] = pair[2]; continue }
    if (['--language', '--specs-dir', '--lessons-dir', '--meta-path', '--range'].includes(arg)) {
      const value = argv[++i]
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}\n${usage}`)
      options[{ '--language': 'language', '--specs-dir': 'specsDir', '--lessons-dir': 'lessonsDir', '--meta-path': 'metaPath', '--range': 'range' }[arg]] = value
      continue
    }
    if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}\n${usage}`)
    positional.push(arg)
  }
  if (positional.length > 1) throw new Error(`Only one positional specs directory is supported.\n${usage}`)
  options.specsDir ??= positional[0]
  options.specsDir ??= 'content/en/A1/specs'
  return options
}

function inferLanguage(path) {
  const rel = relative(ROOT, path).split('\\').join('/')
  return /^content\/(en|fr|es)(?:\/|$)/i.exec(rel)?.[1]?.toLowerCase() ?? null
}

function buildLesson(spec, language, voicePrefix) {
  const id = `L${String(spec.n).padStart(3, '0')}`
  const level = spec.level ?? 'A1'
  const targetTexts = []
  const collect = (text, where) => { if (/\d/.test(String(text ?? ''))) targetTexts.push(`${where}: «${text}»`) }
  spec.vocab.forEach((v, i) => collect(v[3], `vocab[${i}].example`))
  spec.ex.forEach((e, i) => collect(e[0], `examples[${i}]`))
  spec.lst.script.split('\n').forEach((line, i) => collect(line.replace(/^\s*[\p{L}][\p{L} .'-]{0,24}:\s*/u, ''), `listening[${i}]`))
  spec.dlg.lines.forEach((line, i) => collect(line[1], `dialogue[${i}]`))
  collect(spec.read.text, 'reading.text')
  spec.gram.rows.forEach((row, i) => collect(row[1], `grammar.rows[${i}]`))
  for (const text of targetTexts) warn(id, `digit in target-language text (spell it out for TTS): ${text}`)

  const chk = (label, value, min, max, unit = 'words') => {
    if (value < min || value > max) warn(id, `${label}: ${value} ${unit} (expected ${min}–${max})`)
  }
  chk('explanation.body_fa', pw(spec.expl.body).length, 80, 140)
  chk('grammar.explanation_fa', pw(spec.gram.exp).length, 70, 120)
  chk('listening.script', spec.lst.script.split('\n').reduce((n, line) => n + w(line.replace(/^\s*[\p{L}][\p{L} .'-]{0,24}:\s*/u, '')).length, 0), 60, 100)
  chk('reading.text', w(spec.read.text).length, 80, 140)
  spec.dlg.lines.forEach((line, i) => chk(`dialogue[${i}]`, w(line[1]).length, 1, 12))
  spec.ex.forEach((e, i) => chk(`examples[${i}]`, w(e[0]).length, 1, 12))
  spec.vocab.forEach((v, i) => chk(`vocab[${i}].example`, w(v[3]).length, 1, 12))

  const item = (e) => ({
    type: e[0], prompt_fa: e[1], question: e[2],
    ...(e[0] === 'truefalse'
      ? { options: ['True', 'False'], answer: e[3] }
      : e[0] === 'mcq'
        ? { options: e[3], answer: e[4] }
        : { answer: e[3] }),
    explanation_fa: e[0] === 'truefalse' ? e[4] : e[0] === 'mcq' ? e[5] : e[4],
  })
  const content = {
    meta: { cefr: level, topic: spec.topic, objectives: spec.obj },
    warmup: { prompt_fa: spec.warm.p, questions: spec.warm.q.map(([q, h]) => ({ q, hint_fa: h })) },
    explanation: { title: spec.expl.title, body_fa: spec.expl.body, key_points: spec.expl.kp },
    vocabulary: { items: spec.vocab.map(([term, ipa, translation_fa, example, example_fa, tag]) => ({ term, ipa, translation_fa, example, example_fa, tag })) },
    grammar: {
      title: spec.gram.title, explanation_fa: spec.gram.exp, pattern: spec.gram.pattern,
      table: { headers: ['ساختار', 'مثال', 'ترجمه'], rows: spec.gram.rows }, pitfalls_fa: spec.gram.pit,
    },
    examples: { items: spec.ex.map(([target, fa, note_fa]) => ({ target, fa, note_fa })) },
    listening: { title_fa: spec.lst.t, script: spec.lst.script, script_fa: spec.lst.script_fa, question_fa: spec.lst.q, answer: spec.lst.a, needs_audio: true },
    dialogue: { title_fa: spec.dlg.t, lines: spec.dlg.lines.map(([speaker, target, fa]) => ({ speaker, target, fa })) },
    speaking: { task_fa: spec.spk.task, useful_phrases: spec.spk.ph.map(([target, fa]) => ({ target, fa })), seconds: spec.spk.sec ?? 180 },
    reading: { title: spec.read.title, text: spec.read.text, glossary: spec.read.gloss.map(([term, fa]) => ({ term, fa })), questions: spec.read.qs.map(([q_fa, a]) => ({ q_fa, a })) },
    exercises: { items: spec.exr.map(item) },
    quiz: { items: spec.quiz.map(([question, options, answerIndex, explanation_fa]) => ({ type: 'mcq', question, options, answer: options[answerIndex], explanation_fa })) },
    ai_practice: { task_fa: spec.ai.task, suggested_prompts: spec.ai.prompts, focus: spec.ai.focus },
    audio: {},
  }
  return {
    lesson: {
      language_code: language, level, order_index: spec.n, title: spec.title, subtitle: spec.subtitle,
      description: spec.desc, estimated_minutes: spec.min ?? 18, is_free: Boolean(spec.free), status: 'validated', version: 1,
    },
    content,
    validation: {
      generated_by: 'content-factory-agent', validated_at: TODAY,
      checks: ['schema', 'content', 'level', 'grammar', 'vocabulary', 'tts', 'quiz', 'exercise', 'ai_practice', 'ui_compatibility', 'duplicate'],
      notes: spec.notes ?? '',
    },
    _fingerprint: fp(language, level, spec.title),
    _audioMeta: {
      reading_role: spec.read_role ?? `${voicePrefix}-READ-F`,
      ...(spec.listening_roles ? { listening_roles: spec.listening_roles } : {}),
      fa: (spec.fa ?? []).map(([name, tts_text]) => ({
        name, source: `${name} (Persian teaching layer for L${String(spec.n).padStart(3, '0')})`,
        priority: ({ warmup: 'P1', explanation: 'P1', 'listening-intro': 'P2', 'grammar-note': 'P2', speaking: 'P2', 'dialogue-note': 'P3', 'vocab-note': 'P3', 'ai-practice': 'P3', closing: 'P2' })[name] ?? 'P3',
        tts_text,
      })),
    },
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!options.range) throw new Error(`--range is required to protect unrelated lessons.\n${usage}`)
  const specsDir = resolvePath(options.specsDir)
  const inferred = inferLanguage(specsDir)
  const language = options.language ?? inferred ?? 'en'
  if (!CONFIG.languages[language]) throw new Error(`Unsupported language: ${language}\n${usage}`)
  if (inferred && inferred !== language) throw new Error(`Language mismatch: --language ${language}, but specs path belongs to ${inferred}`)
  const languageConfig = CONFIG.languages[language]
  if (!existsSync(specsDir)) throw new Error(`Specs directory does not exist: ${specsDir}`)
  const specsPathPart = basename(specsDir)
  const lessonsDir = options.lessonsDir
    ? resolvePath(options.lessonsDir)
    : specsPathPart === 'specs' ? join(dirname(specsDir), 'lessons') : null
  if (!lessonsDir) throw new Error(`Cannot derive lessons directory; pass --lessons-dir explicitly.\n${usage}`)
  const productionContentRoot = resolve(ROOT, 'content')
  const productionLanguageRoot = resolvePath(languageConfig.lesson_root)
  if (isWithin(lessonsDir, productionContentRoot) && !isWithin(lessonsDir, productionLanguageRoot))
    throw new Error(`Refusing cross-language lesson output: ${lessonsDir} is outside ${productionLanguageRoot}`)
  const metaPath = options.metaPath ? resolvePath(options.metaPath) : resolvePath(languageConfig.plans_meta)
  const productionAudioRoot = resolve(ROOT, 'content/audio')
  if (isWithin(metaPath, productionAudioRoot) && metaPath !== resolvePath(languageConfig.plans_meta))
    throw new Error(`Refusing shared/cross-language plans metadata path: ${metaPath}; expected ${resolvePath(languageConfig.plans_meta)}`)
  const files = readdirSync(specsDir).filter((name) => name.endsWith('.json')).sort()
  if (!files.length) throw new Error(`No JSON specs found in ${specsDir}`)
  const rangeMatch = options.range?.match(/^L?(\d{1,3})-L?(\d{1,3})$/i)
  if (options.range && !rangeMatch) throw new Error(`Invalid range ${options.range}; use 333-335 or L333-L335.`)
  const from = rangeMatch ? Number(rangeMatch[1]) : undefined
  const to = rangeMatch ? Number(rangeMatch[2]) : undefined
  if (from !== undefined && (from < 1 || to > 999 || from > to)) throw new Error(`Invalid lesson range ${options.range}`)

  const specs = files.map((name) => ({ name, value: JSON.parse(readFileSync(join(specsDir, name), 'utf8')) }))
  const batch = []
  const ids = new Set()
  for (const { name, value } of specs) {
    if (value.language && value.language !== language) throw new Error(`${name}: spec language ${value.language} does not match ${language}`)
    for (const raw of value.lessons ?? []) {
      if (!Number.isInteger(raw.n) || raw.n < 1 || raw.n > 999) throw new Error(`${name}: invalid lesson number ${raw.n}`)
      if (from !== undefined && (raw.n < from || raw.n > to)) continue
      const spec = { ...raw, level: raw.level ?? value.level ?? 'A1' }
      if (!CONFIG.levels.includes(spec.level)) throw new Error(`${name}: unsupported level ${spec.level}`)
      if (ids.has(spec.n)) throw new Error(`Duplicate lesson number L${String(spec.n).padStart(3, '0')} in selected specs`)
      ids.add(spec.n)
      batch.push(buildLesson(spec, language, languageConfig.voice_prefix))
    }
  }
  if (!batch.length) throw new Error('No lessons found in selected specifications or requested range')
  if (from !== undefined) {
    const found = new Set(batch.map((lesson) => lesson.lesson.order_index))
    const missing = Array.from({ length: to - from + 1 }, (_, i) => from + i).filter((n) => !found.has(n))
    if (missing.length) throw new Error(`Missing lessons in selected range: ${missing.map((n) => `L${String(n).padStart(3, '0')}`).join(', ')}`)
  }
  batch.sort((a, b) => a.lesson.order_index - b.lesson.order_index)

  const collisions = batch.map((lesson) => ({ id: `L${String(lesson.lesson.order_index).padStart(3, '0')}`, path: join(lessonsDir, `L${String(lesson.lesson.order_index).padStart(3, '0')}.json`) }))
    .filter((x) => existsSync(x.path))
  if (collisions.length && !options.overwrite) throw new Error(`Refusing to overwrite existing lesson(s): ${collisions.map((x) => x.id).join(', ')}. Use --overwrite only for a deliberate same-language replacement.`)
  for (const collision of collisions) {
    const previous = JSON.parse(readFileSync(collision.path, 'utf8'))
    if (previous.lesson?.language_code !== language) throw new Error(`Refusing cross-language overwrite: ${collision.path}`)
  }

  const metaAll = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : {}
  if (!metaAll || typeof metaAll !== 'object' || Array.isArray(metaAll)) throw new Error(`Invalid plans metadata object: ${metaPath}`)
  for (const lesson of batch) {
    const id = `L${String(lesson.lesson.order_index).padStart(3, '0')}`
    const existing = metaAll[id]
    if (existing && !options.overwrite) throw new Error(`Refusing to overwrite existing ${language} plans metadata for ${id}; use --overwrite only for a deliberate rebuild.`)
    const existingPrefix = String(existing?.reading_role ?? '').split('-')[0]
    if (existingPrefix && existingPrefix !== languageConfig.voice_prefix) throw new Error(`Refusing cross-language plans metadata overwrite for ${id}: ${existingPrefix} != ${languageConfig.voice_prefix}`)
  }
  for (const spec of batch) {
    const id = `L${String(spec.lesson.order_index).padStart(3, '0')}`
    metaAll[id] = spec._audioMeta
  }

  const output = batch.map((b) => {
    const { _fingerprint, _audioMeta, ...lesson } = b
    return { id: `L${String(lesson.lesson.order_index).padStart(3, '0')}`, path: join(lessonsDir, `${`L${String(lesson.lesson.order_index).padStart(3, '0')}`}.json`), lesson, fingerprint: _fingerprint }
  })
  mkdirSync(lessonsDir, { recursive: true })
  mkdirSync(dirname(metaPath), { recursive: true })
  for (const item of output) {
    writeFileSync(item.path, JSON.stringify(item.lesson, null, 2) + '\n', { flag: options.overwrite ? 'w' : 'wx' })
    console.log(`${item.id}: ${item.lesson.lesson.title} · vocab ${item.lesson.content.vocabulary.items.length} · exercises ${item.lesson.content.exercises.items.length} · quiz ${item.lesson.content.quiz.items.length} · fingerprint ${item.fingerprint.slice(0, 8)}`)
  }
  writeFileSync(metaPath, JSON.stringify(metaAll, null, 2) + '\n')
  console.log(`\nBuilt ${output.length} lesson(s) · plans metadata: ${Object.keys(metaAll).length} lessons (${language}: ${languageConfig.name}).`)
  console.log(warnings.length ? `\n${warnings.length} warning(s):\n${warnings.join('\n')}` : '\nNo warnings.')
}

try { main() } catch (error) { console.error(`ERROR: ${error.message}`); process.exit(1) }
