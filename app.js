const API_URL = "https://api.warframestat.us/pc/fissures";
const tierOrder = ["Lith", "Meso", "Neo", "Axi", "Requiem", "Omnia"];

let fissureMap = new Map();
let currentFilter = "all";

/* ---------- helpers ---------- */

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`;
}

function tierIcon(tier) {
  return `images/${tier.toLowerCase()}.png`;
}

function spIcon(isHard) {
  return isHard ? "images/sp.png" : "images/nonSp.png";
}

function factionIcon(enemy) {
  if (!enemy) return "images/orokin.png";
  const e = enemy.toLowerCase();
  if (e.includes("grineer")) return "images/grineer.png";
  if (e.includes("corpus")) return "images/corpus.png";
  if (e.includes("infested")) return "images/infested.png";
  if (e.includes("crossfire")) return "images/cf.png";
  if (e.includes("murmur")) return "images/murmur.png";
  return "images/orokin.png";
}

function normalizeMission(type) {
  return type?.toLowerCase() === "corruption" ? "Void Flood" : type;
}

/* ---------- layout ---------- */

function getTierGroup(tier) {
  let el = document.getElementById(`tier-${tier}`);
  if (el) return el;

  el = document.createElement("div");
  el.className = "tier-group";
  el.id = `tier-${tier}`;
  document.getElementById("fissureList").appendChild(el);
  return el;
}

function getCard(tier, isHard) {
  const group = getTierGroup(tier);
  const id = `${tier}-${isHard ? "sp" : "normal"}`;

  let card = document.getElementById(id);
  if (card) return card.querySelector(".mission-list");

  card = document.createElement("div");
  card.className = "card";
  card.id = id;

  card.innerHTML = `
    <div class="card-inner">
      <img class="big-icon" src="${tierIcon(tier)}">
      <div class="mission-list"></div>
    </div>
  `;

  group.appendChild(card);
  return card.querySelector(".mission-list");
}

/* ---------- missions ---------- */

function addMission(f) {
  if (fissureMap.has(f.id)) return;

  if (currentFilter === "normal" && f.isHard) return;
  if (currentFilter === "hard" && !f.isHard) return;

  const list = getCard(f.tier, f.isHard);

  const row = document.createElement("div");
  row.className = "mission";

  row.innerHTML = `
    <img class="sp-icon" src="${spIcon(f.isHard)}">
    <img class="faction-icon" src="${factionIcon(f.enemy)}">
    <span class="mission-text">${normalizeMission(f.missionType)} - ${f.node}</span>
    <span class="timer"></span>
  `;

  const timerEl = row.querySelector(".timer");

  const interval = setInterval(() => {
    const diff = new Date(f.expiry) - Date.now();
    if (diff <= 0) removeMission(f.id);
    else timerEl.textContent = formatTime(diff);
  }, 1000);

  list.appendChild(row);
  fissureMap.set(f.id, { row, interval });
}

function removeMission(id) {
  const entry = fissureMap.get(id);
  if (!entry) return;
  clearInterval(entry.interval);
  entry.row.remove();
  fissureMap.delete(id);
}

/* ---------- refresh ---------- */

function refresh() {
  fetch(API_URL)
    .then(r => r.json())
    .then(data => {
      const active = data
        .filter(f => !f.isStorm)
        .filter(f => new Date(f.expiry) > Date.now());

      const ids = new Set(active.map(f => f.id));
      [...fissureMap.keys()].forEach(id => {
        if (!ids.has(id)) removeMission(id);
      });

      tierOrder.forEach(tier => {
        active.filter(f => f.tier === tier).forEach(addMission);
      });
    });
}

/* ---------- controls ---------- */

function setFilter(btn, filter) {
  currentFilter = filter;
  document.querySelectorAll(".toggle button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  document.getElementById("fissureList").innerHTML = "";
  fissureMap.forEach(v => clearInterval(v.interval));
  fissureMap.clear();

  refresh();
}

allBtn.onclick = () => setFilter(allBtn, "all");
normalBtn.onclick = () => setFilter(normalBtn, "normal");
hardBtn.onclick = () => setFilter(hardBtn, "hard");

refresh();
setInterval(refresh, 40000);
