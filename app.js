const API_URL = "https://api.warframestat.us/pc/fissures";

let allFissures = [];

const tierOrder = ["Lith", "Meso", "Neo", "Axi", "Requiem", "Omnia"];

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function getTierIcon(tier) {
  return `images/${tier.toLowerCase()}.png`;
}

function getSpIcon(isHard) {
  return isHard ? "images/sp.png" : "images/nonsp.png";
}

function getFactionIcon(enemy) {
  if (!enemy) return "";

  const e = enemy.toLowerCase();

  if (e.includes("grineer")) return "images/grineer.png";
  if (e.includes("corpus")) return "images/corpus.png";
  if (e.includes("infested")) return "images/infested.png";
  if (e.includes("crossfire")) return "images/cf.png";
  if (e.includes("murmur")) return "images/murmur.png";
  if (e.includes("orokin") || e.includes("void") || e.includes("corruption")) {
    return "images/orokin.png";
  }

  return "";
}

// API quirk fix
function normalizeMissionType(type) {
  if (!type) return "";
  if (type.toLowerCase() === "corruption") return "Void Flood";
  return type;
}


function createMissionRow(f, listContainer, card) {
  const row = document.createElement("div");
  row.className = "mission";

  const spIcon = document.createElement("img");
  spIcon.className = "sp-icon";
  spIcon.src = getSpIcon(f.isHard);

  const factionIcon = document.createElement("img");
  factionIcon.className = "faction-icon";
  factionIcon.src = getFactionIcon(f.enemy);

  const text = document.createElement("span");
  text.className = "mission-text";
  text.textContent = `${normalizeMissionType(f.missionType)} - ${f.node}`;

  const timer = document.createElement("span");
  timer.className = "timer";

  row.appendChild(spIcon);
  row.appendChild(factionIcon);
  row.appendChild(text);
  row.appendChild(timer);
  listContainer.appendChild(row);

  const interval = setInterval(() => {
    const diff = new Date(f.expiry) - Date.now();

    if (diff <= 0) {
      clearInterval(interval);
      row.remove();

      if (!listContainer.children.length) {
        card.remove();
      }
    } else {
      timer.textContent = formatTime(diff);
    }
  }, 1000);
}

function createCard(tier, fissures) {
  const card = document.createElement("div");
  card.className = "card";

  const inner = document.createElement("div");
  inner.className = "card-inner";

  const icon = document.createElement("img");
  icon.className = "big-icon";
  icon.src = getTierIcon(tier);

  const missionList = document.createElement("div");
  missionList.className = "mission-list";

  fissures
    .sort((a, b) => new Date(a.expiry) - new Date(b.expiry))
    .forEach(f => createMissionRow(f, missionList, card));

  inner.appendChild(icon);
  inner.appendChild(missionList);
  card.appendChild(inner);

  return card;
}

function renderFissures(filter) {
  const root = document.getElementById("fissureList");
  root.innerHTML = "";

  tierOrder.forEach(tier => {
    const tierFissures = allFissures.filter(f => f.tier === tier);
    if (!tierFissures.length) return;

    const normal = tierFissures.filter(f => f.isHard !== true);
    const hard = tierFissures.filter(f => f.isHard === true);

    const group = document.createElement("div");
    group.className = "group";

    if ((filter === "all" || filter === "normal") && normal.length) {
      group.appendChild(createCard(tier, normal));
    }

    if ((filter === "all" || filter === "hard") && hard.length) {
      group.appendChild(createCard(tier, hard));
    }

    if (group.children.length) {
      root.appendChild(group);
    }
  });
}

function refreshFissures() {
  fetch(API_URL)
    .then(r => r.json())
    .then(data => {
      allFissures = data
        .filter(f => new Date(f.expiry).getTime() > Date.now())
        .filter(f => !f.isStorm); //removes void storms

      if (document.getElementById("hardBtn").classList.contains("active")) {
        renderFissures("hard");
      } else if (document.getElementById("normalBtn").classList.contains("active")) {
        renderFissures("normal");
      } else {
        renderFissures("all");
      }
    })
    .catch(console.error);
}

function setActive(id) {
  document.querySelectorAll(".toggle button").forEach(b =>
    b.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  allBtn.onclick = () => {
    setActive("allBtn");
    renderFissures("all");
  };

  normalBtn.onclick = () => {
    setActive("normalBtn");
    renderFissures("normal");
  };

  hardBtn.onclick = () => {
    setActive("hardBtn");
    renderFissures("hard");
  };

  refreshFissures();                   
  setInterval(refreshFissures, 40000); 
});
