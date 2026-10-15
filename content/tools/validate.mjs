#!/usr/bin/env node
/**
 * LINGU · Content Factory — اعتبارسنج محتوا (بدون هیچ وابستگی npm)
 *
 * اجرا:
 *   node content/tools/validate.mjs
 *   node content/tools/validate.mjs <lessons-dir> <audio-dir> --language en|fr|es --range 327-340 --context-root content/en
 *   node content/tools/validate.mjs --language fr --range 1-20
 *
 * خروجی: گزارش فارسی + کد خروج ۱ در صورت وجود خطا.
 * این ابزار فقط «می‌خواند» — هیچ چیزی در دیتابیس یا پروژه نمی‌نویسد.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { sectionOf, orderIn, dialogueIndex } from './lib/audio-map.mjs'

/* ----------------------------- project config ----------------------------- */
const TOOL_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(TOOL_DIR, '../..')
const LANGUAGE_CONFIG = JSON.parse(readFileSync(join(TOOL_DIR, 'language-config.json'), 'utf8'))
const SECTIONS = ['warmup', 'explanation', 'vocabulary', 'grammar', 'examples', 'listening',
  'dialogue', 'speaking', 'reading', 'exercises', 'quiz', 'ai_practice']
let TARGET_LANG = 'en'
const SUPPORTED_LANGS = Object.keys(LANGUAGE_CONFIG.languages)
const langPrefix = (lang) => LANGUAGE_CONFIG.languages[lang]?.voice_prefix ?? lang.toUpperCase()

