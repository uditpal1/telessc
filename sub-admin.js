let subUser=null;
const subViews=["dashboard","users","results","analytics","scoreboard"];
function subShow(id){
  subViews.forEach(x=>document.getElementById("sub-"+x).classList.toggle("hidden",x!==id));
  if(id==="dashboard")loadSubDashboard();
  if(id==="users")loadSubUsers();
  if(id==="results")loadSubResults();
  if(id==="analytics")loadSubAnalytics();
  if(id==="scoreboard")loadSubScoreboard();
}
document.querySelectorAll("[data-sub]").forEach(b=>b.onclick=()=>subShow(b.dataset.sub));
async function requireSub(){
  const tu=window.Telegram?.WebApp?.initDataUnsafe?.user;
  const {data,error}=await sb.from("users").select("*").eq("telegram_id",String(tu?.id||"")).maybeSingle();
  if(error||!data||data.role!=="sub_admin")throw new Error("Sub Admin access required.");
  subUser=data;loadSubDashboard();
}
async function loadSubDashboard(){
  const {count:users}=await sb.from("users").select("*",{count:"exact",head:true});
  const {count:premium}=await sb.from("users").select("*",{count:"exact",head:true}).eq("ssc_gd_premium",true);
  const {count:attempts}=await sb.from("attempts").select("*",{count:"exact",head:true});
  document.getElementById("subStats").innerHTML=[["Users",users||0],["Premium",premium||0],["Attempts",attempts||0]].map(x=>`<div class="kpi"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("");
}
async function loadSubUsers(){
  const {data}=await sb.from("users").select("name,telegram_username,role,ssc_gd_premium,created_at").order("created_at",{ascending:false});
  document.getElementById("subUsers").innerHTML=`<div class="card table-wrap"><table><thead><tr><th>Name</th><th>Telegram</th><th>Role</th><th>Premium</th></tr></thead><tbody>${(data||[]).map(u=>`<tr><td>${esc(u.name)}</td><td>@${esc(u.telegram_username||"")}</td><td>${u.role}</td><td>${u.ssc_gd_premium?"Yes":"No"}</td></tr>`).join("")}</tbody></table></div>`;
}
async function loadSubResults(){
  const {data}=await sb.from("attempts").select("test_id,attempt_number,score,correct,wrong,skipped,created_at").order("created_at",{ascending:false}).limit(200);
  document.getElementById("subResults").innerHTML=`<div class="card table-wrap"><table><thead><tr><th>Test</th><th>Attempt</th><th>Score</th><th>C/W/S</th><th>Date</th></tr></thead><tbody>${(data||[]).map(r=>`<tr><td>${esc(r.test_id)}</td><td>${r.attempt_number}</td><td>${Number(r.score).toFixed(2)}</td><td>${r.correct}/${r.wrong}/${r.skipped}</td><td>${new Date(r.created_at).toLocaleString()}</td></tr>`).join("")}</tbody></table></div>`;
}
async function loadSubAnalytics(){
  const {data}=await sb.from("attempts").select("score,correct,wrong,skipped");
  const rows=data||[],avg=rows.length?rows.reduce((a,b)=>a+Number(b.score),0)/rows.length:0;
  document.getElementById("subAnalytics").innerHTML=`<div class="grid2"><div class="kpi"><b>${avg.toFixed(2)}</b><span>Average Score</span></div><div class="kpi"><b>${(avg/160*100).toFixed(2)}%</b><span>Average %</span></div></div>`;
}
async function loadSubScoreboard(){
  const {data:users}=await sb.from("users").select("id,name");
  const {data:ats}=await sb.from("attempts").select("user_id,score");
  const m={};(ats||[]).forEach(a=>(m[a.user_id]??=[]).push(Number(a.score)));
  const rows=(users||[]).map(u=>{const s=m[u.id]||[];return {name:u.name,n:s.length,avg:s.length?s.reduce((a,b)=>a+b,0)/s.length:0,best:s.length?Math.max(...s):0}}).filter(x=>x.n).sort((a,b)=>b.avg-a.avg);
  document.getElementById("subScoreboard").innerHTML=`<div class="card table-wrap"><table><thead><tr><th>Rank</th><th>User</th><th>Tests</th><th>Avg</th><th>Best</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${r.n}</td><td>${r.avg.toFixed(2)}</td><td>${r.best.toFixed(2)}</td></tr>`).join("")}</tbody></table></div>`;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
document.getElementById("subLogout").onclick=()=>location.href="index.html";
requireSub().catch(e=>{alert(e.message);location.href="index.html";});
