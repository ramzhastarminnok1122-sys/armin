# LINGU · Content Handoff (وضعیت واقعی برای چت جدید Content Factory)

> تاریخ: 2026-10-02 · همهٔ اعداد در همین تاریخ از Disk یا DB زنده **اندازه‌گیری** شده‌اند، مگر جایی که صریحاً «آخرین سنجش قبلی» نوشته شده.
> هیچ درس، صدا یا معماری جدیدی در این Task ساخته نشد.

## ۱) وضعیت پروژه

| مورد | مقدار واقعی | منبع/روش سنجش |
|---|---|---|
| هدف کل | English L001–L340 + French L001–L340 + Spanish L001–L340 = **1020 درس** | دستور مالک |
| English روی Disk | **326 درس** · A1=100 (L001–L100) · A2=100 (L101–L200) · B1=126 (L201–L326) | شمارش `content/en/*/lessons/L*.json` |
| آخرین درس روی Disk | **L326** (B1) — «I Had the Coat Taken In» | همان |
| آخرین درس در DB | **L320** | آخرین سنجش زندهٔ قبلی (دستهٔ ۱۶) |
| French | **0 درس** — شروع نشده (جدول `languages` در DB رکورد `fr` دارد) | Disk + `0007_seed.sql` |
| Spanish | **0 درس** — شروع نشده (رکورد `es` در DB) | همان |
| باقی‌ماندهٔ English | L327–L340 (۱۴ درس) نوشته نشده + L321–L326 هنوز Import نشده | — |

## ۲) وضعیت درس‌ها (English)

| شاخص | عدد | توضیح |
|---|---|---|
| روی Disk | 326 | L001–L326 |
| Validated واقعی (validator بدون خطا) | **323** (L001–L323) | `node content/tools/validate.mjs` در 2026-10-02: «درس‌ها: 326 · پاس: 401,499 · خطا: 16»؛ هر ۱۶ خطا در L324–L326 |
| فیلد `lesson.status` در JSON | 326 × `validated` | ⚠️ این فیلد را build_lessons می‌نویسد، نه validator؛ برای L324–L326 گمراه‌کننده است |
| در DB (Import‌شده) | **320** (A1=100 · A2=100 · B1=120)، همه `validated` | آخرین سنجش زنده بعد از Import دستهٔ ۱۶ (`content/reports/RUN-L101-L340-FA.md`)؛ در این Task شمارش مستقیم ممکن نبود (رمز DB در Workspace نیست و RLS خواندن anon را می‌بندد) |
| Published | **0** | **زنده 2026-10-02**: RPC `published_catalog()` → HTTP 200 با ۰ ردیف. عمدی است: انتشار کار ادمین است (همهٔ گزارش‌های RUN «published=0») |
| Free (`is_free`) | **2** — L001، L002 | Disk؛ گزارش DB هم free=2 |
| ساخته‌شده ولی Import‌نشده | **6** — L321–L326 | از این‌ها فقط L321–L323 قابل Import هستند |
| estimated_minutes | 15 → 71 درس · 18 → 255 درس | Disk |
| Seeds / Specs | A1: 0 / 21 · A2: 30 / 30 · B1: 45 / 45 | A1 مستقیم از specs ساخته شده |

### Batchها

| Batch | بازه | وضعیت | گزارش |
|---|---|---|---|
| 1 | L001–L020 | ✅ ساخته · validated · Import | `content/reports/BATCH-1-FA.md`, `GATE-2-L01-L02-FA.md` |
| 2–5 | L021–L100 | ✅ ساخته · validated · Import | `content/reports/RUN-L021-L100-FA.md` |
| 6–16 | L101–L320 | ✅ ساخته · validated · Import · idempotent · QA رندر | `content/reports/RUN-L101-L340-FA.md` |
| **17 — ناقص** | L321–L340 | بخش ۱ (L321–L323): ✅ validated، Import نشده · بخش ۲ (L324–L326): ⚠️ ۱۶ خطا · بخش‌های ۳–۷ (L327–L340): نوشته نشده | این سند §۷ |

## ۳) وضعیت Audio — ثبت صریح خطای گردش کار

**خطای گردش کار گذشته:** فرض رایج «L001–L020 صدای واقعی دارند» دقیق نیست. واقعیت اندازه‌گیری‌شده:

| شاخص | عدد |
|---|---|
| مانیفست صوتی (`content/audio/L###.plan.json`) | **326** (یکی برای هر درس) |
| کلیپ برنامه‌ریزی‌شده در مانیفست‌ها | **12,766** (حدود 1,029,787 کاراکتر TTS) — A1=4,001 · A2=4,010 · B1=4,755 |
| کلیپ صوتی واقعی تولیدی (`content/audio/generated/`) | **10** mp3 = **0.08٪** — L001: 5/46 · L002: 3/48 · L010: 1/38 · L020: 1/40 |
| همان ۱۰ کلیپ: آپلود + تأیید در Storage | 10/10 (`content/audio/registry.json`، باکت `lesson-audio`) |
| ارجاع صوتی داخل درس (`content.audio`) | ۱۰ ارجاع در ۷ بخش · **۴ درس** (validator) |
| نمونه‌های صوتی دروازه (`content/audio/samples/`) | 10 mp3 (L001: 5 · L002: 5؛ ۷ شناسه مشترک با generated) |
| دموهای آزمون صدا (`voice-tests/`) | 5 mp3 |
| **کل فایل mp3 روی Disk** | **25** |
| درس‌های بدون هیچ صدای واقعی | L003–L009 · L011–L019 · L021–L326 (۳۲۲ درس) |
| آخرین Audio QA | `qa/audio_qa_report.json` — 2026-09-30 · ۳۰ پلیر · ۰ مشکل |

**قانون آینده:** Lesson Complete = Content + Real Audio (+ Audio Reference + QA). در این Task هیچ صدای انبوهی تولید نشد.
**Voice Registry:** `content/VOICE-REGISTRY-FA.md` (+ `content/audio/voices.json`) — ۸ نقش روی ۶ شناسهٔ `voice-00…05`؛
⚠️ شناسه‌ها **Session-bound** هستند (فقط چت 2026-09-30) و در چت جدید باید با `add_voice` دوباره ثبت شوند.

## ۴) وضعیت Database

- **Schema:** `supabase/migrations/0003_lessons.sql` (جدول‌های `curricula`, `content_batches`, `lesson_plans`, `lessons`) · enum `lesson_status` = draft/generated/validated/published/failed · RLS در `0006_rls.sql` · نسخهٔ یک‌فایلی: `supabase/SETUP.sql`. خلاصهٔ خوانا: `content-schema/LESSON-SCHEMA-FA.md`.
- **روش Import:** `node content/tools/build_import_sql.mjs <from> <to> batch-<N>` → `/tmp/import_batch-<N>.sql` → `psql -f` با نقش مالک DB → verify داخل SQL → اجرای دوباره = INSERT صفر.
- **تعداد فعلی:** 320 درس (آخرین سنجش زنده) · Published = 0 (زنده) · Free = 2.
- **پیش‌نیاز Import بعدی:** رمز دیتابیس (در Workspace نیست — از مالک یا Reset).

## ۵) ابزارهای مهم

| ابزار | کاربرد |
|---|---|
| `content/tools/ops/run_part.sh` | پایپ‌لاین کامل یک بخش بذر (tidy → parse → build → plans → validate + عنوان‌ها) |
| `content/tools/ops/tidy_seed.py` | ترمیم خودکار خطاهای رایج بذر + گیومه‌گذاری لاتین |
| `content/tools/ops/vocabulary_check.py` | `used` / `pair` — جلوگیری از تکرار و همپوشانی واژگان (جایگزین known.json/free.py/paircheck.py که با /tmp از بین رفتند) |
| `content/tools/parse_seed.mjs` | بذر → spec |
| `content/tools/build_lessons.mjs` | spec → درس JSON |
| `content/tools/build_plans.mjs` | مانیفست صوتی |
| `content/tools/validate.mjs` | اعتبارسنج کامل (فقط‌خواندنی) |
| `content/tools/build_import_sql.mjs` | SQL Import ایمن و idempotent |
| `content/tools/upload_audio.mjs` · `build_audio_refs.mjs` · `probe_audio.py` | زنجیرهٔ صدای واقعی: آپلود · ارجاع در درس · سنجش فایل |
| `content/tools/lesson_to_seed.mjs` | Recovery: بازسازی بذر از درس |
| `content/tools/ops/qa-lessons.sql` + `qa/batch_qa.mjs` + `qa/audio_qa.mjs` | QA رندر درس و پلیر صوتی در مرورگر |

روال کامل گام‌به‌گام: `content/RUNBOOK-FA.md`.

## ۶) فایل‌های مهم (مسیر دقیق، نسبت به ریشهٔ پروژه `lingu/`)