const ALLOWED_KEYS = {
  meta: ['cefr', 'topic', 'objectives'],
  warmup: ['prompt_fa', 'questions'],
  explanation: ['title', 'body_fa', 'key_points'],
  vocabulary: ['items'],
  grammar: ['title', 'explanation_fa', 'pattern', 'table', 'pitfalls_fa'],
  examples: ['items'],
  listening: ['title_fa', 'script', 'script_fa', 'question_fa', 'answer', 'needs_audio'],
  dialogue: ['title_fa', 'lines'],
  speaking: ['task_fa', 'useful_phrases', 'seconds'],
  reading: ['title', 'text', 'glossary', 'questions'],
  exercises: ['items'],
  quiz: ['items'],
  ai_practice: ['task_fa', 'suggested_prompts', 'focus'],
}
const ITEM_KEYS = {
  vocab: ['term', 'ipa', 'translation_fa', 'example', 'example_fa', 'tag'],
  exercise: ['type', 'prompt_fa', 'question', 'options', 'answer', 'explanation_fa'],
  example: ['target', 'fa', 'note_fa'],
  line: ['speaker', 'target', 'fa'],
  gloss: ['term', 'fa'],
  rq: ['q_fa', 'a'],
  phrase: ['target', 'fa'],
  warm: ['q', 'hint_fa'],
}
const TAGS = ['فعل', 'اسم', 'صفت', 'قید', 'عبارت', 'حرف اضافه', 'ضمیر']
const EX_TYPES = ['mcq', 'truefalse', 'fill', 'short']
const SCENARIOS = ['کافه', 'سفر', 'فرودگاه', 'رستوران', 'خرید', 'مصاحبه کاری', 'مدرسه', 'آشنایی', 'زندگی روزمره']
const TECH = /\b(Supabase|Groq|Myket|API|Backend|Database|RLS|Schema|SKU|Token|Server|Migration|JSON|GitHub|Git|Deploy|CLI|Endpoint)\b/i
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/u
const ARABIC_YK = /[\u064A\u0643]/
const MARKDOWN = /\*\*|`|^#{1,6}\s|^\s*[-*]\s|\[[^\]]*\]\([^)]+\)/m
const GUIDES = ['«', '»', '؛', '،', '٫', '—']

/* --------------------------------- ابزارها -------------------------------- */
const words = (t) => String(t ?? '').trim().split(/\s+/).filter(Boolean)
const pWords = (t) => String(t ?? '').trim().split(/[\s]+/).filter(Boolean) // نیم‌فاصله = یک واژه
const stripSpeaker = (l) => l.replace(/^\s*[\p{L}][\p{L} .'-]{0,24}:\s*/u, '')
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim()
const sentences = (t) => String(t ?? '').split(/(?<=[.!?])\s+/).map(norm).filter((x) => x.split(' ').length >= 3)
const fp = (lang, level, title) => createHash('md5').update(`${lang}|${level}|${title}`.toLowerCase().replace(/\s+/g, '')).digest('hex')

let FAIL = 0, PASS = 0
const findings = []
const fail = (lesson, msg) => { FAIL++; findings.push(`✗ [${lesson}] ${msg}`) }
const ok = () => { PASS++ }
const expect = (lesson, cond, msg) => (cond ? ok() : fail(lesson, msg))

/* --------------------------------- درس‌ها --------------------------------- */
function validateLesson(path) {
  const id = basename(path, '.json')
  let file
  try { file = JSON.parse(readFileSync(path, 'utf8')) } catch (e) { return fail(id, `JSON خراب: ${e.message}`) }
  const L = file.lesson ?? {}
  const c = file.content ?? {}

  /* --- شکل فایل --- */
  for (const k of ['language_code', 'level', 'order_index', 'title', 'subtitle', 'description', 'estimated_minutes', 'is_free', 'status', 'version'])
    expect(id, L[k] !== undefined && L[k] !== null && L[k] !== '', `فیلد درس ناقص: ${k}`)
  expect(id, L.language_code === TARGET_LANG, `زبان باید ${TARGET_LANG} باشد`)
  expect(id, ['A1', 'A2', 'B1', 'B2'].includes(L.level), 'سطح باید یکی از A1/A2/B1/B2 باشد')
  expect(id, L.status === 'validated', 'وضعیت باید validated باشد (انتشار کار ادمین است)')
  expect(id, [15, 18].includes(L.estimated_minutes), 'estimated_minutes باید ۱۵ یا ۱۸ باشد')

  /* --- ۱۲ بخش و کلیدهای مجاز --- */
  const keys = Object.keys(c)
  expect(id, SECTIONS.every((s) => keys.includes(s)), `بخش‌های غایب: ${SECTIONS.filter((s) => !keys.includes(s)).join(', ')}`)
  for (const k of keys) expect(id, [...SECTIONS, 'meta', 'audio'].includes(k), `بخش ناشناخته (اسکیمای اختراعی): ${k}`)
  expect(id, c.audio === undefined || (typeof c.audio === 'object' && !Array.isArray(c.audio)), 'content.audio باید شیء باشد')
  for (const sec of Object.keys(c.audio ?? {}))
    expect(id, SECTIONS.includes(sec), `content.audio: بخش ناشناخته «${sec}»`)
  for (const s of SECTIONS) for (const k of Object.keys(c[s] ?? {})) expect(id, (ALLOWED_KEYS[s] ?? []).includes(k), `کلید ناشناخته در ${s}: ${k}`)

  /* --- meta --- */
  expect(id, c.meta?.cefr === L.level, 'meta.cefr باید برابر سطح درس باشد')
  expect(id, (c.meta?.objectives ?? []).length >= 3 && (c.meta?.objectives ?? []).length <= 5, 'meta.objectives باید ۳ تا ۵ مورد باشد')

  /* --- warmup --- */
  expect(id, (c.warmup?.prompt_fa ?? '').length > 20, 'warmup.prompt_fa خیلی کوتاه است')
  const wq = c.warmup?.questions ?? []
  expect(id, wq.length >= 2 && wq.length <= 3, 'warmup.questions باید ۲ تا ۳ پرسش باشد')
  for (const q of wq) { expect(id, !!q.q, 'warmup: پرسش بدون متن'); expect(id, !!q.hint_fa, 'warmup: پرسش بدون راهنما') }

  /* --- explanation --- */
  const bw = pWords(c.explanation?.body_fa).length
  expect(id, bw >= 80 && bw <= 140, `explanation.body_fa باید ۸۰–۱۴۰ واژه باشد (الان ${bw})`)
  const kp = c.explanation?.key_points ?? []
  expect(id, kp.length >= 3 && kp.length <= 5, 'explanation.key_points باید ۳ تا ۵ مورد باشد')

  /* --- vocabulary --- */
  const vi = c.vocabulary?.items ?? []
  expect(id, vi.length >= 10 && vi.length <= 12, `vocabulary باید ۱۰ تا ۱۲ واژه باشد (الان ${vi.length})`)
  const terms = new Set()
  for (const v of vi) {
    for (const k of Object.keys(v)) expect(id, ITEM_KEYS.vocab.includes(k), `واژگان: کلید ناشناخته ${k}`)
    expect(id, !!v.term && !terms.has(v.term), `واژگان: واژهٔ تکراری یا خالی «${v.term}»`); terms.add(v.term)
    expect(id, /^\/.+\/$/.test(v.ipa ?? ''), `واژگان «${v.term}»: IPA ناقص`)
    expect(id, !!v.translation_fa, `واژگان «${v.term}»: ترجمهٔ فارسی ندارد`)
    expect(id, words(v.example).length <= 12, `واژگان «${v.term}»: جملهٔ نمونه بلندتر از ۱۲ کلمه`)
    expect(id, !!v.example_fa, `واژگان «${v.term}»: ترجمهٔ جملهٔ نمونه ندارد`)
    expect(id, TAGS.includes(v.tag), `واژگان «${v.term}»: برچسب نامعتبر «${v.tag}»`)
  }
  return { id, L, c, terms }
}

function validateStructure(id, c) {
  /* --- grammar --- */
  const gw = pWords(c.grammar?.explanation_fa).length
  expect(id, gw >= 70 && gw <= 120, `grammar.explanation_fa باید ۷۰–۱۲۰ واژه باشد (الان ${gw})`)
  expect(id, !!c.grammar?.title && !!c.grammar?.pattern, 'grammar: title یا pattern ندارد')
  const th = c.grammar?.table?.headers ?? [], rows = c.grammar?.table?.rows ?? []
  expect(id, th.length === 3, 'grammar.table باید ۳ ستون باشد')
  expect(id, rows.length >= 3 && rows.length <= 4, 'grammar.table باید ۳ تا ۴ ردیف باشد')
  for (const r of rows) expect(id, r.length === th.length, 'grammar.table: ردیف با تعداد ستون‌ها نمی‌خواند')
  const pf = c.grammar?.pitfalls_fa ?? []
  expect(id, pf.length >= 2 && pf.length <= 3, 'grammar.pitfalls_fa باید ۲ تا ۳ مورد باشد')

  /* --- examples --- */
  const ex = c.examples?.items ?? []
  expect(id, ex.length >= 4 && ex.length <= 6, `examples باید ۴ تا ۶ جمله باشد (الان ${ex.length})`)
  for (const e of ex) {
    for (const k of Object.keys(e)) expect(id, ITEM_KEYS.example.includes(k), `examples: کلید ناشناخته ${k}`)
    expect(id, words(e.target).length <= 12, `examples: جمله بلندتر از ۱۲ کلمه «${e.target}»`)
    expect(id, !!e.fa && !!e.note_fa, 'examples: ترجمه یا یادداشت ندارد')
  }

  /* --- listening --- */
  const ls = c.listening ?? {}
  const lines = String(ls.script ?? '').split('\n').map(stripSpeaker).filter(Boolean)
  const lw = lines.reduce((n, l) => n + words(l).length, 0)
  expect(id, lw >= 60 && lw <= 100, `listening.script باید ۶۰–۱۰۰ واژه باشد (الان ${lw})`)
  expect(id, !!ls.script_fa && !!ls.question_fa && !!ls.answer, 'listening: ترجمه/پرسش/پاسخ ناقص')
  expect(id, typeof ls.needs_audio === 'boolean', 'listening.needs_audio باید boolean باشد')

  /* --- dialogue --- */
  const dl = c.dialogue?.lines ?? []
  expect(id, dl.length >= 6 && dl.length <= 10, `dialogue باید ۶ تا ۱۰ خط باشد (الان ${dl.length})`)
  for (const l of dl) {
    for (const k of Object.keys(l)) expect(id, ITEM_KEYS.line.includes(k), `dialogue: کلید ناشناخته ${k}`)
    expect(id, l.speaker === 'A' || l.speaker === 'B', `dialogue: speaker باید A یا B باشد («${l.speaker}»)`)
    expect(id, words(l.target).length <= 12, `dialogue: خط بلندتر از ۱۲ کلمه «${l.target}»`)
    expect(id, !!l.fa, 'dialogue: ترجمهٔ خط ندارد')
  }
  /* شنیداری نباید کپی دیالوگ باشد */
  const dset = new Set(dl.map((l) => norm(l.target)))
  for (const l of lines) expect(id, !dset.has(norm(l)), `listening: خطی عیناً از دیالوگ کپی شده «${l}»`)

  /* --- speaking --- */
  const sp = c.speaking ?? {}
  expect(id, SCENARIOS.some((s) => (sp.task_fa ?? '').includes(s)), 'speaking.task_fa باید یکی از سناریوهای واقعی Partner را نام ببرد')
  expect(id, (sp.useful_phrases ?? []).length >= 3 && (sp.useful_phrases ?? []).length <= 4, 'speaking.useful_phrases باید ۳ تا ۴ مورد باشد')
  expect(id, sp.seconds >= 120 && sp.seconds <= 240, 'speaking.seconds باید ۱۲۰–۲۴۰ باشد')
  for (const p of sp.useful_phrases ?? []) { expect(id, !!p.target && !!p.fa, 'speaking: عبارت ناقص') }

  /* --- reading --- */
  const rd = c.reading ?? {}
  const rw = words(rd.text).length
  expect(id, rw >= 80 && rw <= 140, `reading.text باید ۸۰–۱۴۰ واژه باشد (الان ${rw})`)
  expect(id, (rd.glossary ?? []).length >= 3 && (rd.glossary ?? []).length <= 5, 'reading.glossary باید ۳ تا ۵ واژه باشد')
  expect(id, (rd.questions ?? []).length >= 2 && (rd.questions ?? []).length <= 3, 'reading.questions باید ۲ تا ۳ پرسش باشد')

  /* --- exercises --- */
  const ei = c.exercises?.items ?? []
  expect(id, ei.length >= 6 && ei.length <= 8, `exercises باید ۶ تا ۸ تمرین باشد (الان ${ei.length})`)
  const kinds = { core: 0, fill: 0 }
  const exQ = new Set()
  for (const it of ei) {
    for (const k of Object.keys(it)) expect(id, ITEM_KEYS.exercise.includes(k), `exercises: کلید ناشناخته ${k}`)
    expect(id, EX_TYPES.includes(it.type), `exercises: نوع پشتیبانی‌نشده «${it.type}» (match/order ممنوع است)`)
    expect(id, !!it.question && !exQ.has(norm(it.question)), `exercises: پرسش تکراری یا خالی «${it.question}»`); exQ.add(norm(it.question))
    if (it.type === 'mcq') {
      kinds.core++
      expect(id, (it.options ?? []).length >= 3, 'exercises.mcq: کمتر از ۳ گزینه')
      expect(id, (it.options ?? []).includes(it.answer), `exercises.mcq: پاسخ داخل گزینه‌ها نیست «${it.question}»`)
    } else if (it.type === 'truefalse') {
      kinds.core++
      expect(id, JSON.stringify(it.options) === JSON.stringify(['True', 'False']), 'exercises.truefalse: options باید ["True","False"] باشد')
      expect(id, it.options.includes(it.answer), 'exercises.truefalse: پاسخ معتبر نیست')
    } else {
      kinds.fill++
      expect(id, Array.isArray(it.answer) && it.answer.length >= 1, `exercises.${it.type}: answer باید آرایه باشد`)
    }
    expect(id, !!it.explanation_fa, 'exercises: explanation_fa ندارد')
  }
  expect(id, kinds.core >= 4, `exercises: باید حداقل ۴ تمرین mcq/truefalse باشد (الان ${kinds.core})`)
  expect(id, kinds.fill >= 2, `exercises: باید حداقل ۲ تمرین fill/short باشد (الان ${kinds.fill})`)

  /* --- quiz --- */
  const qi = c.quiz?.items ?? []
  expect(id, qi.length === 5, `quiz باید دقیقاً ۵ سؤال باشد (الان ${qi.length})`)
  const qQ = new Set()
  for (const it of qi) {
    expect(id, it.type === 'mcq', 'quiz: همهٔ سؤال‌ها باید mcq باشند (رندرر گزینهٔ پیش‌فرض ندارد)')
    expect(id, (it.options ?? []).length === 3, `quiz: هر سؤال باید دقیقاً ۳ گزینه داشته باشد «${it.question}»`)
    expect(id, new Set(it.options).size === it.options.length, 'quiz: گزینه‌های تکراری')
    expect(id, it.options.includes(it.answer), `quiz: پاسخ داخل گزینه‌ها نیست «${it.question}»`)
    expect(id, !!it.explanation_fa, 'quiz: explanation_fa ندارد')
    expect(id, !!it.question && !qQ.has(norm(it.question)), 'quiz: پرسش تکراری یا خالی'); qQ.add(norm(it.question))
  }

  /* --- ai_practice --- */
  const ap = c.ai_practice ?? {}
  expect(id, (ap.task_fa ?? '').length >= 60, 'ai_practice.task_fa باید خودبسنده باشد (نقش/موقعیت/هدف)')
  expect(id, (ap.suggested_prompts ?? []).length >= 3 && (ap.suggested_prompts ?? []).length <= 4, 'ai_practice.suggested_prompts باید ۳ تا ۴ مورد باشد')
  expect(id, (ap.focus ?? []).length === 3, 'ai_practice.focus باید ۳ مورد باشد')
}

/* ----------------------------- لینت متن‌ها ----------------------------- */
function lintTexts(id, c) {
  const walk = (node, path) => {
    if (typeof node === 'string') {
      if (EMOJI.test(node)) fail(id, `ایموجی در ${path}`)
      if (ARABIC_YK.test(node)) fail(id, `حرف عربی ي/ك در ${path}`)
      if (TECH.test(node)) fail(id, `واژهٔ فنی ممنوعه در ${path}: «${node.match(TECH)[0]}»`)
      if (/ {2,}/.test(node)) fail(id, `فاصلهٔ تکراری در ${path}`)
      if (MARKDOWN.test(node)) fail(id, `نشانهٔ Markdown در ${path}`)
      if (/\s$|^\s/.test(node)) fail(id, `فاصلهٔ اضافه در ابتدا/انتهای ${path}`)
      return
    }
    if (Array.isArray(node)) return node.forEach((n, i) => walk(n, `${path}[${i}]`))
    if (node && typeof node === 'object') return Object.entries(node).forEach(([k, v]) => walk(v, `${path}.${k}`))
  }
  walk(c, 'content')
}

/* ------------------------------ مانیفست صدا ------------------------------ */
function validateAudio(audioDir, ids, voiceRoles) {
  for (const id of ids) {
    const p = join(audioDir, `${id}.plan.json`)
    if (!existsSync(p)) { fail(id, `مانیفست صدا پیدا نشد: ${p}`); continue }
    const m = JSON.parse(readFileSync(p, 'utf8'))
    expect(id, Array.isArray(m.clips) && m.clips.length > 0, 'مانیفست صدا: clips خالی است')
    let fa = 0, target = 0, sample = 0
    for (const clip of m.clips) {
      for (const k of ['id', 'role', 'source', 'tts_text', 'priority', 'language']) expect(id, clip[k] !== undefined, `کلیپ ${clip.id}: فیلد ${k} ندارد`)
      expect(id, voiceRoles.includes(clip.role), `کلیپ ${clip.id}: نقش صوتی ناشناخته «${clip.role}»`)
      expect(id, [TARGET_LANG, 'fa'].includes(clip.language), `کلیپ ${clip.id}: زبان نامعتبر`)
      expect(id, (clip.role.startsWith('FA-') ? 'fa' : TARGET_LANG) === clip.language, `کلیپ ${clip.id}: زبان با نقش نمی‌خواند`)
      const t = String(clip.tts_text ?? '')
      expect(id, t.length > 0 && t.length <= 1500, `کلیپ ${clip.id}: طول متن صوتی نامعتبر (${t.length})`)
      expect(id, !/\/[^/\s]+\//.test(t), `کلیپ ${clip.id}: نشانهٔ IPA داخل متن صوتی`)
      expect(id, !/[*_`#]/.test(t), `کلیپ ${clip.id}: نشانهٔ Markdown در متن صوتی`)
      expect(id, !/\d/.test(t), `کلیپ ${clip.id}: عدد به‌صورت رقم در متن صوتی`)
      expect(id, !/…|\s{2,}/.test(t), `کلیپ ${clip.id}: سه‌نقطه یا فاصلهٔ تکراری در متن صوتی`)
      expect(id, !/^\s*(A|B|[A-Z][a-z]+)\s*:/.test(t), `کلیپ ${clip.id}: نام گوینده در متن صوتی`)
      if (clip.language === TARGET_LANG) {
        expect(id, !/[\u0600-\u06FF]/.test(t), `کلیپ ${clip.id}: متن فارسی در کلیپ ${TARGET_LANG} هدف`)
        if (TARGET_LANG === 'en') expect(id, !/[«»]/.test(t), `کلیپ ${clip.id}: گیومهٔ فارسی در کلیپ انگلیسی`)
        target++
      } else {
        expect(id, !/[A-Za-z]{4,}/.test(t.replace(/«[^»]*»/g, '')), `کلیپ ${clip.id}: واژهٔ لاتین خارج از گیومه در کلیپ فارسی`)
        fa++
      }
      if (clip.sample) {
        sample++
        expect(id, clip.file !== undefined && existsSync(join(audioDir, clip.file)), `کلیپ نمونه ${clip.id}: فایل صوتی موجود نیست (${clip.file})`)
      }
    }
    expect(id, fa >= 5, `مانیفست صدا: تعداد کلیپ فارسی کم است (${fa})`)
    expect(id, target >= 15, `مانیفست صدا: تعداد کلیپ ${TARGET_LANG} کم است (${target})`)
  }
}

