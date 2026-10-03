# SSC GD Telegram Mini App

## Architecture

Telegram Bot -> Telegram Mini App -> Supabase

Only three HTML files:

- index.html = user Mini App
- admin.html = Main Admin
- sub-admin.html = read-only Sub Admin

Questions are JSON files under `tests/ssc-gd`.

## 1. Supabase

Open Supabase SQL Editor and run:

`supabase/schema.sql`

Then update `js/config.js`:

- SUPABASE_URL
- SUPABASE_ANON_KEY
- GITHUB_TEST_BASE_URL
- WHATSAPP_NUMBER
- TELEGRAM_USERNAME

## 2. GitHub

Upload the project to a GitHub repository.

The `tests/ssc-gd` folder must remain publicly fetchable for this prototype.

Change:

`GITHUB_TEST_BASE_URL`

to the raw GitHub path ending at `/tests/ssc-gd`.

## 3. Telegram Bot

Create a bot using @BotFather.

Keep the bot token secret.

For a simple Mini App, the bot's /start response can contain the Mini App button.

The included Cloudflare Pages Function is:

`functions/api/telegram.js`

Set Cloudflare secrets:

- TELEGRAM_BOT_TOKEN
- MINI_APP_URL

Then set your Telegram webhook to:

`https://YOUR-DOMAIN.com/api/telegram`

Use Telegram's official Bot API setWebhook method.

## 4. Mini App URL

Deploy the project to HTTPS hosting, for example Cloudflare Pages.

Your Mini App URL will look like:

https://your-project.pages.dev/

Use that URL as `MINI_APP_URL`.

## 5. Admin

Open the Mini App once from Telegram so a user record is created.

Find that user's Telegram ID in Supabase.

Run:

update public.users
set role = 'admin'
where telegram_id = 'YOUR_TELEGRAM_ID';

Only keep one Main Admin.

For Sub Admin:

update public.users
set role = 'sub_admin'
where telegram_id = 'SUB_ADMIN_TELEGRAM_ID';

## 6. Important security note

This repository is a prototype.

The sample RLS policies are intentionally simple so the app can be tested quickly.

Before production:

- Verify Telegram Mini App initData server-side.
- Do not trust initDataUnsafe alone for identity.
- Move privileged operations to a server/Edge Function.
- Tighten Supabase RLS.
- Never put the Supabase service_role key in frontend code.
- Do not use the prototype policies unchanged for a paid production app.

## 7. Test format

Full mock:

- 4 sections
- 20 questions per section
- 80 questions
- 160 marks
- +2 correct
- -0.25 wrong
- 0 skipped
- 15 minutes per section
- 60 minutes total
- maximum 2 attempts

The sample JSON contains placeholder questions. Replace them with your real SSC GD questions.

## 8. Adding more mocks

Copy:

tests/ssc-gd/full/mock-01.json

to:

mock-02.json

etc.

Keep each full mock at exactly 80 questions.

## 9. Hosting

The frontend can be hosted on GitHub Pages, Cloudflare Pages or Vercel.

The included `/functions/api/telegram.js` is written for Cloudflare Pages Functions.

## 10. Important

The current frontend uses Telegram's client-side user object for prototype identification. For a real paid application, implement server-side Telegram Web App initData validation before trusting identity, roles, premium status or admin permissions.
