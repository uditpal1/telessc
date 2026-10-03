let testState=null;

async function fetchJson(path){
  const base=APP_CONFIG.GITHUB_TEST_BASE_URL.replace(/\/$/,"");
  const res=await fetch(`${base}/${path}`);
  if(!res.ok) throw new Error("Test file could not be loaded.");
  return res.json();
}

async function startFullMock(num){
  const id=String(num).padStart(2,"0");
  try{
    const {count}=await sb.from("attempts").select("*",{count:"exact",head:true}).eq("user_id",currentUser.id).eq("test_id",`ssc-gd-full-${id}`);
    if((count||0)>=2){ alert("You have used both attempts for this mock."); return; }
    const json=await fetchJson(`full/mock-${id}.json`);
    beginTest(json,true);
  }catch(e){ alert(e.message); }
}

async function startSubjectTest(subject){
  const map={reasoning:"reasoning/test-01.json","gk-ga":"gk-ga/test-01.json","mathematics":"mathematics/test-01.json","english-hindi":"english-hindi/test-01.json"};
  try{
    const json=await fetchJson(`subjects/${map[subject]}`);
    beginTest(json,false);
  }catch(e){ alert(e.message); }
}

function beginTest(test,isFull){
  testState={
    test,isFull,sectionIndex:0,questionIndex:0,
    answers:{},startedAt:Date.now(),sectionStartedAt:Date.now(),remaining:(test.sections?.[0]?.duration||15)*60
  };
  showSection("test");
  renderQuestion();
  startTimer();
}

function currentSection(){return testState.test.sections[testState.sectionIndex];}
function currentQuestion(){return currentSection().questions[testState.questionIndex];}

function renderQuestion(){
  const sec=currentSection(), q=currentQuestion();
  document.getElementById("testSection").textContent=sec.title;
  document.getElementById("questionNo").textContent=`Question ${testState.questionIndex+1} / ${sec.questions.length}`;
  document.getElementById("questionText").textContent=q.question;
  const box=document.getElementById("options");
  box.innerHTML="";
  q.options.forEach((opt,i)=>{
    const b=document.createElement("button");
    b.className="option"+(testState.answers[q.id]===i?" selected":"");
    b.textContent=`${String.fromCharCode(65+i)}. ${opt}`;
    b.onclick=()=>{testState.answers[q.id]=i;renderQuestion();};
    box.appendChild(b);
  });
  document.getElementById("prevBtn").disabled=testState.questionIndex===0;
  document.getElementById("nextBtn").textContent=testState.questionIndex===sec.questions.length-1?"Next Section":"Next";
  const pct=((testState.questionIndex+1)/sec.questions.length)*100;
  document.getElementById("progressBar").style.width=pct+"%";
}

document.getElementById("prevBtn").onclick=()=>{
  if(testState.questionIndex>0){testState.questionIndex--;renderQuestion();}
};
document.getElementById("nextBtn").onclick=()=>{
  const sec=currentSection();
  if(testState.questionIndex<sec.questions.length-1){testState.questionIndex++;renderQuestion();}
  else submitSection();
};
document.getElementById("submitSectionBtn").onclick=submitSection;

let timerHandle=null;
function startTimer(){
  clearInterval(timerHandle);
  timerHandle=setInterval(()=>{
    testState.remaining--;
    const m=Math.floor(testState.remaining/60), s=testState.remaining%60;
    document.getElementById("timer").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    if(testState.remaining<=0){clearInterval(timerHandle);submitSection(true);}
  },1000);
}

function submitSection(auto=false){
  const next=testState.sectionIndex+1;
  if(next<testState.test.sections.length){
    testState.sectionIndex=next;
    testState.questionIndex=0;
    testState.remaining=(testState.test.sections[next].duration||15)*60;
    testState.sectionStartedAt=Date.now();
    renderQuestion();
  }else{
    finishTest();
  }
}

async function finishTest(){
  clearInterval(timerHandle);
  let correct=0,wrong=0,skipped=0;
  const sectionResults=[];
  for(const sec of testState.test.sections){
    let c=0,w=0,s=0;
    for(const q of sec.questions){
      const a=testState.answers[q.id];
      if(a===undefined){s++;}
      else if(a===q.correctAnswer){c++;}
      else {w++;}
    }
    const score=c*2-w*0.25;
    correct+=c;wrong+=w;skipped+=s;
    sectionResults.push({title:sec.title,correct:c,wrong:w,skipped:s,score});
  }
  const score=correct*2-wrong*0.25;
  const timeTaken=Math.round((Date.now()-testState.startedAt)/1000);
  const {count}=await sb.from("attempts").select("*",{count:"exact",head:true}).eq("user_id",currentUser.id).eq("test_id",testState.test.id);
  const attemptNumber=(count||0)+1;
  const {error}=await sb.from("attempts").insert({
    user_id:currentUser.id,test_id:testState.test.id,test_type:testState.isFull?"full":"subject",
    attempt_number:attemptNumber,score,correct,wrong,skipped,time_taken:timeTaken
  });
  if(error){alert(error.message);return;}
  document.getElementById("resultScore").textContent=`${score.toFixed(2)} / ${testState.test.totalMarks||160}`;
  document.getElementById("resultSummary").textContent=`Correct: ${correct} • Wrong: ${wrong} • Skipped: ${skipped} • ${(score/(testState.test.totalMarks||160)*100).toFixed(2)}%`;
  document.getElementById("resultSections").innerHTML=sectionResults.map(s=>`<div class="card"><b>${s.title}</b><p>${s.correct} correct • ${s.wrong} wrong • ${s.skipped} skipped • Score ${s.score.toFixed(2)}</p></div>`).join("");
  showSection("result");
}