/* --------------------------------- اجرا --------------------------------- */
const argv = process.argv.slice(2)
const positional = []
const options = {}
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i]
  const take = (name) => {
    const value = argv[++i]
    if (!value) { console.error(`گزینهٔ ${name} مقدار ندارد`); process.exit(2) }
    return value
  }
  if (arg === '--language') options.language = take(arg)
  else if (arg.startsWith('--language=')) options.language = arg.split('=', 2)[1]
  else if (arg === '--audio-dir') options.audioDir = take(arg)
  else if (arg.startsWith('--audio-dir=')) options.audioDir = arg.split('=', 2)[1]
  else if (arg === '--lessons-dir') options.lessonsDir = take(arg)
  else if (arg.startsWith('--lessons-dir=')) options.lessonsDir = arg.split('=', 2)[1]
  else if (arg === '--context-root') options.contextRoot = take(arg)
  else if (arg.startsWith('--context-root=')) options.contextRoot = arg.split('=', 2)[1]
  else if (arg === '--range') options.range = take(arg)
  else if (arg.startsWith('--range=')) options.range = arg.split('=', 2)[1]
  else if (arg === '--from') options.from = Number(take(arg))
  else if (arg.startsWith('--from=')) options.from = Number(arg.split('=', 2)[1])
  else if (arg === '--to') options.to = Number(take(arg))
  else if (arg.startsWith('--to=')) options.to = Number(arg.split('=', 2)[1])
  else if (arg.startsWith('--')) { console.error(`گزینهٔ ناشناخته: ${arg}`); process.exit(2) }
  else positional.push(arg)
}

