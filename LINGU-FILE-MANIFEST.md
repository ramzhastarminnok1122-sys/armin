# LINGU · File Manifest

> تاریخ: 2026-10-02 · مسیرها نسبت به ریشهٔ Workspace (`/home/user`) هستند؛ داخل ZIPها همین مسیرها حفظ شده‌اند
> (استثنا: در ZIP محتوا، محتویات `lingu/` مستقیم در ریشهٔ ZIP آمده‌اند — یعنی `content/…` به‌جای `lingu/content/…`).
>
> **KEEP** = لازم برای ادامه · **OPTIONAL** = مفید ولی غیرحیاتی · **LOCAL** = فقط روی Disk، عمداً بیرون از ZIP · **DELETED** = بعد از تست ZIPها حذف شد
> ستون ZIP: **F** = `LINGU-FULL-FINAL.zip` · **C** = `LINGU-CONTENT-FACTORY.zip` · **P** = `LINGU-PRODUCT-CORE.zip`

## ۱) پوشهٔ تحویل — `LINGU-RELEASE/`

| PATH | PURPOSE | KEEP/OPTIONAL | USED-BY | ZIP |
|---|---|---|---|---|
| `LINGU-RELEASE/LINGU-FULL-FINAL.zip` | کل پروژه بدون Secret/cache/history | KEEP | مالک، آرشیو | — |
| `LINGU-RELEASE/LINGU-CONTENT-FACTORY.zip` | بستهٔ کوچک چت محتوا | KEEP | چت جدید Content | — |
| `LINGU-RELEASE/LINGU-PRODUCT-CORE.zip` | وب + بک‌اند بدون انبوه درس/صدا | KEEP | چت/توسعهٔ محصول | — |
| `LINGU-RELEASE/LINGU-NEW-CONTENT-CHAT-PROMPT-FA.md` | پرامپت شروع چت جدید | KEEP | چت جدید | F C (در `handoff/` و ریشهٔ C) |
| `LINGU-RELEASE/LINGU-CONTENT-HANDOFF.md` | وضعیت واقعی + نقطهٔ شروع | KEEP | چت جدید | F C |
| `LINGU-RELEASE/LINGU-FILE-MANIFEST.md` | همین سند | KEEP | همه | F C P |
| `LINGU-RELEASE/HANDOFF-ACCOUNT-INFO-REDACTED.md` | شناسه‌ها + فهرست نام Secretها (بدون مقدار) | KEEP | همه | F C P |

## ۲) Content Factory — `lingu/content/`, `lingu/content-schema/`

