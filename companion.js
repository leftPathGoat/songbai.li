import { mountSquirrelMascot } from "/mascot/squirrelMascot.js?v=sleep2";

const KEY = "songbai.mascot.v1";
const btn = document.getElementById("companion-toggle");

function readEnabled() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return true;
    return JSON.parse(raw).enabled !== false;
  } catch {
    return true;
  }
}

function writeEnabled(on) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ enabled: on }));
  } catch {
    /* private mode / quota */
  }
}

function syncButton(on) {
  if (!btn) return;
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  btn.textContent = on ? "Squirrel" : "Squirrel off";
}

let on = readEnabled();
writeEnabled(on);
const pet = mountSquirrelMascot({ size: 96, enabled: on });
syncButton(on);

if (btn) {
  btn.addEventListener("click", () => {
    on = !on;
    pet.setEnabled(on);
    writeEnabled(on);
    syncButton(on);
  });
}