if (options.range) {
  const match = options.range.match(/^L?(\d{1,3})-L?(\d{1,3})$/i)
  if (!match) { console.error('بازه باید مانند 327-340 باشد'); process.exit(2) }
  options.from = Number(match[1]); options.to = Number(match[2])
}
if ((options.from !== undefined) !== (options.to !== undefined) ||
    (options.from !== undefined && (!Number.isInteger(options.from) || !Number.isInteger(options.to) || options.from < 1 || options.to > 999 || options.from > options.to))) {
  console.error('بازهٔ درس نامعتبر است؛ from/to را به‌صورت یک بازهٔ بسته بدهید'); process.exit(2)
}
const hintedPath = options.lessonsDir ?? positional[0] ?? ''
const inferred = hintedPath.match(/(?:^|[/\\])content[/\\](en|fr|es)(?:[/\\]|$)/i)?.[1]?.toLowerCase()
TARGET_LANG = options.language ?? inferred ?? 'en'
if (!SUPPORTED_LANGS.includes(TARGET_LANG)) { console.error(`زبان پشتیبانی‌نشده: ${TARGET_LANG}`); process.exit(2) }
const lessonsDir = options.lessonsDir ?? positional[0] ?? null
const audioDir = options.audioDir ?? positional[1] ?? LANGUAGE_CONFIG.languages[TARGET_LANG].audio_root

