window.currentUser = null;

function telegramUser(){
  try{
    const u = window.Telegram?.WebApp?.initDataUnsafe?.user;
    return u || null;
  }catch(e){ return null; }
}

async function ensureTelegramUser(){
  const tu = telegramUser();
  if(!tu) return null;

  const {data: existing, error} = await sb.from("users").select("*").eq("telegram_id", String(tu.id)).maybeSingle();
  if(error) throw error;
  if(existing){
    if(!existing.is_active) throw new Error("Your account is inactive.");
    currentUser = existing;
    return existing;
  }

  const name = [tu.first_name, tu.last_name].filter(Boolean).join(" ") || tu.username || "Telegram User";
  const {data, error: insErr} = await sb.from("users").insert({
    telegram_id: String(tu.id),
    telegram_username: tu.username || null,
    name,
    role: "user",
    ssc_gd_premium: false,
    is_active: true
  }).select("*").single();

  if(insErr) throw insErr;
  currentUser = data;
  return data;
}

async function loadCurrentUser(){
  return ensureTelegramUser();
}

function logoutUser(){
  currentUser = null;
  try{ window.Telegram?.WebApp?.close(); }catch(e){}
}
