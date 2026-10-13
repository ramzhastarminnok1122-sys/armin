/**
 * LINGU · Content Factory — نقشهٔ مشترک «کلیپ صوتی → بخش درس»
 * هم ابزار ساخت ارجاع (build_audio_refs.mjs) و هم اعتبارسنج (validate.mjs)
 * از همین فایل استفاده می‌کنند تا قاعده یک‌جا زندگی کند.
 */
export const COACH_SECTION = {
  'warmup': 'warmup',
  'explanation': 'explanation',
  'listening-intro': 'listening',
  'vocab-note': 'vocabulary',
  'grammar-note': 'grammar',
  'speaking': 'speaking',
  'ai': 'ai_practice',
  'reading': 'reading',
}

export function sectionOf(clip) {
  const src = String(clip?.source ?? '')
  if (clip?.language === 'fa') {
    const name = String(clip.id).replace(/^L\d+-fa-/, '')
    return COACH_SECTION[name] ?? null
  }
  if (src.startsWith('dialogue.lines')) return 'dialogue'
  if (src.startsWith('listening.script')) return 'listening'
  if (src.startsWith('vocabulary.items')) return 'vocabulary'
  if (src.startsWith('grammar.table.rows')) return 'grammar'
  if (src.startsWith('examples.items')) return 'examples'
  if (src.startsWith('reading.text')) return 'reading'
  if (src.startsWith('speaking.')) return 'speaking'
  if (src.startsWith('ai_practice.')) return 'ai_practice'
  if (src.startsWith('warmup.')) return 'warmup'
  if (src.startsWith('explanation.')) return 'explanation'
  return null
}

/** ترتیب نمایش داخل هر بخش: توضیح فارسی اول، بعد کلیپ‌های انگلیسی. */
export const orderIn = (c) => (c.language === 'fa' ? 0 : 1)

/** ایندکس خطِ دیالوگ از منبع کلیپ (یا null). */
export function dialogueIndex(clip) {
  const m = /^dialogue\.lines\[(\d+)\]/.exec(String(clip?.source ?? ''))
  return m ? Number(m[1]) : null
}