function lessonFilesIn(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return []
  const found = []
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      // Context roots may include both lesson outputs and authoring specs. Specs use
      // the same L### filenames, so scanning them can overwrite the installed lesson
      // with a non-lesson record and silently drop continuity context.
      if (entry.isDirectory()) {
        if (entry.name.toLowerCase() === 'specs') continue
        walk(path)
      } else if (entry.isFile() && /^L\d{3}\.json$/i.test(entry.name)) found.push(path)
    }
  }
  walk(dir)
  return found.sort()
}
const defaultDirs = LANGUAGE_CONFIG.levels.map((level) => join(ROOT, LANGUAGE_CONFIG.languages[TARGET_LANG].lesson_root, level, 'lessons')).filter((d) => existsSync(d))
const candidateDirs = lessonsDir ? [lessonsDir] : defaultDirs
const candidateFiles = [...new Set(candidateDirs.flatMap(lessonFilesIn))].sort()
const numberOf = (path) => Number(basename(path, '.json').slice(1))
const files = candidateFiles.filter((path) => options.from === undefined || (numberOf(path) >= options.from && numberOf(path) <= options.to))
if (files.length === 0) { console.error('هیچ فایل درسی در بازهٔ انتخاب‌شده پیدا نشد'); process.exit(1) }
if (options.from !== undefined) {
  const found = new Set(files.map(numberOf))
  const missing = Array.from({length: options.to - options.from + 1}, (_, i) => options.from + i).filter((n) => !found.has(n))
  if (missing.length) { console.error(`درس‌های لازم برای بازه پیدا نشدند: ${missing.map((n) => `L${String(n).padStart(3, '0')}`).join(', ')}`); process.exit(1) }
}

