const HERO_ARCHETYPES = [
  {
    type: "Tank",
    color: "#70a4ff",
    skills: ["Titan Guard", "Shockwave Slam", "Unbreakable"],
    statSpread: { power: 8, tech: 2, mystic: 1, stealth: 3 },
  },
  {
    type: "Blaster",
    color: "#ff9a5f",
    skills: ["Photon Barrage", "Plasma Beam", "Aerial Burst"],
    statSpread: { power: 7, tech: 4, mystic: 2, stealth: 2 },
  },
  {
    type: "Mystic",
    color: "#c68cff",
    skills: ["Arcane Ward", "Time Snare", "Astral Surge"],
    statSpread: { power: 3, tech: 1, mystic: 9, stealth: 3 },
  },
  {
    type: "Shadow",
    color: "#86d8d2",
    skills: ["Silent Step", "Critical Ambush", "Holo Decoy"],
    statSpread: { power: 4, tech: 5, mystic: 2, stealth: 8 },
  },
  {
    type: "Gadgeteer",
    color: "#f8d66d",
    skills: ["Drone Swarm", "EMP Net", "Rapid Fabrication"],
    statSpread: { power: 3, tech: 9, mystic: 1, stealth: 4 },
  },
];

const ACTIVITIES = {
  Patrol: { income: 120, xp: 12, risk: 0.09, reputation: 1 },
  Training: { income: -40, xp: 24, risk: 0.01, reputation: 0 },
  PR: { income: 90, xp: 8, risk: 0.02, reputation: 2 },
  Research: { income: -20, xp: 16, risk: 0.03, reputation: 1 },
};

const MISSION_TYPES = [
  { label: "Criminal Syndicate", tag: "criminals", reward: 450, danger: 12, focus: "stealth" },
  { label: "Mutant Monster Rampage", tag: "monsters", reward: 620, danger: 16, focus: "power" },
  { label: "Supervillain Plot", tag: "supervillains", reward: 800, danger: 20, focus: "tech" },
  { label: "Occult Breach", tag: "supervillains", reward: 720, danger: 18, focus: "mystic" },
];

const namesA = ["Nova", "Iron", "Echo", "Astra", "Volt", "Crimson", "Silver", "Night", "Alpha", "Quantum"];
const namesB = ["Sentinel", "Phantom", "Viper", "Beacon", "Guardian", "Ranger", "Pulse", "Monarch", "Cipher", "Knight"];

const state = {
  day: 1,
  cash: 3000,
  reputation: 12,
  threat: 15,
  heroes: [],
  candidates: [],
  missions: [],
  activeOps: [],
  log: [],
};

const $ = (id) => document.getElementById(id);
const rng = (n) => Math.floor(Math.random() * n);

function iconLetter(type) {
  return type.charAt(0).toUpperCase();
}

