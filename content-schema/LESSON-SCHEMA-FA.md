# LINGU · Lesson Schema (ساختار رسمی درس)

> این سند **از روی کد** استخراج شده (2026-10-02)، نه از حافظه. اگر با کد اختلاف داشت، کد معتبر است:
> - قرارداد JSON و قواعد: `content/tools/validate.mjs` (`ALLOWED_KEYS`, `ITEM_KEYS`, پیام‌های «باید …»)
> - جدول دیتابیس: `supabase/migrations/0003_lessons.sql` · enumها: `0001_foundation.sql` · RLS: `0006_rls.sql`
> - شکل ارجاع صوتی: `docs/CONTENT-FACTORY-MASTER-PROMPT-FA.md` §۶.۱ و `content/tools/build_audio_refs.mjs`
> - قرارداد کامل‌تر نگارشی (سهمیه‌ها، لحن، فرمول درس): همان Master Prompt §۲ تا §۵ و §۹

## ۱) فایل درس روی Disk

مسیر: `content/<LANG>/<LEVEL>/lessons/L###.json` (سه‌رقمی؛ زبان‌ها `en`/`fr`/`es`؛ ترتیب سراسری: A1=L001–L100 · A2=L101–L200 · B1=L201–…)
ساخته‌شده فقط توسط `content/tools/build_lessons.mjs` از `specs/*.json` (نه دستی). برای جلوگیری از ساخت/تغییر ناخواسته، `--range` اجباری است؛ فایل‌های موجود بدون `--overwrite` صریح هرگز جایگزین نمی‌شوند.

```json
{
  "lesson":     { "language_code", "level", "order_index", "title", "subtitle", "description",
                  "estimated_minutes", "is_free", "status", "version" },
  "content":    { "meta", "warmup", "explanation", "vocabulary", "grammar", "examples", "listening",
                  "dialogue", "speaking", "reading", "exercises", "quiz", "ai_practice", "audio" },
  "validation": { … آخرین گزارش اعتبارسنجی سازنده … }
}
```

### کلیدهای مجاز هر بخش (`ALLOWED_KEYS`)

| بخش | کلیدها |
|---|---|
| meta | `cefr`, `topic`, `objectives` |
| warmup | `prompt_fa`, `questions[]` → `{q, hint_fa}` |
| explanation | `title`, `body_fa`, `key_points[]` |
| vocabulary | `items[]` → `{term, ipa, translation_fa, example, example_fa, tag}` · `term` و `example` به زبان درس؛ `translation_fa` و `example_fa` فارسی · tag ∈ فعل/اسم/صفت/قید/عبارت/حرف اضافه/ضمیر |
| grammar | `title`, `explanation_fa`, `pattern`, `table` (۳ ستون), `pitfalls_fa[]` |
| examples | `items[]` → `{target, fa, note_fa}` |
| listening | `title_fa`, `script`, `script_fa`, `question_fa`, `answer`, `needs_audio` (boolean) |
| dialogue | `title_fa`, `lines[]` → `{speaker: A|B, target, fa}` |
| speaking | `task_fa`, `useful_phrases[]` → `{target, fa}`, `seconds` |
| reading | `title`, `text`, `glossary[]` → `{term, fa}`, `questions[]` → `{q_fa, a}` |
| exercises | `items[]` → `{type ∈ mcq/truefalse/fill/short, prompt_fa, question, options, answer[], explanation_fa}` |
| quiz | `items[]` (همه mcq) |
| ai_practice | `task_fa`, `suggested_prompts[]`, `focus[]` |
| audio | شیء: `{ <section>: [ {id, section, lang, role, text, path, hash, bytes, speaker?, line?} ] }` — خالی `{}` تا وقتی صدای واقعی نیست |

### سهمیه‌های اجباری (همان چیزی که `validate.mjs` رد می‌کند)

| قاعده | مقدار |
|---|---|
| `estimated_minutes` | فقط ۱۵ یا ۱۸ |
| `lesson.status` | `validated` (انتشار = کار ادمین) · `language_code` در این ابزارها `en`/`fr`/`es` است و از `content/tools/language-config.json` خوانده می‌شود |
| meta.objectives | ۳–۵ · `meta.cefr` = سطح درس |
| warmup.questions | ۲–۳ |
| explanation.body_fa | ۸۰–۱۴۰ واژه · `key_points` ۳–۵ (در بذر: حداکثر ۴ کلید + `||` انتهایی) |
| vocabulary | ۱۰–۱۲ واژه · همپوشانی با هر درس دیگر < ۳۰٪ (با زیرواژه‌های عبارت چندکلمه‌ای) |
| grammar | explanation_fa ۷۰–۱۲۰ واژه · table ۳–۴ ردیف × ۳ ستون · pitfalls_fa ۲–۳ |
| examples | ۴–۶ جمله · هر جمله/مثال/خط دیالوگ ≤ ۱۲ واژه |
| listening.script | ۶۰–۱۰۰ واژه |
| dialogue | ۶–۱۰ خط · speaker فقط A یا B |
| speaking | seconds ۱۲۰–۲۴۰ · useful_phrases ۳–۴ · task_fa باید یکی از سناریوهای Partner را نام ببرد: کافه، سفر، فرودگاه، رستوران، خرید، مصاحبه کاری، مدرسه، آشنایی، زندگی روزمره |
| reading | text ۸۰–۱۴۰ واژه · glossary ۳–۵ · questions ۲–۳ |
| exercises | ۶–۸ · حداقل ۴ mcq/truefalse + حداقل ۲ fill/short · truefalse.options = `["True","False"]` · answer آرایه |
| quiz | دقیقاً ۵ سؤال · همه mcq · هر سؤال دقیقاً ۳ گزینه · پاسخ عیناً یکی از گزینه‌ها |
| ai_practice | suggested_prompts ۳–۴ · focus ۳ · task_fa خودبسنده (نقش/موقعیت/هدف) |
| لایهٔ فارسی | در فیلدهای فارسی هیچ واژهٔ لاتین ۴+ حرفی بیرون از «…» نباشد · بدون ي/ك عربی · در کلیپ‌های فارسی، توضیح فارسی اول |
| یکتایی | بدون جملهٔ تکراری ≥۳ واژه بین درس‌ها؛ fingerprint یکتا روی (language_code, level, title) |

