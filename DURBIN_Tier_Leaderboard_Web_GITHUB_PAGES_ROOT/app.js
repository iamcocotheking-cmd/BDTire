import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const leaderboardEl = document.getElementById("leaderboard");
const statusText = document.getElementById("statusText");
const searchInput = document.getElementById("searchInput");
const modeSelect = document.getElementById("modeSelect");
const refreshBtn = document.getElementById("refreshBtn");

const tierRank = {
  HT1: 1, LT1: 2,
  HT2: 3, LT2: 4,
  HT3: 5, LT3: 6,
  HT4: 7, LT4: 8,
  HT5: 9, LT5: 10,
  UNRANKED: 99
};

let allPlayers = [];

function cleanTier(value) {
  const tier = String(value || "UNRANKED").trim().toUpperCase();
  return tier || "UNRANKED";
}

function getModeTier(player, mode) {
  const aliases = {
    tier: ["tier", "overall", "overallTier"],
    sword: ["sword", "swordTier"],
    axe: ["axe", "axeTier"],
    tank: ["tank", "tankTier"],
    crystal: ["crystal", "cristel", "crystalTier", "cristelTier"],
    netpot: ["netpot", "netPot", "netpotTier", "netPotTier", "netheritePotTier"],
    uhc: ["uhc", "uhcTier"],
    smp: ["smp", "smpTier"],
    pot: ["pot", "potTier"]
  };
  for (const key of aliases[mode] || [mode]) {
    if (player[key]) return cleanTier(player[key]);
  }
  return mode === "tier" ? cleanTier(player.tier) : "UNRANKED";
}

function sortPlayers(players, mode) {
  return [...players].sort((a, b) => {
    const ta = getModeTier(a, mode);
    const tb = getModeTier(b, mode);
    return (tierRank[ta] || 99) - (tierRank[tb] || 99) || (a.displayName || a.email || "").localeCompare(b.displayName || b.email || "");
  });
}

function tierClass(tier) {
  if (tier.startsWith("HT")) return "tier ht";
  if (tier.startsWith("LT")) return "tier lt";
  return "tier unranked";
}

function modeMini(player, mode, label) {
  const tier = getModeTier(player, mode);
  if (tier === "UNRANKED") return "";
  return `<span class="mini"><b>${label}</b> ${tier}</span>`;
}

function playerCard(player, index, mode) {
  const name = player.displayName || player.name || player.email || "Unknown Player";
  const email = player.email || "";
  const tier = getModeTier(player, mode);
  const avatarName = encodeURIComponent(name.split(" ")[0] || "Steve");

  return `
    <article class="player card">
      <div class="rank">#${index + 1}</div>
      <img class="avatar" src="https://mc-heads.net/avatar/${avatarName}/96" alt="${name}" onerror="this.src='https://mc-heads.net/avatar/Steve/96'" />
      <div class="info">
        <h3>${escapeHtml(name)}</h3>
        <p>${escapeHtml(email)}</p>
        <div class="modes">
          ${modeMini(player, "sword", "Sword")}
          ${modeMini(player, "axe", "Axe")}
          ${modeMini(player, "tank", "Tank")}
          ${modeMini(player, "crystal", "Crystal")}
          ${modeMini(player, "netpot", "NetPot")}
        </div>
      </div>
      <span class="${tierClass(tier)}">${escapeHtml(tier)}</span>
    </article>
  `;
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render() {
  const mode = modeSelect.value;
  const search = searchInput.value.trim().toLowerCase();
  const filtered = allPlayers.filter((p) => {
    const text = `${p.displayName || ""} ${p.name || ""} ${p.email || ""}`.toLowerCase();
    return text.includes(search);
  });

  const sorted = sortPlayers(filtered, mode);
  statusText.textContent = `${sorted.length} players shown • Mode: ${modeSelect.options[modeSelect.selectedIndex].text}`;

  if (!sorted.length) {
    leaderboardEl.innerHTML = `<div class="empty card">No players found. Add documents inside <b>tier_assignments</b> in Firestore.</div>`;
    return;
  }

  leaderboardEl.innerHTML = sorted.map((p, i) => playerCard(p, i, mode)).join("");
}

async function loadPlayers() {
  statusText.textContent = "Loading Firebase data...";
  leaderboardEl.innerHTML = "";

  try {
    const q = query(collection(db, "tier_assignments"), where("visible", "==", true));
    const snap = await getDocs(q);
    allPlayers = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // If no visible=true docs, load all docs so you can still test quickly.
    if (!allPlayers.length) {
      const allSnap = await getDocs(collection(db, "tier_assignments"));
      allPlayers = allSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    render();
  } catch (error) {
    console.error(error);
    statusText.textContent = "Could not load Firebase. Check Firestore rules and firebase-config.js.";
    leaderboardEl.innerHTML = `<div class="empty card">Error: ${escapeHtml(error.message)}</div>`;
  }
}

searchInput.addEventListener("input", render);
modeSelect.addEventListener("change", render);
refreshBtn.addEventListener("click", loadPlayers);

loadPlayers();