| PATH | PURPOSE | KEEP/OPTIONAL | USED-BY | ZIP |
|---|---|---|---|---|
| `lingu/content/en/A1/lessons/L001–L100.json` | درس‌های A1 (100) | KEEP | Import، وب (از DB) | F C |
| `lingu/content/en/A2/lessons/L101–L200.json` | درس‌های A2 (100) | KEEP | همان | F C |
| `lingu/content/en/B1/lessons/L201–L326.json` | درس‌های B1 (126؛ L324–L326 با ۱۶ خطای باز) | KEEP | همان | F C |
| `lingu/content/en/*/specs/*.json` | خروجی parse بذر (A1 21 · A2 30 · B1 45) | KEEP | build_lessons | F C |
| `lingu/content/en/{A2,B1}/seeds/*.seed` | بذرهای متنی (A2 30 · B1 45) | KEEP | parse_seed، run_part | F C |
| `lingu/content/en/B1/seeds/b17-part2.seed` | بذر باز L324–L326 (parse‌نشده پس از آخرین اصلاح؛ ۳۸ `\u200` لفظی) | KEEP | ادامهٔ کار | F C |
| `lingu/content/audio/L###.plan.json` (326) | مانیفست صوتی هر درس | KEEP | تولید TTS، validate | F C |
| `lingu/content/audio/generated/**` (10 mp3) | صدای واقعی تولیدی L001/L002/L010/L020 | KEEP | upload_audio، پلیر | F C |
| `lingu/content/audio/samples/**` (10 mp3) | نمونه‌های دروازه L001/L002 | KEEP | مرجع صدای نقش‌ها | F C |
| `lingu/content/audio/voices.json` | رجیستری گوینده (ماشینی) | KEEP | build_plans، TTS | F C |
| `lingu/content/audio/registry.json` | رجیستری آپلود Storage | KEEP | build_audio_refs، audio_qa | F C |
| `lingu/content/audio/plans-meta.json` | نقش راوی/شنیداری هر درس | KEEP | build_plans، build_lessons | F C |
| `lingu/content/tools/parse_seed.mjs` | بذر → spec | KEEP | run_part | F C |
| `lingu/content/tools/build_lessons.mjs` | spec → درس | KEEP | run_part | F C |
| `lingu/content/tools/build_plans.mjs` | مانیفست صوتی | KEEP | run_part | F C |
| `lingu/content/tools/validate.mjs` | اعتبارسنج (فقط‌خواندنی) | KEEP | run_part، پیش از Import | F C |
| `lingu/content/tools/build_import_sql.mjs` | SQL Import idempotent | KEEP | Import | F C |
| `lingu/content/tools/build_audio_refs.mjs` | ارجاع صوتی در درس | KEEP | زنجیرهٔ صدا | F C |
| `lingu/content/tools/upload_audio.mjs` | آپلود mp3 به `lesson-audio` | KEEP | زنجیرهٔ صدا | F C |
| `lingu/content/tools/probe_audio.py` | سنجش فنی mp3 | KEEP | زنجیرهٔ صدا | F C |
| `lingu/content/tools/lesson_to_seed.mjs` | Recovery: درس → بذر | KEEP | بازسازی | F C |
| `lingu/content/tools/normalize_seed.py` | نرمال‌سازی سادهٔ بذر (قدیمی‌تر از tidy_seed) | OPTIONAL | دستی | F C |
| `lingu/content/tools/run_batch.sh` | پایپ‌لاین چندبذری (مرجع) | OPTIONAL | دستی | F C |
| `lingu/content/tools/lib/audio-map.mjs` | نگاشت کلیپ → بخش | KEEP | validate، build_* | F C |
| `lingu/content/tools/ops/run_part.sh` | پایپ‌لاین یک بخش | KEEP | چرخهٔ هر بخش | F C |
| `lingu/content/tools/ops/tidy_seed.py` | ترمیم بذر + گیومهٔ لاتین | KEEP | run_part | F C |
| `lingu/content/tools/ops/vocabulary_check.py` | used/pair واژگان | KEEP | پیش از نگارش | F C |
| `lingu/content/tools/ops/qa-lessons.sql` | JSON درس‌ها برای QA | KEEP | qa/batch_qa.mjs | F C |
| `lingu/content/tools/ops/README.md` | قوانین زرین بذر | KEEP | نویسندهٔ بذر | F C |
| `lingu/content/reports/*.md` (6) | STAGE-0، GATE-2، BATCH-1، RUN-L021-L100، RUN-L101-L340، AUDIO-INTEGRATION | KEEP | سابقه و اعداد DB | F C |
| `lingu/content/RUNBOOK-FA.md` | روال اجرایی | KEEP | چت جدید | F C |
| `lingu/content/LOCALIZATION-RULES-FA.md` | قواعد FR/ES | KEEP | چت جدید | F C |
| `lingu/content/VOICE-REGISTRY-FA.md` | رجیستری گوینده (خوانا) | KEEP | چت جدید | F C |
| `lingu/content/README.md` | فهرست کارخانهٔ محتوا | KEEP | چت جدید | F · C (به‌صورت `README.md` ریشه) |
| `lingu/content-schema/LESSON-SCHEMA-FA.md` | ساختار رسمی درس + DB | KEEP | محتوا و محصول | F C P |
| (فقط در C) `content-schema/db/0003_lessons.sql`, `0006_rls.sql` | کپی قرارداد DB برای چت محتوا | KEEP | Import | C |
| `lingu/docs/CONTENT-FACTORY-MASTER-PROMPT-FA.md` | قرارداد کامل نگارش (نسخهٔ ۱ + وضعیت تا L100) | KEEP | چت جدید | F P · C (ریشه) |
| `lingu/docs/CONTENT-AUDIT-FA.md` | بررسی واقعی پیش از Content Factory | OPTIONAL | سابقه | F P C |