⚠️ نقصی که validator **نمی‌گیرد**: متن escape‌شدهٔ لفظی مثل `\u200` (به‌جای نیم‌فاصلهٔ واقعی). امروز فقط در `L326` (۳۸ مورد) وجود دارد. پیش از Import با grep بررسی شود:
`grep -c '\\\\u[0-9a-fA-F]\{3\}' content/en/*/lessons/L*.json`

## ۲) مانیفست صدا (برای هر درس)

مانیفست English در `content/audio/L###.plan.json` و مانیفست‌های French/Spanish در `content/audio/fr/L###.plan.json` و `content/audio/es/L###.plan.json` ذخیره می‌شوند؛ برای هر زبان `plans-meta.json` و `voices.json` هم جداست. شکل هر مانیفست: `{lesson, language, level, needs_audio, voice_registry_ref, generated_by, mapping_note, clips[]}`؛ هر clip: `{id, role, source, tts_text, priority, language, chars, sample?, file?}` — سازنده: `build_plans.mjs` با `--language`.
نقش‌ها و شناسه‌ها با پیشوندهای `EN`/`FR`/`ES` و لایهٔ فارسی `FA` از `content/tools/language-config.json` خوانده می‌شوند.

## ۳) جدول دیتابیس `public.lessons` (از `0003_lessons.sql`)

| ستون | نوع / پیش‌فرض |
|---|---|
| id | uuid PK |
| plan_id / batch_id | uuid → `lesson_plans` / `content_batches` |
| language_code | text → `languages(code)` (در DB: `en`, `fr`, `es` تعریف شده‌اند) |
| level | text (A1/A2/B1/B2) |
| order_index | int (ترتیب سراسری = شمارهٔ L) |
| title / subtitle / description | text |
| estimated_minutes | int (15/18) |
| status | enum `lesson_status`: draft · generated · validated · **published** · failed |
| is_free | boolean (امروز فقط L001 و L002) |
| content | jsonb — کل بدنهٔ درس (بخش‌ها + audio) |
| validation | jsonb |
| fingerprint | text یکتا (تریگر از language_code+level+title می‌سازد) |
| version | int |
| published_at | timestamptz (با دکمهٔ «انتشار» پنل ادمین) |

جدول‌های همراه: `curricula`, `content_batches` (هر batch یک ردیف: requested/succeeded/failed/status), `lesson_plans`.

**RLS خواندن:** `is_admin()` یا (`status='published'` و (`is_free` یا اشتراک فعال)). کاربر عادی تا «انتشار» هیچ درسی نمی‌بیند.
**کاتالوگ عمومی:** RPC `published_catalog()` (security definer؛ به anon و authenticated GRANT شده) — فقط درس‌های published.
**نوشتن:** فقط `is_admin()` یا نقش مالک دیتابیس (مسیر Import با psql).

## ۴) مسیر Import (روش واقعی و آزموده)

`node content/tools/build_import_sql.mjs <from> <to> batch-<N>` → فایل `/tmp/import_batch-<N>.sql` → `psql -f` روی DB زنده
(نیاز به رمز دیتابیس در `PGPASSWORD` — در Workspace نیست) → شمارش verify داخل همان SQL → اجرای دوباره باید INSERT صفر بدهد (idempotent).
وضعیت ورودی‌ها `validated` است؛ انتشار جداگانه و فقط از پنل ادمین.

## ۵) French / Spanish

جدول و enumها آماده‌اند (`languages` = en/fr/es) ولی ابزارها امروز **فقط English** را می‌پذیرند (`validate.mjs`: «زبان باید en باشد»؛
مسیرها `content/en/...`). شروع FR/ES یعنی افزودن مسیر `content/fr|es/...` و پارامتر زبان به ابزارها — با حفظ همین قرارداد JSON.
قواعد محتوایی: `content/LOCALIZATION-RULES-FA.md`.
