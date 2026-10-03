// Cloudflare Pages Function /functions/api/telegram.js
// This is a minimal webhook starter. Put TELEGRAM_BOT_TOKEN in Cloudflare secrets.
// It sends users a Mini App button. Do NOT expose the bot token in frontend files.

export async function onRequestPost({ request, env }) {
  const update = await request.json();
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) return new Response("Missing TELEGRAM_BOT_TOKEN", {status:500});

  const message = update.message;
  if (!message) return new Response("ok");

  const chatId = message.chat.id;
  const text = message.text || "";

  if (text === "/start" || text === "/app") {
    const body = {
      chat_id: chatId,
      text: "👋 Welcome to SSC GD Mock Test\\n\\n80 Questions • 160 Marks • 60 Minutes",
      reply_markup: {
        inline_keyboard: [[
          {
            text: "🚀 Open SSC GD App",
            web_app: { url: env.MINI_APP_URL }
          }
        ]]
      }
    };

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify(body)
    });
  }

  return new Response("ok");
}