const contextDirs = options.contextRoot ? [options.contextRoot] : candidateDirs
const contextFiles = [...new Set(contextDirs.flatMap(lessonFilesIn))]
const targetIds = new Set(files.map((path) => basename(path, '.json')))
const selectedPathIds = new Map(files.map((path) => [basename(path, '.json'), path]))
const recordPaths = new Map()
for (const path of contextFiles) {
  const id = basename(path, '.json')
  if (!selectedPathIds.has(id)) recordPaths.set(id, path)
}
for (const [id, path] of selectedPathIds) recordPaths.set(id, path)
const records = []
for (const [id, path] of recordPaths) {
  try {
    const file = JSON.parse(readFileSync(path, 'utf8'))
    const L = file.lesson ?? {}
    if (!targetIds.has(id) && L.language_code !== TARGET_LANG) continue
    const c = file.content ?? {}
    const terms = new Set((c.vocabulary?.items ?? []).map((item) => String(item.term ?? '')).filter(Boolean))
    records.push({ id, L, c, terms, path })
  } catch { /* Target parse errors are reported by validateLesson; bad context is excluded. */ }
}
records.sort((a, b) => (a.L.order_index ?? numberOf(a.path)) - (b.L.order_index ?? numberOf(b.path)))
const contextCount = records.filter((r) => !targetIds.has(r.id)).length

const loaded = files.map((f) => validateLesson(f))
for (const r of loaded) { if (r) { validateStructure(r.id, r.c); lintTexts(r.id, r.c) } }
const ordered = loaded.filter(Boolean).sort((a, b) => a.L.order_index - b.L.order_index)
const targetRecords = records.filter((r) => targetIds.has(r.id))

/* --- یکتایی عنوان/ترتیب/اثر انگشت در برابر کل زمینهٔ همان زبان --- */
for (const r of ordered) {
  const t = r.L.title, o = r.L.order_index, f = fp(r.L.language_code, r.L.level, t)
  expect(r.id, records.filter((x) => x.L.title === t).length === 1, `عنوان تکراری: «${t}»`)
  expect(r.id, records.filter((x) => x.L.order_index === o).length === 1, `order_index تکراری: ${o}`)
  expect(r.id, records.filter((x) => fp(x.L.language_code, x.L.level, x.L.title) === f).length === 1, `fingerprint تکراری (دیتابیس رد می‌کند): ${f.slice(0, 12)}…`)
}

