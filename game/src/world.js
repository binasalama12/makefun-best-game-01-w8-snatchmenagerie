// SNATCHMENAGERIE — world building: what rides the sky-conveyor, how each
// rival vault is laid out (pedestal, door, guard patrols), and who comes to
// raid your pads between rounds. Pure data + geometry; the sim lives in
// main.js and the art in render.js.

import { CREATURES, VAULTS, GUARDS, BELT } from './config.js';
import { pick } from './rng.js';

// Weighted creature draw for the conveyor. Common lines dominate early;
// luck (Lucky Clover) and higher rungs tilt the ladder toward the rare end.
export function drawCreature(rng, rung, luck) {
  const weights = CREATURES.map((c, i) => {
    const base = Math.max(1, 26 - i * 3.4);
    const rungBoost = i >= 4 ? 1 + (rung - 1) * 0.16 : 1;
    const luckBoost = 1 + luck * i * 0.55;
    return base * rungBoost * luckBoost;
  });
  let total = 0;
  for (const w of weights) total += w;
  let roll = rng() * total;
  for (let i = 0; i < CREATURES.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return CREATURES[i];
  }
  return CREATURES[0];
}

// A creature riding the belt: it enters at the left edge and drifts right at
// a steady pace; if it leaves the right edge unbought, it is gone.
export function spawnBeltCreature(rng, rung, luck, mods) {
  const def = drawCreature(rng, rung, (mods ? mods.luck : 0) + luck);
  return {
    def, x: BELT.x - 46, y: BELT.y + BELT.h / 2 + (rng() - 0.5) * 26,
    speed: 34 + rng() * 16, bob: rng() * Math.PI * 2, bought: false,
  };
}

// ------------------------------------------------------------------- vaults
// Vault floor plan (inside the field): the door is bottom-centre, the prize
// pedestal is at the far end, and waist-high display cases make the lanes.
// Layouts are fixed per vault so a keeper's vault is learnable.
const CASE_SETS = [
  [[330, 210, 150, 26], [800, 210, 150, 26], [565, 360, 170, 26]],
  [[250, 250, 26, 170], [1004, 250, 26, 170], [490, 420, 300, 26]],
  [[330, 200, 150, 26], [800, 200, 150, 26], [330, 430, 150, 26], [800, 430, 150, 26]],
  [[565, 180, 170, 26], [250, 360, 240, 26], [790, 360, 240, 26]],
  [[200, 300, 200, 26], [880, 300, 200, 26], [440, 180, 400, 26], [565, 470, 170, 26]],
  [[330, 210, 150, 26], [800, 430, 150, 26], [800, 210, 150, 26], [330, 430, 150, 26], [565, 320, 170, 26]],
  [[250, 250, 26, 200], [1004, 250, 26, 200], [420, 180, 440, 26], [420, 500, 440, 26]],
  [[300, 200, 180, 26], [800, 200, 180, 26], [300, 450, 180, 26], [800, 450, 180, 26], [565, 325, 170, 26]],
];

export function buildVault(vaultIdx, rng) {
  const def = VAULTS[vaultIdx];
  const cases = (CASE_SETS[vaultIdx] || CASE_SETS[0]).map(([x, y, w, h]) => ({ x, y, w, h }));
  const pedestal = { x: 640, y: 118, r: 30 };
  const door = { x: 640, y: 664, w: 120, h: 26 };
  const guards = def.guards.map((type, i) => {
    const g = GUARDS[type];
    // Patrol loops: rectangles at varied depths of the vault floor.
    const depth = 190 + (i % 3) * 130 + rng() * 30;
    const left = 190 + (i % 2) * 120;
    const right = 1090 - (i % 2) * 120;
    return {
      type, name: g.name, speed: g.speed, color: g.color,
      x: left + rng() * (right - left), y: depth,
      wp: [
        { x: left, y: depth }, { x: right, y: depth },
        { x: right, y: depth + 92 }, { x: left, y: depth + 92 },
      ],
      wpIdx: 1, dir: 1, chase: false, blinkTimer: 2.4 + rng() * 2,
      stuck: 0, phase: rng() * Math.PI * 2,
    };
  });
  return { def, cases, pedestal, door, guards, alarm: 0 };
}

// Point-vs-cases collision with a radius; returns true when blocked.
export function blockedByCases(vault, x, y, r) {
  for (const c of vault.cases) {
    if (x > c.x - r && x < c.x + c.w + r && y > c.y - r && y < c.y + c.h + r) return true;
  }
  return false;
}

// -------------------------------------------------------------------- raids
// A raider from a rival keeper: it enters at the left gate, walks the
// defence lane to above your richest pad, drops down, grabs, and runs back.
// will = how much trap punishment it tolerates before turning tail.
export function makeRaider(rng, rung) {
  const names = ['Pip the Pilferer', 'Madame Snatch', 'The Velvet Hand', 'Brother Grab', 'Countess Quick', 'The Night Intern'];
  return {
    name: pick(rng, names),
    x: 30, y: 268, speed: 62 + rung * 4 + rng() * 14,
    will: 100, state: 'approach', targetPad: -1, carrying: null,
    slowTimer: 0, slowMult: 1, stopTimer: 0, exposed: 0, sprung: new Set(),
  };
}
