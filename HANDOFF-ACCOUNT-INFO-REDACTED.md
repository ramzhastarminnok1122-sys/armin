# LINGU · Account Information (REDACTED)

> تاریخ استخراج: 2026-10-02 · منبع: خود Workspace (کد، docs، گزارش‌ها) + بررسی زندهٔ همین تاریخ.
> **این سند هیچ رمز، کلید، توکن یا Cookie ندارد.** فقط نام Secretها، محل نگه‌داری و وضعیت آمده است.

## ۱) شناسه‌ها

| مورد | مقدار | منبع / وضعیت |
|---|---|---|
| App name | LINGU (عنوان وب: «LINGU — زبان را فقط نخوان؛ واقعاً یاد بگیر.») | `web/index.html` · `VITE_APP_NAME` |
| Supabase project ref | `wyzjdeqezbasuskkvhgd` | `docs/BACKEND-SETUP-FA.md` |
| Supabase project name | `ramzhastarminnok1122-sys's Project` | کش CLI `supabase/.temp/linked-project.json` (کش پس از ثبت در اینجا حذف شد) |
| Supabase organization id / slug | `dekkgccdwnpergezaxsv` | همان |
| Supabase CLI (آخرین نسخهٔ دیده‌شده) | v2.118.0 | همان |
| Supabase API URL (عمومی) | `https://wyzjdeqezbasuskkvhgd.supabase.co` | زنده: PostgREST پاسخ HTTP 200 داد (2026-10-02) |
| Storage bucket صوت | `lesson-audio` (خواندن عمومی؛ مسیر `<lang>/<hash8>.mp3`) | `content/audio/registry.json` |
| Edge Functions مستقر | `ai-chat`, `conversation`, `content-admin` | `docs/PHASE-STATUS.md` فاز ۱.۸–۱.۹ (در این Task دوباره سنجیده نشد) |
| Owner / Admin email | `aiveosora1122@gmail.com` (نقش admin) | `docs/PHASE-STATUS.md` |
| QA account | `ops.audio@lingu.app` (نقش admin؛ فقط برای QA مرورگری درس‌های منتشرنشده) | گزارش‌های RUN · **رمز در دسترس نیست** (پایین) |
| اشتراک آزمایشی مالک | `provider=manual` ۳۰ روزه، قابل لغو از پنل ادمین → اشتراک‌ها | `docs/PHASE-STATUS.md` |
| Cloudflare Pages project (برنامه‌ریزی‌شده) | `lingu-web` | `web/wrangler.toml` |
| Domain | `lingu-web.pages.dev` — **هنوز وجود ندارد** | زنده 2026-10-02: DNS = NXDOMAIN؛ اسکرین‌شات کاربر 2026-09-27: Cloudflare Error 1016؛ `PHASE-STATUS.md`: «پروژهٔ Pages ساخته نشده — منتظر توکن Cloudflare» |
| ⚠️ دامنهٔ مشابه نامرتبط | `lingu.pages.dev` = محصول دیگری به نام «LinguPlay» با پروژهٔ Supabase دیگر | بررسی زنده 2026-10-02 — **به LINGU ربطی ندارد؛ استفاده نشود** |
| Custom domain | ندارد | — |
| Repository | فقط git محلی: `lingu/.git` · branch `master` · ۱۸ commit (2026-09-25 → 2026-09-30) · **هیچ remote تنظیم نشده** | `git remote` خالی |
| CI | `.github/workflows/web-deploy.yml` (build + deploy روی Cloudflare Pages) — چون remote ندارد هرگز اجرا نشده | — |
| Workspace | Arena Agent workspace · ریشهٔ پروژه `/home/user/lingu` | — |

## ۲) فهرست Secretها (فقط نام · محل · وضعیت)

```
SECRET_NAME=VITE_SUPABASE_URL
LOCATION=web/.env (محلی، gitignore) · GitHub Actions secret (برای CI)
STATUS=Configured locally · عمومی است (Secret واقعی نیست)

SECRET_NAME=VITE_SUPABASE_ANON_KEY   (نام جایگزین در کد: VITE_SUPABASE_PUBLISHABLE_KEY)
LOCATION=web/.env (محلی، gitignore، خارج از همهٔ ZIPها) · GitHub Actions secret · Cloudflare Pages env
STATUS=Configured locally · کلید publishable (سمت کلاینت)؛ مقدارش از docs پاک شد
NOTE=یک commit قدیمی در lingu/.git مقدار این کلید را دارد → .git در هیچ ZIP نیست

SECRET_NAME=SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEYS
LOCATION=Supabase Edge Functions runtime (تزریق خودکار پلتفرم)
STATUS=Platform-managed · در Workspace وجود ندارد

SECRET_NAME=GROQ_API_KEY
LOCATION=جدول سرور-only public.ai_secrets.groq_api_key (از پنل ادمین → AI) یا Function secret به‌عنوان fallback
STATUS=Configured (طبق commit e57d6df و PHASE-STATUS: تست test_ai = 200) · در این Task دوباره سنجیده نشد

SECRET_NAME=DB_PASSWORD (Postgres role postgres — برای psql Import)
LOCATION=نزد مالک · Supabase → Settings → Database
STATUS=Not in workspace (نسخهٔ موقت /tmp از بین رفته) · برای Import بعدی لازم است؛ پیشنهاد: Reset

SECRET_NAME=QA_ACCOUNT_PASSWORD (ops.audio@lingu.app)
LOCATION=قبلاً فقط /tmp/ops_pw
STATUS=LOST · پیش از QA بعدی از داشبورد Supabase (Auth → Users) ریست شود

SECRET_NAME=SUPABASE_ACCESS_TOKEN (Personal Access Token برای CLI / deploy توابع)
LOCATION=نزد مالک · supabase.com/dashboard/account/tokens
STATUS=Not in workspace

SECRET_NAME=SUPABASE_TOKEN (توکن موقت نشست ادمین برای content/tools/upload_audio.mjs)
LOCATION=فقط متغیر محیطی لحظهٔ اجرا
STATUS=Runtime-only · ذخیره نمی‌شود

SECRET_NAME=CLOUDFLARE_API_TOKEN · CLOUDFLARE_ACCOUNT_ID · CF_PAGES_PROJECT
LOCATION=GitHub Actions secrets (طبق web-deploy.yml)
STATUS=Not configured · سایت منتشر نشده (فاز ۱.۹ منتظر توکن)

SECRET_NAME=MYKET_* (پرداخت)
LOCATION=—
STATUS=Not implemented · فاز ۳ (Myket) شروع نشده؛ فقط جدول myket_products وجود دارد

SECRET_NAME=SMTP_*
LOCATION=—
STATUS=Not configured · تأیید ایمیل در Auth خاموش است (docs/BACKEND-SETUP-FA.md)
```

## ۳) پاک‌سازی انجام‌شده در این Task

- `docs/BACKEND-SETUP-FA.md` خط ۳۷: مقدار کلید publishable حذف و با راهنمای «از Settings → API Keys کپی شود» جایگزین شد.
- همان فایل خط ۵۴: پیشوند رمز دیتابیس حذف شد.
- `web/.env` روی Disk ماند (برای build محلی لازم است) ولی در **هیچ** ZIP نیست.
- اسکن کامل (JWT، `sb_secret_`، `gsk_`، `sk-`، private key، PGPASSWORD، رمز لفظی) روی ریپو و qa: موردی باقی نماند.
