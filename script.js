const auth = { level: 1 };

const logs = [
  { date:"2024-08-13", level:2, restricted:true, title:"港湾部異常", summary:"記録封鎖" },
  { date:"2023-11-02", level:1, restricted:false, title:"沿岸調査", summary:"異常なし" }
];

const logContainer = document.getElementById("logContainer");
const glitchLayer = document.getElementById("glitchLayer");
const alertOverlay = document.getElementById("alertOverlay");
const finalNotice = document.getElementById("finalNotice");
const accessLogBox = document.getElementById("accessLog");

/* ===== 状態復元 ===== */
let violationCount = Number(localStorage.getItem("sea_violation")) || 0;
let observed = localStorage.getItem("sea_observed") === "true";
let degraded = localStorage.getItem("sea_degraded") === "true";
let finalized = localStorage.getItem("sea_finalized") === "true";

/* ===== 再訪問 ===== */
const isReturnVisitor = observed === true;

/* ===== 最終段階確定 ===== */
if(violationCount >= 9){
  finalized = true;
  localStorage.setItem("sea_finalized","true");
}

/* ===== 初期反映 ===== */
(function restore(){
  if(observed) document.body.classList.add("observed");
  if(degraded) document.body.classList.add("degraded");
  if(finalized){
    document.body.classList.add("finalized");
    finalNotice.classList.remove("hidden");
  }
})();

/* ===== 演出 ===== */
function triggerGlitch(ms=300){
  if(finalized) return;
  glitchLayer.classList.remove("hidden");
  setTimeout(()=>glitchLayer.classList.add("hidden"),ms);
}

/* ===== 可視ログ ===== */
function logAccess(msg){
  if(finalized) return;
  const t = new Date().toLocaleTimeString();
  const d = document.createElement("div");
  d.textContent = `[${t}] ${msg}`;
  accessLogBox.prepend(d);
}

/* ===== 不可視記録 ===== */
function silentRecord(){
  const n = Number(localStorage.getItem("sea_silent")) || 0;
  localStorage.setItem("sea_silent", n + 1);
}

/* ===== 観測 ===== */
function fixObserved(){
  if(observed) return;
  observed = true;
  localStorage.setItem("sea_observed","true");
  document.body.classList.add("observed");
}

/* ===== 違反 ===== */
function violation(){
  violationCount++;
  localStorage.setItem("sea_violation", violationCount);
  fixObserved();

  if(!isReturnVisitor){
    triggerGlitch(400);
    alertOverlay.classList.remove("hidden");
    setTimeout(()=>alertOverlay.classList.add("hidden"),1200);
  }

  if(violationCount >= 5 && !degraded){
    degraded = true;
    localStorage.setItem("sea_degraded","true");
    document.body.classList.add("degraded");
  }

  if(violationCount >= 9){
    finalized = true;
    localStorage.setItem("sea_finalized","true");
    document.body.classList.add("finalized");
    finalNotice.classList.remove("hidden");
  }

  silentRecord();
}

/* ===== ログ描画 ===== */
function renderLog(log){
  if(finalized){
    silentRecord();
    return;
  }

  if(log.restricted && auth.level < log.level){
    violation();
    return;
  }

  fixObserved();

  if(!isReturnVisitor) triggerGlitch(150);

  const div = document.createElement("div");
  div.className = "log-card";
  div.innerHTML = `
    <strong>${log.date} / Lv.${log.level}</strong>
    <p>${log.title}</p>
    <p>${log.summary}</p>
  `;
  logContainer.appendChild(div);

  logAccess(`LOG ${log.date}`);
}

logs.forEach(renderLog);

/* ===== 放置・操作検知 ===== */
let idleTimer;
function resetIdle(){
  clearTimeout(idleTimer);
  document.body.classList.remove("idle");

  idleTimer = setTimeout(()=>{
    if(observed && !finalized){
      document.body.classList.add("idle");
      logAccess(isReturnVisitor ? "IDLE (RETURN)" : "IDLE");
    }
  },15000);
}

["mousemove","keydown","click","scroll"].forEach(e=>{
  window.addEventListener(e, ()=>{
    if(finalized){
      silentRecord();
    }else{
      resetIdle();
    }
  });
});

resetIdle();