/* --- تکرار جمله‌ها: محتوا فقط در فایل‌های بازه اعتبارسنجی می‌شود، اما با کل زبان سنجیده می‌شود --- */
function sentenceBag(c) {
  return [
    ...(c.examples?.items ?? []).map((x) => x.target),
    ...(c.vocabulary?.items ?? []).map((x) => x.example),
    ...(c.dialogue?.lines ?? []).map((x) => x.target),
    ...String(c.listening?.script ?? '').split('\n').map(stripSpeaker),
    ...String(c.reading?.text ?? '').split(/\n/),
    ...(c.exercises?.items ?? []).map((x) => x.question),
    ...(c.quiz?.items ?? []).map((x) => x.question),
  ].flatMap(sentences)
}
const sentenceOwners = new Map()
const sentencesById = new Map()
for (const r of records) {
  const set = new Set(sentenceBag(r.c)); sentencesById.set(r.id, set)
  for (const sentence of set) {
    if (!sentenceOwners.has(sentence)) sentenceOwners.set(sentence, new Set())
    sentenceOwners.get(sentence).add(r.id)
  }
}
for (const r of targetRecords) {
  for (const sentence of sentencesById.get(r.id) ?? []) {
    const owners = [...(sentenceOwners.get(sentence) ?? [])].filter((id) => id !== r.id)
    expect(r.id, owners.length === 0, `جملهٔ تکراری بین درس‌ها: «${sentence}» (همچنین در ${owners.join(', ')})`)
  }
}

/* --- واژگان: هم‌پوشانی با کل زبان و مرور واقعیِ درس‌های پیشین --- */
const sortedRecords = [...records].sort((a, b) => (a.L.order_index ?? numberOf(a.path)) - (b.L.order_index ?? numberOf(b.path)))
const checkedPairs = new Set()
for (const r of targetRecords) {
  for (const other of sortedRecords) {
    if (other.id === r.id) continue
    const pairKey = [r.id, other.id].sort().join('|')
    if (checkedPairs.has(pairKey)) continue
    checkedPairs.add(pairKey)
    const inter = [...r.terms].filter((term) => other.terms.has(term))
    const ratio = inter.length / Math.min(r.terms.size || 1, other.terms.size || 1)
    expect(r.id, ratio < 0.3, `هم‌پوشانی واژگان با درس ${other.L.order_index} بیش از ۳۰٪ (${inter.join(', ')})`)
  }
  const previous = sortedRecords.filter((x) => (x.L.order_index ?? 0) < r.L.order_index)
  if (previous.length === 0) continue
  const text = JSON.stringify(r.c)
  const prevTerms = new Set(previous.flatMap((x) => [...x.terms]))
  const reused = [...prevTerms].filter((term) => {
    const safe = term.replace(/[^a-z]/gi, '')
    return safe && new RegExp(`\\b${safe}\\b`, 'i').test(text)
  })
  expect(r.id, reused.length >= 5, `مرور واژگان درس‌های قبل کمتر از ۵ مورد است (الان ${reused.length})`)
}

