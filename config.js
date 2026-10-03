// Replace these placeholders before deployment.
window.APP_CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
  GITHUB_TEST_BASE_URL: "https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/tests/ssc-gd",
  WHATSAPP_NUMBER: "91XXXXXXXXXX",
  TELEGRAM_USERNAME: "YOUR_TELEGRAM_USERNAME"
};

window.sb = window.supabase.createClient(
  window.APP_CONFIG.SUPABASE_URL,
  window.APP_CONFIG.SUPABASE_ANON_KEY
);