| فایل | نقش |
|---|---|
| `docs/CONTENT-FACTORY-MASTER-PROMPT-FA.md` | قرارداد کامل نگارش درس (§۲ JSON · §۳–۵ فرمول و لحن · §۶ صدا · §۹ چک‌ها) |
| `content-schema/LESSON-SCHEMA-FA.md` | ساختار رسمی درس + جدول DB + سهمیه‌ها |
| `content/RUNBOOK-FA.md` | روال اجرایی هر Batch |
| `content/LOCALIZATION-RULES-FA.md` | قواعد French/Spanish (Localization ≠ Translation) |
| `content/VOICE-REGISTRY-FA.md` · `content/audio/voices.json` | رجیستری گوینده |
| `content/tools/ops/README.md` | قوانین زرین بذر |
| `content/en/B1/seeds/b17-part1.seed` | آخرین بذر سالم (نمونهٔ مرجع قالب) |
| `content/en/B1/seeds/b17-part2.seed` | بذر باز (L324–L326) — نقطهٔ شروع |
| `content/reports/RUN-L101-L340-FA.md` | آخرین گزارش اجرا (دسته‌های ۶–۱۶) |
| `content/audio/registry.json` · `plans-meta.json` | رجیستری آپلود و متادیتای صوتی |
| `supabase/migrations/0003_lessons.sql` · `0006_rls.sql` | Schema و RLS |

## ۷) وضعیت باز Batch 17 (دقیق)

**L321–L323** (`b17-part1.seed`): ۰ خطا · Import نشده.
- L321 · If the Barometer Had Held, Tomorrow Would Be Cloudy
- L322 · The Party Would Have Been Going On
- L323 · I Would Rather You Had Knocked

**L324–L326** (`b17-part2.seed`): درس‌های روی Disk از نسخهٔ **قدیمی‌تر** بذر ساخته شده‌اند و ۱۶ خطای validator دارند (عین خروجی 2026-10-02):
```
✗ [L325] explanation.key_points باید ۳ تا ۵ مورد باشد
✗ [L326] explanation.key_points باید ۳ تا ۵ مورد باشد
✗ [L324] speaking.task_fa باید یکی از سناریوهای واقعی Partner را نام ببرد
✗ [L325] reading.text باید ۸۰–۱۴۰ واژه باشد (الان 141)
✗ [L326] reading.text باید ۸۰–۱۴۰ واژه باشد (الان 141)
✗ [L325] کلیپ‌های L325-fa-warmup / explanation / grammar-note / listening-intro / speaking / closing: واژهٔ لاتین خارج از گیومه (۶ خطا)
✗ [L326] کلیپ‌های L326-fa-warmup / explanation / listening-intro / grammar-note / closing: واژهٔ لاتین خارج از گیومه (۵ خطا)
```
- بذر فعلی `seeds/b17-part2.seed` نسبت به نسخهٔ سازندهٔ این درس‌ها: ۱۰ خط گیومه‌گذاری لاتین + ۲ اصلاح واقعی (از جمله LST تک‌خطی L325) دارد، ولی **بعد از آن parse نشده** — هنوز معلوم نیست چند خطا باقی می‌ماند.
- ⚠️ بذر فعلی هنوز **۳۸ متن لفظی `\u200`** دارد (به‌جای نیم‌فاصله) که L326 روی Disk هم دارد؛ validator این را نمی‌گیرد. هیچ درس دیگری (L001–L325) این نقص را ندارد.
- عنوان‌ها: L324 · It Is Time the Rota Admitted It · L325 · The Lamp Should Have Been Fixed in June · L326 · I Had the Coat Taken In

**L327–L340** (بخش‌های ۳–۷): نوشته نشده. برنامهٔ ثبت‌شده: reduced relatives · participle clauses · gerunds و ساخت اسم · cleft/تأکید/پیوندها · articles، quantifiers و both/neither · دو درس جمع‌بندی پایانی B1 (L339–L340).

## ۸) ادامهٔ کار — چت جدید دقیقاً از اینجا شروع کند

1. خواندن به این ترتیب: `LINGU-NEW-CONTENT-CHAT-PROMPT-FA.md` → همین سند → `LINGU-FILE-MANIFEST.md` → `content/RUNBOOK-FA.md` → `content-schema/LESSON-SCHEMA-FA.md` → `docs/CONTENT-FACTORY-MASTER-PROMPT-FA.md`.
2. ثبت دوبارهٔ ۴ نقش صوتی فعال با `add_voice` (روش: `content/VOICE-REGISTRY-FA.md`).
3. `b17-part2.seed`: حذف ۳۸ `\u200` لفظی → `bash content/tools/ops/run_part.sh B1 b17-part2` → رفع تا «خطا: 0».
4. نوشتن بخش‌های ۳–۷ دستهٔ ۱۷ (L327–L340) با همان چرخه.
5. صدای واقعی برای L321–L340 → آپلود → ارجاع → validate → Audio QA.
6. Import دستهٔ ۱۷ (`build_import_sql.mjs 321 340 batch-17`) — نیاز به رمز DB از مالک.
7. سپس: صدای واقعی برای درس‌های بدون صدا (L003–L320) به‌صورت دسته‌ای، و شروع French/Spanish طبق `content/LOCALIZATION-RULES-FA.md`.
