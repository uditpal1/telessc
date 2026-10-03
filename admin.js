let adminUser=null;
const adminViews=["dashboard","users","results","analytics","tests","referrals","subadmin","scoreboard"];

function adminShow(id){
  adminViews.forEach(x=>document.getElementById("admin-"+x).classList.toggle("hidden",x!==id));
  if(id==="dashboard") loadAdminDashboard();
  if(id==="users") loadUsers();
  if(id==="results") loadResults();
  if(id==="analytics") loadAnalytics();
  if(id==="scoreboard") loadAdminScoreboard();
}

document.querySelectorAll("[data-admin]").forEach(b=>b.onclick=()=>adminShow(b.dataset.admin));

async function requireAdmin(){
  const tu=window.Telegram?.WebApp?.initDataUnsafe?.user;
  let q=sb.from("users").select("*").eq("telegram_id",String(tu?.id||"")).maybeSingle();
  const {data,error}=await q;
  if(error||!data||data.role!=="admin") throw new Error("Main Admin access required.");
  adminUser=data;
  loadAdminDashboard();
}
async function loadAdminDashboard(){
  const {count:users}=await sb.from("users").select("*",{count:"exact",head:true});
  const {count:premium}=await sb.from("users").select("*",{count:"exact",head:true}).eq("ssc_gd_premium",true);
  const {count:attempts}=await sb.from("attempts").select("*",{count:"exact",head:true});
  document.getElementById("adminStats").innerHTML=[["Total Users",users||0],["Premium Users",premium||0],["Total Attempts",attempts||0]].map(x=>`<div class="kpi"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("");
}
async function loadUsers(){
  const {data}=await sb.from("users").select("id,name,telegram_username,role,ssc_gd_premium,is_active,created_at").order("created_at",{ascending:false});
  renderUsers(data||[]);
}
function renderUsers(rows){
  document.getElementById("usersTable").innerHTML=`<div class="card table-wrap"><table><thead><tr><th>Name</th><th>Telegram</th><th>Role</th><th>Premium</th><th>Active</th></tr></thead><tbody>${rows.map(u=>`<tr><td>${esc(u.name)}</td><td>@${esc(u.telegram_username||"")}</td><td>${u.role}</td><td>${u.ssc_gd_premium?"Yes":"No"}</td><td>${u.is_active?"Yes":"No"}</td></tr>`).join("")}</tbody></table></div>`;
}
document.getElementById("userSearch").addEventListener("input",async e=>{
  const term=e.target.value.trim();
  const {data}=await sb.from("users").select("id,name,telegram_username,role,ssc_gd_premium,is_active,created_at").or(`name.ilike.%${term}%,telegram_username.ilike.%${term}%`);
  renderUsers(data||[]);
});
async function loadResults(){
  const {data}=await sb.from("attempts").select("user_id,test_id,attempt_number,score,correct,wrong,skipped,time_taken,created_at").order("created_at",{ascending:false}).limit(200);
  document.getElementById("resultsTable").innerHTML=`<div class="card table-wrap"><table><thead><tr><th>Test</th><th>Attempt</th><th>Score</th><th>C/W/S</th><th>Date</th></tr></thead><tbody>${(data||[]).map(r=>`<tr><td>${esc(r.test_id)}</td><td>${r.attempt_number}</td><td>${Number(r.score).toFixed(2)}</td><td>${r.correct}/${r.wrong}/${r.skipped}</td><td>${new Date(r.created_at).toLocaleString()}</td></tr>`).join("")}</tbody></table></div>`;
}
async function loadAnalytics(){
  const {data}=await sb.from("attempts").select("score,correct,wrong,skipped");
  const rows=data||[], avg=rows.length?rows.reduce((a,b)=>a+Number(b.score),0)/rows.length:0;
  document.getElementById("analyticsBox").innerHTML=`<div class="grid2"><div class="kpi"><b>${avg.toFixed(2)}</b><span>Average Score</span></div><div class="kpi"><b>${(avg/160*100).toFixed(2)}%</b><span>Average %</span></div><div class="kpi"><b>${rows.reduce((a,b)=>a+b.correct,0)}</b><span>Correct</span></div><div class="kpi"><b>${rows.reduce((a,b)=>a+b.wrong,0)}</b><span>Wrong</span></div></div>`;
}
async function loadAdminScoreboard(){
  const {data:users}=await sb.from("users").select("id,name");
  const {data:ats}=await sb.from("attempts").select("user_id,score");
  const m={};(ats||[]).forEach(a=>(m[a.user_id]??=[]).push(Number(a.score)));
  const rows=(users||[]).map(u=>{const s=m[u.id]||[];return {name:u.name,n:s.length,avg:s.length?s.reduce((a,b)=>a+b,0)/s.length:0,best:s.length?Math.max(...s):0}}).filter(x=>x.n).sort((a,b)=>b.avg-a.avg);
  document.getElementById("adminScoreboard").innerHTML=`<div class="card table-wrap"><table><thead><tr><th>Rank</th><th>User</th><th>Tests</th><th>Avg</th><th>Best</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${r.n}</td><td>${r.avg.toFixed(2)}</td><td>${r.best.toFixed(2)}</td></tr>`).join("")}</tbody></table></div>`;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
document.getElementById("adminLogout").onclick=()=>location.href="index.html";
requireAdmin().catch(e=>{alert(e.message);location.href="index.html";});
