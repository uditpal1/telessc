let state = {view:"home"};

const views = [...document.querySelectorAll(".view")];

function showSection(id){
  views.forEach(v=>v.classList.toggle("hidden", v.id !== id));
  state.view = id;
  window.scrollTo({top:0,behavior:"smooth"});
  if(id !== "test") document.getElementById("bottomNav")?.classList.remove("hidden");
  else document.getElementById("bottomNav")?.classList.add("hidden");
  if(id==="dashboard") refreshDashboard();
  if(id==="full-tests") renderFullTests();
  if(id==="performance") loadPerformance();
  if(id==="scoreboard") loadScoreboard();
  if(id==="profile") renderProfile();
  if(id==="premium") setupPremium();
}

document.addEventListener("click", e=>{
  const b=e.target.closest("[data-go]");
  if(b){ e.preventDefault(); showSection(b.dataset.go); }
});

async function refreshDashboard(){
  if(!currentUser) return;
  document.getElementById("userName").textContent=currentUser.name||"User";
  document.getElementById("premiumBadge").textContent=currentUser.ssc_gd_premium?"PREMIUM":"FREE";
  const {data}=await sb.from("attempts").select("score").eq("user_id",currentUser.id);
  const rows=data||[];
  const avg=rows.length?rows.reduce((a,b)=>a+Number(b.score||0),0)/rows.length:0;
  document.getElementById("statAttempts").textContent=rows.length;
  document.getElementById("statAvg").textContent=avg.toFixed(2);
  document.getElementById("statBest").textContent=rows.length?Math.max(...rows.map(x=>Number(x.score||0))).toFixed(2):"0";
  document.getElementById("statPct").textContent=(avg/160*100).toFixed(2)+"%";
}

function renderFullTests(){
  const box=document.getElementById("fullTestsList");
  box.innerHTML="";
  for(let i=1;i<=50;i++){
    const free=i===1;
    const locked=!free && !currentUser?.ssc_gd_premium;
    const div=document.createElement("div");
    div.className="card";
    div.innerHTML=`<div class="section-head"><div><b>SSC GD Full Mock ${String(i).padStart(2,"0")}</b><div class="muted">80 Q • 160 Marks • 60 min</div></div><span class="badge">${free?"FREE":locked?"LOCKED":"UNLOCKED"}</span></div><div class="muted">2 attempts maximum • 15 min per section</div><button class="${locked?"secondary":"primary"} full>${locked?"🔒 Unlock Premium":"🚀 Start Test"}</button>`;
    div.querySelector("button").onclick=()=>locked?showSection("premium"):startFullMock(i);
    box.appendChild(div);
  }
}

document.querySelectorAll(".subject-card").forEach(b=>b.addEventListener("click",()=>startSubjectTest(b.dataset.subject)));

async function loadPerformance(){
  const {data}=await sb.from("attempts").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false});
  const rows=data||[];
  const avg=rows.length?rows.reduce((a,b)=>a+Number(b.score||0),0)/rows.length:0;
  document.getElementById("performanceBox").innerHTML=`
    <h3>${rows.length} attempts</h3>
    <p>Average Score: <b>${avg.toFixed(2)} / 160</b></p>
    <p>Average Percentage: <b>${(avg/160*100).toFixed(2)}%</b></p>
    <p>Best Score: <b>${rows.length?Math.max(...rows.map(x=>Number(x.score||0))).toFixed(2):0}</b></p>
    <p>Correct: <b>${rows.reduce((a,b)=>a+Number(b.correct||0),0)}</b></p>
    <p>Wrong: <b>${rows.reduce((a,b)=>a+Number(b.wrong||0),0)}</b></p>
    <p>Skipped: <b>${rows.reduce((a,b)=>a+Number(b.skipped||0),0)}</b></p>`;
}

async function loadScoreboard(){
  const {data: users}=await sb.from("users").select("id,name");
  const {data: attempts}=await sb.from("attempts").select("user_id,score");
  const map={};
  (attempts||[]).forEach(a=>{
    map[a.user_id] ||= [];
    map[a.user_id].push(Number(a.score||0));
  });
  const rows=(users||[]).map(u=>{
    const s=map[u.id]||[];
    return {name:u.name||"User",tests:s.length,avg:s.length?s.reduce((a,b)=>a+b,0)/s.length:0,best:s.length?Math.max(...s):0};
  }).filter(x=>x.tests).sort((a,b)=>b.avg-a.avg);
  document.getElementById("scoreboardBody").innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(r.name)}</td><td>${r.tests}</td><td>${r.avg.toFixed(2)}</td><td>${r.best.toFixed(2)}</td></tr>`).join("");
}

function renderProfile(){
  document.getElementById("profileBox").innerHTML=`<p><b>Name:</b> ${escapeHtml(currentUser.name||"")}</p><p><b>Telegram:</b> @${escapeHtml(currentUser.telegram_username||"not set")}</p><p><b>Premium:</b> ${currentUser.ssc_gd_premium?"Active":"Not active"}</p><p><b>Joined:</b> ${new Date(currentUser.created_at).toLocaleString()}</p><button class="danger full" id="logout2">Logout</button>`;
  document.getElementById("logout2").onclick=logoutUser;
}

function setupPremium(){
  const msg=encodeURIComponent(`Hello, I want SSC GD Premium.\nName: ${currentUser?.name||""}\nTelegram: @${currentUser?.telegram_username||""}`);
  document.getElementById("waBtn").href=`https://wa.me/${APP_CONFIG.WHATSAPP_NUMBER}?text=${msg}`;
  document.getElementById("tgBtn").href=`https://t.me/${APP_CONFIG.TELEGRAM_USERNAME}`;
}

function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

async function init(){
  try{
    if(window.Telegram?.WebApp){ Telegram.WebApp.ready(); Telegram.WebApp.expand(); }
    await loadCurrentUser();
    document.getElementById("logoutBtn").classList.remove("hidden");
    document.getElementById("bottomNav").classList.remove("hidden");
    showSection("dashboard");
  }catch(e){
    console.error(e);
    showSection("home");
    alert(e.message||"Unable to load app.");
  }
}
document.getElementById("logoutBtn").onclick=logoutUser;
init();