/* ------------------------- ارجاع‌های صوتی داخل درس ------------------------- */
function validateAudioRefs(rows, audioDir) {
  let refs = 0, sections = 0, withAudio = 0
  for (const r of rows) {
    const c = r.c ?? {}
    const audio = c.audio ?? {}
    const planPath = join(audioDir, `${r.id}.plan.json`)
    const plan = existsSync(planPath) ? JSON.parse(readFileSync(planPath, 'utf8')) : { clips: [] }
    const planById = new Map((plan.clips ?? []).map((x) => [x.id, x]))
    const seen = new Set()
    const lessonsRefs = Object.entries(audio)
    for (const [sec, list] of lessonsRefs) {
      expect(r.id, Array.isArray(list) && list.length > 0, `صدا در بخش ${sec}: فهرست خالی`)
      let lastOrder = -1
      for (const a of list ?? []) {
        refs++
        for (const k of ['id', 'section', 'lang', 'role', 'text', 'path', 'hash', 'bytes'])
          expect(r.id, a[k] !== undefined && a[k] !== '', `ارجاع صوتی ${a.id ?? '?'}: فیلد ${k} ندارد`)
        expect(r.id, a.section === sec, `ارجاع ${a.id}: بخش «${a.section}» با محل قرارگیری «${sec}» نمی‌خواند`)
        expect(r.id, [TARGET_LANG, 'fa'].includes(a.lang), `ارجاع ${a.id}: زبان نامعتبر`)
        expect(r.id, !seen.has(a.id), `ارجاع تکراری در درس: ${a.id}`); seen.add(a.id)
        expect(r.id, new RegExp(`^(${TARGET_LANG}|fa)/[0-9a-f]{8}\\.mp3$`).test(a.path), `ارجاع ${a.id}: مسیر نامعتبر (${a.path})`)
        expect(r.id, String(a.path).startsWith(`${a.lang}/`), `ارجاع ${a.id}: زبان مسیر با زبان کلیپ نمی‌خواند`)
        expect(r.id, String(a.path).includes(a.hash), `ارجاع ${a.id}: هش با مسیر نمی‌خواند`)
        expect(r.id, Number(a.bytes) > 512, `ارجاع ${a.id}: حجم فایل نامعتبر`)
        expect(r.id, String(a.role).startsWith(a.lang === 'fa' ? 'FA-' : `${langPrefix(TARGET_LANG)}-`), `ارجاع ${a.id}: نقش با زبان نمی‌خواند`)
        expect(r.id, orderIn({ language: a.lang }) >= lastOrder, `ارجاع ${a.id}: ترتیب (توضیح فارسی باید اول باشد)`)
        lastOrder = orderIn({ language: a.lang })
        const clip = planById.get(a.id)
        expect(r.id, !!clip, `ارجاع ${a.id}: کلیپی با این شناسه در مانیفست نیست`)
        if (clip) {
          expect(r.id, clip.tts_text === a.text, `ارجاع ${a.id}: متن نمایشی با متن صوتی یکی نیست`)
          expect(r.id, clip.language === a.lang && clip.role === a.role, `ارجاع ${a.id}: زبان/نقش با مانیفست نمی‌خواند`)
          expect(r.id, sectionOf(clip) === sec, `ارجاع ${a.id}: بخش با منبع کلیپ نمی‌خواند`)
          expect(r.id, clip.role === 'FA-COACH' || !String(a.text).match(/[\u0600-\u06FF]/), `ارجاع ${a.id}: متن فارسی در کلیپ ${TARGET_LANG} هدف`)
          const li = dialogueIndex(clip)
          if (li !== null) {
            const line = (c.dialogue?.lines ?? [])[li]
            expect(r.id, !!line, `ارجاع ${a.id}: خط دیالوگ پیدا نشد`)
            if (line) expect(r.id, a.speaker === line.speaker, `ارجاع ${a.id}: گوینده (${a.speaker}) با خط دیالوگ (${line.speaker}) نمی‌خواند`)
          }
          const file = join(audioDir, 'generated', r.id, `${a.id}.mp3`)
          expect(r.id, existsSync(file), `ارجاع ${a.id}: فایل صوتی روی دیسک نیست`)
          if (existsSync(file)) expect(r.id, statSync(file).size === Number(a.bytes), `ارجاع ${a.id}: حجم فایل با ارجاع نمی‌خواند`)
        }
      }
      sections++
    }
    if (lessonsRefs.length) withAudio++
    for (const clip of plan.clips ?? []) {
      const file = join(audioDir, 'generated', r.id, `${clip.id}.mp3`)
      if (!existsSync(file)) continue
      expect(r.id, seen.has(clip.id), `فایل ضبط‌شده بدون ارجاع در درس: ${clip.id}`)
    }
  }
  return { refs, sections, withAudio }
}

/* --- مانیفست و ارجاع صوتی در بازهٔ انتخاب‌شده --- */
const voicesPath = join(audioDir, 'voices.json')
let roles = ['FA-COACH', 'FA-NARRATOR-F', 'FA-NARRATOR-M', `${langPrefix(TARGET_LANG)}-CHAR-A`, `${langPrefix(TARGET_LANG)}-CHAR-B`, `${langPrefix(TARGET_LANG)}-VOCAB`, `${langPrefix(TARGET_LANG)}-READ-F`, `${langPrefix(TARGET_LANG)}-READ-M`]
if (existsSync(voicesPath)) roles = Object.keys(JSON.parse(readFileSync(voicesPath, 'utf8')).registry ?? {})
validateAudio(audioDir, ordered.map((r) => r.id), roles)
const audioStats = validateAudioRefs(ordered, audioDir)

/* -------------------------------- گزارش -------------------------------- */
const scope = options.from === undefined ? 'all' : `L${String(options.from).padStart(3, '0')}-L${String(options.to).padStart(3, '0')}`
console.log('———————————————————————————————————————————————')
console.log(`LINGU · validation — language: ${TARGET_LANG} · scope: ${scope} · lessons: ${ordered.length} · context: ${contextCount} · pass: ${PASS} · errors: ${FAIL}`)
console.log(`audio: ${audioStats.refs} refs in ${audioStats.sections} sections · ${audioStats.withAudio} lessons with references`)
console.log('———————————————————————————————————————————————')
if (FAIL === 0) {
  console.log('✅ All selected lessons passed: schema · content · level · grammar · vocabulary · TTS plan · quiz · exercises · AI · duplicates')
} else {
  for (const f of findings) console.log(f)
  console.log(`\n❌ ${FAIL} errors — do not import until resolved.`)
}
process.exit(FAIL === 0 ? 0 : 1)