## ۳) Product Core — `lingu/web`, `lingu/supabase`, `lingu/design`, `lingu/docs`

| PATH | PURPOSE | KEEP/OPTIONAL | USED-BY | ZIP |
|---|---|---|---|---|
| `lingu/web/package.json`, `package-lock.json` | وابستگی‌های وب | KEEP | npm ci | F P |
| `lingu/web/vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `index.html` | پیکربندی build | KEEP | build | F P |
| `lingu/web/wrangler.toml` | پروژهٔ Cloudflare Pages `lingu-web` | KEEP | deploy | F P |
| `lingu/web/.env.example` | قالب env (بدون مقدار) | KEEP | راه‌اندازی | F P |
| `lingu/web/public/` (`_redirects`, `_headers`, brand، icons، art، manifest) | دارایی‌های عمومی + روتینگ SPA + هدرهای امنیتی | KEEP | build | F P |
| `lingu/web/src/App.tsx`, `main.tsx` | ورودی و روتر | KEEP | build | F P |
| `lingu/web/src/pages/public/*` (6) | سایت عمومی | KEEP | build | F P |
| `lingu/web/src/pages/auth/*` (4) | ورود/ثبت‌نام/فراموشی/ریست رمز | KEEP | Auth | F P |
| `lingu/web/src/pages/app/*` (11) | برنامهٔ کاربر (LessonDetail = پلیر صوتی، Tutor، Conversation، Subscription…) | KEEP | build | F P |
| `lingu/web/src/pages/admin/*` (13) | پنل ادمین (Lessons + انتشار، ContentFactory، AISettings، Plans، Subscriptions…) | KEEP | ادمین | F P |
| `lingu/web/src/components/**` | AppShell، layoutها، tour، chat، ui | KEEP | build | F P |
| `lingu/web/src/services/api.ts`, `types.ts` | لایهٔ داده Supabase | KEEP | همهٔ صفحه‌ها | F P |
| `lingu/web/src/lib/supabase.ts` | کلاینت Supabase — فقط از env (بدون کلید hard-coded) | KEEP | api.ts | F P |
| `lingu/web/src/dev/demoApi.ts` | حالت پیش‌نمایش طراحی (در build تولیدی مسدود) | OPTIONAL | dev | F P |
| `lingu/supabase/migrations/0001–0012_*.sql` | Schema، RLS، RPC، Storage، usage hygiene | KEEP | DB | F P |
| `lingu/supabase/SETUP.sql` | همهٔ migrationها در یک فایل idempotent | KEEP | SQL Editor | F P |
| `lingu/supabase/config.toml` | پیکربندی CLI/توابع (verify_jwt) | KEEP | deploy | F P |
| `lingu/supabase/functions/ai-chat/*` | AI Tutor | KEEP | وب | F P |
| `lingu/supabase/functions/conversation/*` | Conversation Partner | KEEP | وب | F P |
| `lingu/supabase/functions/content-admin/*` | اکشن‌های ادمین (ذخیره/تست کلید AI؛ اکشن‌های تولید = 409 عمدی) | KEEP | پنل ادمین | F P |
| `lingu/supabase/functions/_shared/*` | context (کلید Groq از `ai_secrets`)، groq، http، prompt | KEEP | هر سه تابع | F P |
| `lingu/supabase/functions/README.md` | راهنمای استقرار توابع | KEEP | deploy | F P |
| `lingu/supabase/test/*` | تست DB/RLS و توابع (`run-all.sh`) | KEEP | QA بک‌اند | F P |
| `lingu/design/src/*` (15) | منابع طراحی (تصاویر، mark، og) | KEEP | برند | F P |
| `lingu/docs/ARCHITECTURE.md` | معماری | KEEP | توسعه | F P |
| `lingu/docs/BACKEND-SETUP-FA.md` | راهنمای اتصال بک‌اند (مقدار کلید/رمز حذف شد) | KEEP | راه‌اندازی | F P |
| `lingu/docs/BACKEND-REPORT-FA.md`, `FINALIZATION-REPORT-FA.md`, `USAGE-REPORT-FA.md` | گزارش‌های فاز | KEEP | سابقه | F P |
| `lingu/docs/PHASE-STATUS.md`, `ROADMAP-FA.md`, `USER-SETUP-FA.md` | وضعیت فاز، نقشهٔ راه، راهنمای کاربر | KEEP | برنامه‌ریزی | F P |
| `lingu/README.md` | معرفی پروژه (⚠️ از `myket-verify` نام می‌برد که هنوز وجود ندارد) | KEEP | همه | F P |
| `lingu/.github/workflows/web-deploy.yml` | CI build + deploy Cloudflare | KEEP | GitHub (remote ندارد) | F P |
| `lingu/.gitignore` | قواعد ignore (env، dist، tsbuildinfo، supabase/.temp) | KEEP | git | F P |

تکراری‌های **عمدی** (حفظ شدند): سه `supabase/functions/*/index.ts` یکسان (ورودی نازک هر تابع) · `web/public/brand/mark.png` = `icons/icon-512.png` · `design/src/mark.svg` = `web/public/brand/mark.svg` (منبع طراحی در برابر دارایی منتشرشده).

## ۴) QA Harness — `qa/`

| PATH | PURPOSE | KEEP/OPTIONAL | USED-BY | ZIP |
|---|---|---|---|---|
| `qa/batch_qa.mjs` | QA رندر درس‌های تازهٔ هر دسته | KEEP | چرخهٔ محتوا | F C |
| `qa/audio_qa.mjs` | QA پلیر صوتی (دسکتاپ/موبایل) | KEEP | زنجیرهٔ صدا | F C |
| `qa/batch_qa_report.json`, `audio_qa_report.json` | آخرین نتایج QA (دستهٔ ۱۶ · صدا 2026-09-30) | OPTIONAL | سابقه | F C |
| `qa/package.json`, `package-lock.json` | وابستگی puppeteer | KEEP | همهٔ تست‌های مرورگری | F C P |
| `qa/flowtest.js`, `qa/prodtest.js` | تست مسیر کاربر و smoke تست build تولیدی (ارجاع: FINALIZATION-REPORT) | KEEP | QA محصول | F P |
| `qa/liveflow.js`, `qa/livetest.py`, `qa/livetest2.py` | تست زندهٔ Auth/RLS/Storage و نشست (ارجاع: BACKEND-REPORT) | KEEP | QA بک‌اند | F P |
| `qa/live_ai_test.py` | تست زندهٔ Edge Functionهای AI (Tutor، Partner، سهمیه، Premium) | KEEP | QA AI | F P |
| `qa/connect_live.sh` | تست اتصال DB + اعمال SETUP.sql (رمز فقط آرگومان) | KEEP | راه‌اندازی | F P |

## ۵) فقط روی Disk (عمداً بیرون از ZIP)

| PATH | چرا |
|---|---|
| `lingu/web/.env` | مقدار واقعی کلید publishable — Secret Policy |
| `lingu/.git/` (19M، ۱۸ commit) | یک commit قدیمی مقدار کلید publishable را دارد؛ commitهای قدیمی‌تر (۳ فایل حذف‌شدهٔ v0.1/v0.2) فقط اینجا قابل بازیابی‌اند |
| `uploads/image-1.png` | فایل ورودی خود کاربر (اسکرین‌شات Error 1016 روی `lingu-web.pages.dev`، 2026-09-27)؛ اطلاعاتش در HANDOFF-ACCOUNT ثبت شد |
| `.config/`, `.pki/`, `.profile`, `.supabase/` (telemetry) | فایل‌های سیستم/CLI — بخشی از پروژه نیستند |

## ۶) حذف‌شده پس از تست ZIPها (هیچ‌کدام در ZIPها نیست)

| PATH | دلیل و شاهد |
|---|---|
| `LINGU-v0.1-Phase1.zip` (11.5M، 166 فایل) | 36 فایل یکسان با Workspace · 47 فایل متفاوت = همه بایت‌به‌بایت نسخهٔ **قدیمی‌تر** موجود در تاریخچهٔ git · 83 فایل فقط-در-ZIP = اسکرین‌شات + گزارش HTML + `web/dist` (build) + ۳ فایل Source که عمداً حذف شده‌اند: `AppLayout.tsx` و `AppHome.tsx` در commit `a5a24f8` (جایگزینی با AppShell) و `Setup.tsx` در `fe62b69` (حذف مسیر ساختگی) — هر سه در `lingu/.git` قابل بازیابی |
| `LINGU-v0.2-Product-Experience.zip` (7.5M، 181 فایل) | 91 یکسان · 36 متفاوت = همه نسخهٔ قدیمی‌تر در git · فقط-در-ZIP: `Setup.tsx` (بالا) + `report.html` + ۵۲ اسکرین‌شات `shots2/` |
| `LINGU-v0.3-Backend.zip` (1.9M، 151 فایل) | 138 یکسان · 13 متفاوت = همه نسخهٔ قدیمی‌تر در git · **۰ فایل منحصربه‌فرد** |
| `LINGU-Phase1-Report.html` (1.2M) | گزارش فاز ۱ (بایت‌به‌بایت همان نسخهٔ داخل v0.1)؛ جایگزین: `docs/PHASE-STATUS.md`, `FINALIZATION-REPORT-FA.md` |
| `LINGU-Phase2-Product-Experience-Report.html` (3.3M) | گزارش فاز ۲؛ جایگزین: همان docs |
| `screens/` (43 تصویر، 9.8M) | هر ۴۳ فایل هم‌نام اسکرین‌شات‌های v0.1 — مصرف‌کننده‌ای ندارند |
| `qa/shots/` (144 تصویر، 19M) | خروجی QA قدیمی؛ نتایج در `*_report.json` ثبت است |
| `qa/crop-tl.png`, `qa/crop-top.png` | برش اسکرین‌شات دیباگ |
| `qa/probe.js`, `probe2–6.js`, `dbg_lessons.js`, `dbg_onboard.js`, `diag_doc.js`, `diag_refresh.js`, `diag_tour.js`, `diag_tour2.js`, `quickcheck.js` | پروب‌های یک‌بارهٔ دیباگ؛ هیچ ارجاعی در docs/گزارش‌ها/ابزارها |
| `qa/shot.js`, `qa/report.py` | سازندهٔ اسکرین‌شات و گزارش HTML فاز ۲ (خروجی و ورودی‌اش حذف شده) |
| `qa/signup_check.js`, `tourcheck.js`, `tutor_ui_check.js`, `ui_flow_check.js` | بررسی‌های یک‌بارهٔ رفع باگ روی dev server؛ بدون ارجاع |
| `lingu/content/en/B1/specs/*.seed` (26 فایل) | هیچ ابزاری `.seed` در `specs/` نمی‌نویسد · 25 فایل بایت‌به‌بایت تکرار `seeds/` · `b17-part2.seed` نسخهٔ قدیمی‌تر همان بذر (171 خط هر دو؛ ۱۲ خط تفاوت = ۱۰ گیومه‌گذاری + ۲ اصلاح که نسخهٔ `seeds/` دارد) |
| `lingu/web/tsconfig.tsbuildinfo` | کش build تایپ‌اسکریپت (در .gitignore) |
| `lingu/supabase/.temp/` | کش CLI (شناسه‌های مفیدش به HANDOFF-ACCOUNT منتقل شد) |