function buildPortrait(type, color) {
  const letter = iconLetter(type);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>
    <defs>
      <linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stop-color='${color}'/>
        <stop offset='100%' stop-color='#132443'/>
      </linearGradient>
    </defs>
    <rect width='96' height='96' rx='14' fill='url(#g)'/>
    <circle cx='48' cy='36' r='17' fill='rgba(255,255,255,0.18)'/>
    <path d='M16 85c7-20 20-29 32-29s24 9 32 29' fill='rgba(255,255,255,0.15)'/>
    <text x='48' y='54' text-anchor='middle' font-size='27' font-family='Segoe UI, Arial, sans-serif' font-weight='700' fill='#ffffff'>${letter}</text>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function makeHero(level = 1) {
  const archetype = HERO_ARCHETYPES[rng(HERO_ARCHETYPES.length)];
  const quality = 0.8 + Math.random() * 0.6;
  const base = {
    id: crypto.randomUUID(),
    name: `${namesA[rng(namesA.length)]} ${namesB[rng(namesB.length)]}`,
    type: archetype.type,
    color: archetype.color,
    portrait: buildPortrait(archetype.type, archetype.color),
    skills: [...archetype.skills],
    level,
    xp: 0,
    wage: Math.floor((120 + level * 25) * quality),
    hiringCost: Math.floor((700 + level * 120) * quality),
    status: "Available",
    activity: "Patrol",
  };

  for (const [key, val] of Object.entries(archetype.statSpread)) {
    base[key] = Math.floor((val + level) * quality + rng(3));
  }

  return base;
}

function makeMission() {
  const type = MISSION_TYPES[rng(MISSION_TYPES.length)];
  const pressure = Math.floor(state.day / 3 + state.threat / 8);
  return {
    id: crypto.randomUUID(),
    title: type.label,
    tag: type.tag,
    danger: type.danger + rng(6) + pressure,
    reward: type.reward + rng(220) + pressure * 15,
    focus: type.focus,
    daysLeft: 2 + rng(3),
  };
}

function logEvent(text) {
  state.log.unshift(`Day ${state.day}: ${text}`);
  state.log = state.log.slice(0, 18);
}

function seed() {
  state.candidates = Array.from({ length: 4 }, () => makeHero(1 + rng(3)));
  state.missions = Array.from({ length: 3 }, () => makeMission());
  state.heroes.push(makeHero(2), makeHero(1));
  logEvent("Agency founded. Your first heroes are on standby.");
}

function heroPower(hero, focus) {
  return hero.power * 1.3 + hero.tech + hero.mystic + hero.stealth + hero[focus] * 1.2 + hero.level * 2;
}

function updateEconomy() {
  let daily = 0;
  let repGain = 0;

  for (const hero of state.heroes) {
    daily -= hero.wage;
    if (hero.status === "Available") {
      const act = ACTIVITIES[hero.activity];
      if (act) {
        daily += act.income;
        hero.xp += act.xp;
        repGain += act.reputation;
        if (Math.random() < act.risk) {
          state.threat += 1;
          logEvent(`${hero.name} hit trouble while on ${hero.activity.toLowerCase()}. Threat increased.`);
        }
      }
    }
    levelUp(hero);
  }

  state.cash += daily;
  state.reputation += repGain;
}

function levelUp(hero) {
  const threshold = 90 + hero.level * 35;
  if (hero.xp >= threshold) {
    hero.xp -= threshold;
    hero.level += 1;
    hero.power += 1 + rng(2);
    hero.tech += 1 + rng(2);
    hero.mystic += 1 + rng(2);
    hero.stealth += 1 + rng(2);
    hero.wage += 28;
    logEvent(`${hero.name} leveled up to ${hero.level}!`);
  }
}

function resolveOperations() {
  const finished = [];
  for (const op of state.activeOps) {
    op.daysLeft -= 1;
    if (op.daysLeft <= 0) finished.push(op);
  }

  for (const op of finished) {
    const score = op.heroes.reduce((total, h) => total + heroPower(h, op.focus), 0);
    const successThreshold = op.danger * 8;
    const success = score >= successThreshold || Math.random() < 0.18;

    op.heroes.forEach((h) => {
      h.status = "Available";
      h.xp += success ? 70 : 35;
      levelUp(h);
    });

    if (success) {
      state.cash += op.reward;
      state.reputation += 4;
      state.threat = Math.max(0, state.threat - 2);
      logEvent(`SUCCESS: ${op.title} handled by ${op.heroes.map((h) => h.name).join(", ")}. +$${op.reward}`);
    } else {
      state.cash -= Math.floor(op.reward * 0.35);
      state.reputation = Math.max(0, state.reputation - 3);
      state.threat += 4;
      logEvent(`FAILURE: ${op.title} overwhelmed your team. City confidence dropped.`);
    }

    state.activeOps = state.activeOps.filter((x) => x.id !== op.id);
  }
}

function dailyTick() {
  state.day += 1;
  state.threat += Math.max(0, 1 + Math.floor(state.day / 7) - Math.floor(state.reputation / 45));

  updateEconomy();
  resolveOperations();

  if (state.day % 2 === 0 && state.candidates.length < 6) {
    state.candidates.push(makeHero(1 + rng(4)));
  }

  if (state.day % 2 === 1 && state.missions.length < 5) {
    state.missions.push(makeMission());
  }

  if (state.cash < 0) {
    state.reputation = Math.max(0, state.reputation - 2);
    logEvent("You are in debt. Sponsors are getting nervous.");
  }

  render();
}

function hireHero(id) {
  const hero = state.candidates.find((h) => h.id === id);
  if (!hero || state.cash < hero.hiringCost) return;
  state.cash -= hero.hiringCost;
  hero.status = "Available";
  state.heroes.push(hero);
  state.candidates = state.candidates.filter((h) => h.id !== id);
  logEvent(`Hired ${hero.name} (${hero.type}) for $${hero.hiringCost}.`);
  render();
}

function setActivity(heroId, activity) {
  const hero = state.heroes.find((h) => h.id === heroId);
  if (!hero || hero.status !== "Available") return;
  hero.activity = activity;
  render();
}

function dispatchMission(missionId) {
  const mission = state.missions.find((m) => m.id === missionId);
  if (!mission) return;
  const chosen = Array.from(document.querySelectorAll(`input[name='m-${missionId}']:checked`))
    .map((box) => box.value)
    .map((id) => state.heroes.find((h) => h.id === id))
    .filter(Boolean);

  if (!chosen.length || chosen.length > 3) {
    alert("Select 1 to 3 available heroes.");
    return;
  }

  chosen.forEach((h) => (h.status = "On Mission"));
  state.activeOps.push({ ...mission, heroes: chosen });
  state.missions = state.missions.filter((m) => m.id !== missionId);
  logEvent(`Dispatched team to ${mission.title}.`);
  render();
}

function renderStats() {
  $("statsPanel").innerHTML = [
    ["Day", state.day],
    ["Cash", `$${state.cash.toLocaleString()}`],
    ["Reputation", state.reputation],
    ["Threat", state.threat],
    ["Heroes", state.heroes.length],
    ["Active Ops", state.activeOps.length],
  ]
    .map(([label, value]) => `<div class='stat'><small>${label}</small><div class='value'>${value}</div></div>`)
    .join("");
}

function renderCandidates() {
  const wrap = $("candidateList");
  if (!state.candidates.length) {
    wrap.innerHTML = "<small>No applicants today.</small>";
    return;
  }

  wrap.innerHTML = state.candidates
    .map(
      (h) => `<div class='card'>
      <div class='card-top'>
        <div class='portrait' style='background-image:${h.portrait}'></div>
        <div>
          <div class='row'><strong>${h.name}</strong><small>${h.type} • Lv ${h.level}</small></div>
          <small>Power ${h.power} | Tech ${h.tech} | Mystic ${h.mystic} | Stealth ${h.stealth}</small>
        </div>
      </div>
      <div class='skills'>${h.skills.join(" • ")}</div>
      <div class='row'><small>Hire: $${h.hiringCost} | Wage: $${h.wage}/day</small>
      <button ${state.cash < h.hiringCost ? "disabled" : ""} onclick="hireHero('${h.id}')">Hire</button></div>
    </div>`
    )
    .join("");
}

function renderHeroes() {
  const wrap = $("heroList");
  if (!state.heroes.length) {
    wrap.innerHTML = "<small>No heroes recruited.</small>";
    return;
  }

  wrap.innerHTML = state.heroes
    .map((h) => {
      const options = Object.keys(ACTIVITIES)
        .map((a) => `<option ${h.activity === a ? "selected" : ""} value='${a}'>${a}</option>`)
        .join("");
      return `<div class='card'>
      <div class='card-top'>
        <div class='portrait' style='background-image:${h.portrait}'></div>
        <div>
          <div class='row'><strong>${h.name}</strong><small>${h.type} • Lv ${h.level}</small></div>
          <small>Status: <span class='${h.status === "On Mission" ? "warn" : ""}'>${h.status}</span> | XP ${h.xp}</small>
        </div>
      </div>
      <small>PWR ${h.power} | TEC ${h.tech} | MYS ${h.mystic} | STL ${h.stealth}</small>
      <div class='skills'>${h.skills.join(" • ")}</div>
      <div class='row'><small>Wage: $${h.wage}/day</small>
      <select onchange="setActivity('${h.id}', this.value)" ${h.status !== "Available" ? "disabled" : ""}>${options}</select></div>
      </div>`;
    })
    .join("");
}

function renderMissions() {
  const wrap = $("missionList");
  if (!state.missions.length) {
    wrap.innerHTML = "<small>No urgent incidents right now.</small>";
    return;
  }

  const available = state.heroes.filter((h) => h.status === "Available");

  wrap.innerHTML = state.missions
    .map((m) => {
      const boxes = available.length
        ? available
            .map(
              (h) => `<label><input type='checkbox' name='m-${m.id}' value='${h.id}'/> ${h.name} (${h.type})</label>`
            )
            .join("<br>")
        : "<small>No heroes available.</small>";

      const pct = Math.min(100, Math.floor((m.danger / 34) * 100));

      return `<div class='card'>
        <div class='row'><strong>${m.title}</strong><small>Threat ${m.danger}</small></div>
        <div class='threat-meter'><div class='threat-fill' style='width:${pct}%'></div></div>
        <small>Target: ${m.tag} • Focus: ${m.focus.toUpperCase()} • Duration: ${m.daysLeft} days</small>
        <small>Reward: $${m.reward}</small>
        <details><summary>Assign Team</summary>${boxes}</details>
        <button onclick="dispatchMission('${m.id}')" ${available.length ? "" : "disabled"}>Launch Mission</button>
      </div>`;
    })
    .join("");
}

function renderOps() {
  const wrap = $("activeOps");
  if (!state.activeOps.length) {
    wrap.innerHTML = "<small>No active operations. Keep the city safe.</small>";
    return;
  }

  wrap.innerHTML = state.activeOps
    .map(
      (o) => `<div class='card'>
      <strong>${o.title}</strong>
      <small>ETA: ${o.daysLeft} day(s) | Reward: $${o.reward}</small>
      <small>Team: ${o.heroes.map((h) => h.name).join(", ")}</small>
    </div>`
    )
    .join("");
}

function renderLog() {
  $("logList").innerHTML = state.log.map((line) => `<li>${line}</li>`).join("");
}

function drawCityMonitor() {
  const canvas = $("cityCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#091327");
  sky.addColorStop(1, "#1a2742");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 75; i += 1) {
    ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.55})`;
    ctx.fillRect(rng(width), rng(80), 2, 2);
  }

  const skyline = [80, 110, 60, 130, 95, 145, 90, 125, 75, 140, 100, 115, 70, 120, 85, 108];
  skyline.forEach((b, i) => {
    const x = i * 74;
    ctx.fillStyle = "#15243e";
    ctx.fillRect(x, height - b, 64, b);
    for (let w = 0; w < 16; w += 1) {
      if (Math.random() > 0.68) {
        ctx.fillStyle = "rgba(255, 220, 122, 0.75)";
        ctx.fillRect(x + 8 + (w % 4) * 12, height - b + 10 + Math.floor(w / 4) * 16, 6, 8);
      }
    }
  });

  const threatRadius = Math.min(70, 12 + state.threat * 1.1);
  ctx.strokeStyle = "rgba(255,124,124,0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(width - 90, 62, threatRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffd27c";
  ctx.font = "bold 16px Segoe UI";
  ctx.fillText(`Threat Level: ${state.threat}`, width - 190, 26);
  ctx.fillStyle = "#9ed6ff";
  ctx.fillText(`Reputation: ${state.reputation}`, width - 190, 48);
}

function render() {
  renderStats();
  renderCandidates();
  renderHeroes();
  renderMissions();
  renderOps();
  renderLog();
  drawCityMonitor();
}

window.hireHero = hireHero;
window.dispatchMission = dispatchMission;
window.setActivity = setActivity;

seed();
render();
setInterval(dailyTick, 6500);
