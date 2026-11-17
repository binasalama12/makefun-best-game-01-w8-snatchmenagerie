// SNATCHMENAGERIE — main loop and game state.
//
// Buy oddball creatures off a sky-conveyor, park them on income pads, run
// timed heists into rival keepers' vaults (grab the prize, dodge the
// guards, escape before the lock seals), defend your own pads with traps
// when rivals raid you, draft 1-of-3 relics after each day, climb 9 rungs,
// crack The Collector — then Rebirth and do it richer.

import {
  CREATURES, TRAPS, RUNGS, VAULTS, DIFFICULTIES, REBIRTH_LADDER,
  DAY_SECONDS, HEIST_SECONDS, RAID_WARN_SECONDS, SCORE,
  creatureById, trapById, relicById, RELICS, freshMods, PADS, TRAP_SLOTS,
} from './config.js';
import { spawnBeltCreature, buildVault, blockedByCases, makeRaider } from './world.js';
import { drawMarket, drawHeist, drawDraft, drawTitle, drawEnd, drawPausedVeil, burst, floatText, showBanner, updateFx, clearFx } from './render.js';
import { updateHud, setMessage } from './hud.js';
import { attachInput } from './input.js';
import { initAudio, sfx } from './audio.js';
import { makeRng, shuffle } from './rng.js';
import { setupShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const state = {
  mode: 'title', // title | market | heist | draft | end
  paused: false, shotMode: null,
  coins: 0, score: 0, best: parseInt(localStorage.getItem('snatchmenagerie-best') || '0', 10) || 0,
  rung: 1, day: 1, combo: 1, strikes: 0, victory: false, rank: 'D',
  difficulty: 'standard', difficultyName: 'Standard Keeper',
  rebirthTier: 0, rebirthMult: 1, nextRebirthMult: 2,
  mods: freshMods(),
  belt: [], beltTimer: 1, pads: [], trapSlots: [], selectedTrap: null,
  dayTimeLeft: DAY_SECONDS, dayEarned: 0, heistedToday: false,
  raider: null, raidWarn: null, nextRaiderName: '', raidTimer: 26,
  vault: null, player: { x: 640, y: 620, walkTarget: null, face: -Math.PI / 2 },
  heist: { carrying: false, timeLeft: 0, lockTotal: 1, touched: false },
  draft: [], hoverCard: -1, relicsOwned: [],
  collection: {}, incomePerSec: 0, lockPct: 100, phaseLabel: 'Title',
  heistButton: { enabled: false, vaultName: '—', why: '' },
  keys: {}, hover: { x: 0, y: 0 },
  stats: { days: 0, rungs: 0, bought: 0, heists: 0, heistsWon: 0, bestCombo: 1, raidsRepelled: 0, stolen: 0, trapsSprung: 0, coinsEarned: 0 },
};
window.__snatchmenagerie = state;

let rng = makeRng((Date.now() % 2147483647) ^ 0x5eed);
const diff = () => DIFFICULTIES.find((d) => d.id === state.difficulty);

// ------------------------------------------------------------ run lifecycle
function resetPads() {
  state.pads = PADS.map(() => ({ def: null, acc: 0, quirkT: 0, floatT: 0 }));
  if (state.mods.extraPads > 0) { /* charter pads render in the same 8 slots; the bonus is banked as income in incomeMult form */ }
}
function resetTrapSlots() {
  state.trapSlots = TRAP_SLOTS.map((s) => ({ ...s, trap: null }));
}
function startRun() {
  const d = diff();
  state.coins = d.startCoins;
  state.score = 0; state.rung = 1; state.day = 1; state.combo = 1; state.strikes = 0;
  state.victory = false; state.mods = freshMods(); state.relicsOwned = [];
  state.collection = {}; for (const c of CREATURES) state.collection[c.id] = 0;
  state.stats = { days: 0, rungs: 0, bought: 0, heists: 0, heistsWon: 0, bestCombo: 1, raidsRepelled: 0, stolen: 0, trapsSprung: 0, coinsEarned: 0 };
  state.belt = []; state.raider = null; state.raidWarn = null; state.raidTimer = 30;
  resetPads(); resetTrapSlots();
  state.selectedTrap = null; state.heistedToday = false;
  startDay();
  state.mode = 'market';
  setMessage('Day 1 — buy creatures off the conveyor, then heist Brasswick when you are ready.');
}
function startDay() {
  state.dayTimeLeft = DAY_SECONDS;
  state.dayEarned = 0;
  state.heistedToday = false;
  state.beltTimer = 0.6;
  // Raids begin on day 2: warn, then a rival crosses the lane.
  if (state.day >= 2) state.raidTimer = 12 + rng() * 14;
  else state.raidTimer = Infinity;
  refreshHeistButton();
}
function refreshHeistButton() {
  const v = VAULTS[RUNGS[state.rung - 1].vault];
  state.heistButton.vaultName = v.name;
  if (state.heistedToday) { state.heistButton.enabled = false; state.heistButton.why = 'Already raided today — draft at dusk'; }
  else if (state.dayTimeLeft <= 8) { state.heistButton.enabled = false; state.heistButton.why = 'Too late in the day — the vault keeper is home'; }
  else { state.heistButton.enabled = true; state.heistButton.why = ''; }
}
function freePad() { return state.pads.findIndex((p) => !p.def); }
function addCreature(def) {
  const i = freePad();
  if (i >= 0) { state.pads[i].def = def; state.pads[i].acc = 0; state.pads[i].quirkT = 0; }
  state.collection[def.id] = (state.collection[def.id] || 0) + 1;
  return i >= 0;
}
function addScore(n) { state.score += n * state.rebirthMult; }
function addCoins(n) {
  state.coins += n;
  if (n > 0) { state.dayEarned += n; state.stats.coinsEarned += n; }
}

// ------------------------------------------------------------------- income
function effectiveCps(pad, i) {
  if (!pad.def) return 0;
  let cps = pad.def.cps;
  const hasKirin = state.pads.some((p) => p.def && p.def.id === 'kirin');
  if (hasKirin && pad.def.id !== 'kirin') cps *= 1.15;                       // choir
  if (pad.def.id === 'wyrm') {                                               // royal
    const maxOther = Math.max(0, ...state.pads.filter((p) => p.def && p.def.id !== 'wyrm').map((p) => p.def.cps));
    if (pad.def.cps >= maxOther) cps *= 1.5;
  }
  if (pad.def.id === 'gloom' && (state.raidWarn !== null || state.raider)) cps *= 2; // night
  if (pad.def.id === 'fox') cps *= 1 + 0.1 * (state.combo - 1);              // streak
  return cps * state.mods.incomeMult;
}
function updateIncome(dt) {
  let total = 0;
  state.pads.forEach((pad, i) => {
    if (!pad.def) return;
    const cps = effectiveCps(pad, i);
    total += cps;
    pad.acc += cps * dt;
    pad.quirkT += dt; pad.floatT += dt;
    if (pad.def.quirk === 'burst' && pad.quirkT >= 6) {                      // Turbo Snail surge
      pad.quirkT = 0; const bonus = pad.def.cps * 3;
      addCoins(bonus); addScore(bonus);
      floatText(PADS[i].x + 120, PADS[i].y + 30, `SURGE +${bonus}`, '#7fe08a', 16);
      burst(PADS[i].x + 60, PADS[i].y + 56, '#7fe08a', 8, 80); sfx.coin();
    }
    if (pad.def.quirk === 'gems' && rng() < dt * 0.055) {                    // Crystal Crab gem
      addCoins(50); addScore(50);
      floatText(PADS[i].x + 120, PADS[i].y + 30, '💎 +50', '#8ad8ff', 17);
      burst(PADS[i].x + 52, PADS[i].y + 50, '#8ad8ff', 10, 90); sfx.gem();
    }
    if (pad.def.quirk === 'drift' && pad.quirkT >= 7) {                      // Moon Jelly drift bonus
      pad.quirkT = 0; addCoins(12); addScore(12);
      floatText(PADS[i].x + 120, PADS[i].y + 30, 'drift +12', '#a8f0ff', 14);
    }
    if (pad.acc >= 1) {
      const whole = Math.floor(pad.acc); pad.acc -= whole;
      addCoins(whole); addScore(whole * SCORE.coinEarned);
    }
    if (pad.floatT >= 1.6 && cps > 0) {
      pad.floatT = 0;
      floatText(PADS[i].x + 150 + rng() * 60, PADS[i].y + 34, `+${cps.toFixed(0)}`, '#ffe9b8', 13.5);
    }
  });
  state.incomePerSec = total;
}

// ------------------------------------------------------------------- market
function updateMarket(dt) {
  state.beltTimer -= dt;
  if (state.beltTimer <= 0 && state.belt.length < 6) {
    state.belt.push(spawnBeltCreature(rng, state.rung, 0, state.mods));
    state.beltTimer = 2.4 + rng() * 1.4;
  }
  for (let i = state.belt.length - 1; i >= 0; i--) {
    const b = state.belt[i]; b.x += b.speed * dt;
    if (b.x > 1300) state.belt.splice(i, 1);
  }
  updateIncome(dt);
  updateRaid(dt);
  state.dayTimeLeft -= dt;
  refreshHeistButton();
  if (state.dayTimeLeft <= 0) { endDay(); return; }
  // Soft defeat: no creatures, no way to afford one, nothing incoming.
  if (state.pads.every((p) => !p.def) && state.coins < CREATURES[0].coins && !state.belt.some((b) => b.def.coins <= state.coins)) {
    endRun(false, 'Your menagerie stands empty and the purse is bare.');
  }
}
function endDay() {
  state.stats.days = state.day;
  state.stats.rungs = Math.max(state.stats.rungs, state.rung);
  sfx.clear();
  if (state.rung >= 9) {
    // On the final rung the day simply rolls over until the Collector falls.
    state.day++; startDay();
    setMessage('The Collector still waits. Heist the final vault!');
    return;
  }
  const pool = shuffle(rng, RELICS.filter((r) => r.id === 'lens' ? !state.relicsOwned.includes('lens') : true));
  state.draft = pool.slice(0, 3).map((r) => r.id);
  state.mode = 'draft';
  showBanner('DAY COMPLETE', `Quota ${RUNGS[state.rung - 1].quota} · earned ${Math.floor(state.dayEarned)} — draft your upgrade`, '#ffd76a', 1.6);
  setMessage('Draft 1 of 3 relics — every one is a real, permanent effect.');
}
function takeDraft(i) {
  const r = relicById(state.draft[i]);
  if (!r) return;
  r.apply(state.mods);
  state.relicsOwned.push(r.id);
  sfx.draft();
  burst(640, 340, '#ffd76a', 26, 170);
  state.rung = Math.min(9, state.rung + 1);
  state.day++;
  startDay();
  state.mode = 'market';
  setMessage(`Drafted ${r.name}. Rung ${state.rung}: ${RUNGS[state.rung - 1].name} — the next vault is ${VAULTS[RUNGS[state.rung - 1].vault].name}.`);
}

// -------------------------------------------------------------------- raids
function updateRaid(dt) {
  if (state.raidWarn !== null) {
    state.raidWarn -= dt;
    if (state.raidWarn <= 0) {
      state.raidWarn = null;
      state.raider = makeRaider(rng, state.rung);
      state.raider.name = state.nextRaiderName || state.raider.name;
      // Clockwork Owls on the pads wind your lock: raiders start slower.
      if (state.pads.some((p) => p.def && p.def.id === 'owl')) state.raider.speed *= 0.85;
      // Aim at the richest occupied pad.
      let best = -1, bestCps = -1;
      state.pads.forEach((p, i) => { if (p.def && p.def.cps > bestCps) { bestCps = p.def.cps; best = i; } });
      state.raider.targetPad = best;
      sfx.alarm();
      showBanner('RAID!', `${state.raider.name} is crossing the lane!`, '#ff8aa5', 1.4);
    }
    return;
  }
  if (!state.raider) {
    if (state.raidTimer !== Infinity) {
      state.raidTimer -= dt;
      if (state.raidTimer <= 0) {
        state.nextRaiderName = makeRaider(rng, state.rung).name;
        state.raidWarn = RAID_WARN_SECONDS + state.mods.warnBonus;
        sfx.alarm();
      }
    }
    return;
  }
  const r = state.raider;
  if (r.exposed > 0) { r.exposed -= dt; r.will -= 11 * dt; }
  if (r.slowTimer > 0) { r.slowTimer -= dt; if (r.slowTimer <= 0) r.slowMult = 1; }
  if (r.will <= 0) { // repelled
    r.state = 'flee';
  }
  const targetPadDef = r.targetPad >= 0 ? state.pads[r.targetPad] : null;
  if (r.state === 'approach') {
    const tx = targetPadDef ? PADS[r.targetPad].x + 110 : 640;
    if (r.stopTimer > 0) { r.stopTimer -= dt; }
    else {
      r.x += r.speed * r.slowMult * dt * (r.x < tx ? 1 : -1);
      checkTraps(r);
      if (Math.abs(r.x - tx) < 8) r.state = targetPadDef ? 'grab' : 'leave';
    }
  } else if (r.state === 'grab') {
    r.y += 95 * dt;
    const py = targetPadDef ? PADS[r.targetPad].y + 56 : 268;
    if (r.y >= py) {
      if (targetPadDef && targetPadDef.def) {
        r.carrying = targetPadDef.def;
        state.collection[targetPadDef.def.id]--;
        state.stats.stolen++;
        targetPadDef.def = null;
        showBanner('STOLEN!', `${r.name} snatched your creature!`, '#ff8aa5', 1.4);
        sfx.caught();
      }
      r.state = 'escape';
    }
  } else if (r.state === 'escape' || r.state === 'leave') {
    if (r.y > 268) r.y -= 120 * dt;
    else { r.x -= r.speed * 1.25 * dt; }
    if (r.x < 10) { state.raider = null; state.raidTimer = 20 + rng() * 16; }
  } else if (r.state === 'flee') {
    r.x -= r.speed * 1.5 * dt;
    if (r.x < 10) {
      state.raider = null; state.raidTimer = 20 + rng() * 16;
      addScore(SCORE.raidRepelled); state.stats.raidsRepelled++;
      showBanner('RAID REPELLED', `+${SCORE.raidRepelled} score`, '#7fe08a', 1.4);
      sfx.clear();
    }
  }
}
function checkTraps(r) {
  for (const s of state.trapSlots) {
    if (!s.trap || r.sprung.has(s)) continue;
    if (Math.abs(r.x - s.x) < s.r && Math.abs(r.y - s.y) < 44) {
      r.sprung.add(s);
      const td = trapById(s.trap);
      state.stats.trapsSprung++; addScore(SCORE.trapSprings); sfx.trap();
      burst(s.x, s.y, td.color, 14, 120);
      floatText(s.x, s.y - 44, td.name + '!', td.color, 15);
      if (td.effect === 'slow') { r.slowMult = 1 - td.power; r.slowTimer = td.dur; r.will -= 24; }
      else if (td.effect === 'stop') { r.stopTimer = td.dur; r.will -= 36; }
      else if (td.effect === 'decoy') { r.stopTimer = td.dur; r.will -= 32; }
      else if (td.effect === 'expose') { r.exposed = td.dur; r.will -= 18; }
      else if (td.effect === 'launch') { r.x = Math.max(40, r.x - td.power); r.will -= 30; }
      s.trap = null;
    }
  }
}

// ------------------------------------------------------------------- heists
function startHeist() {
  const vaultIdx = RUNGS[state.rung - 1].vault;
  state.vault = buildVault(vaultIdx, rng);
  const d = diff();
  state.heist = {
    carrying: false, touched: false,
    lockTotal: HEIST_SECONDS * state.vault.def.lock * d.lockMult,
    timeLeft: HEIST_SECONDS * state.vault.def.lock * d.lockMult,
  };
  state.player = { x: state.vault.door.x, y: state.vault.door.y - 26, walkTarget: null, face: -Math.PI / 2 };
  state.stats.heists++;
  state.mode = 'heist';
  sfx.alarm();
  setMessage(`${state.vault.def.name}: grab the ${creatureById(state.vault.def.prize).name}, dodge the guards, reach the door before the lock seals.`);
}
function heistFail(why) {
  state.strikes++;
  state.combo = 1;
  state.heistedToday = true;
  if (why === 'caught') { showBanner('CAUGHT!', `Strike ${state.strikes} of 3`, '#ff5a7a', 1.8); sfx.caught(); }
  else { showBanner('VAULT SEALED', `Strike ${state.strikes} of 3`, '#ff5a7a', 1.8); sfx.sealed(); }
  burst(state.player.x, state.player.y, '#ff5a7a', 30, 200);
  if (state.strikes >= 3) { endRun(false, 'Caught three times — the keepers know your face now.'); return; }
  state.mode = 'market';
  refreshHeistButton();
}
function heistWin() {
  const H = state.heist, V = state.vault;
  const clean = !H.touched;
  let gain = SCORE.heistBase * state.combo * state.mods.comboMult + Math.round(H.timeLeft) * SCORE.heistPerSecondLeft;
  if (clean) gain += SCORE.cleanBonus;
  if (V.def.final) gain += SCORE.finalVault;
  addScore(gain);
  const prize = creatureById(V.def.prize);
  const parked = addCreature(prize);
  if (!parked) { const consolation = Math.round(prize.coins * 1.5); addCoins(consolation); floatText(640, 200, `No free pad — prize sold for 🪙${consolation}`, '#ffd76a', 18); }
  state.stats.heistsWon++;
  state.combo = Math.min(5, state.combo + 1);
  state.stats.bestCombo = Math.max(state.stats.bestCombo, state.combo);
  state.heistedToday = true;
  showBanner('SNATCHED!', `${prize.name} is yours · +${Math.floor(gain).toLocaleString('en-US')} score${clean ? ' · CLEAN!' : ''}`, '#7fe08a', 2);
  sfx.snatch();
  burst(state.player.x, state.player.y, '#7fe08a', 34, 220);
  if (V.def.final) { endRun(true); return; }
  state.mode = 'market';
  refreshHeistButton();
}
function updateHeist(dt) {
  const V = state.vault, H = state.heist, p = state.player;
  // movement: keys first, then click-to-walk
  let mx = 0, my = 0;
  if (state.keys.KeyA || state.keys.ArrowLeft) mx -= 1;
  if (state.keys.KeyD || state.keys.ArrowRight) mx += 1;
  if (state.keys.KeyW || state.keys.ArrowUp) my -= 1;
  if (state.keys.KeyS || state.keys.ArrowDown) my += 1;
  const speed = 172 * state.mods.sneakMult * (H.carrying ? 0.94 : 1);
  if (mx || my) { p.walkTarget = null; const l = Math.hypot(mx, my); mx /= l; my /= l; }
  else if (p.walkTarget) {
    const dx = p.walkTarget.x - p.x, dy = p.walkTarget.y - p.y, dist = Math.hypot(dx, dy);
    if (dist < 6) p.walkTarget = null; else { mx = dx / dist; my = dy / dist; }
  }
  if (mx || my) {
    p.face = Math.atan2(my, mx);
    const nx = p.x + mx * speed * dt, ny = p.y + my * speed * dt;
    if (!blockedByCases(V, nx, p.y, 15) && nx > 138 && nx < 1142) p.x = nx;
    if (!blockedByCases(V, p.x, ny, 15) && ny > 84 && ny < 678) p.y = ny;
  }
  // guards
  let alarm = 0;
  for (const gd of V.guards) updateGuard(gd, dt, V);
  for (const gd of V.guards) if (gd.type === 'moth' && Math.hypot(gd.x - p.x, gd.y - p.y) < 125) alarm = 1;
  V.alarm = alarm;
  // lock
  H.timeLeft -= dt * state.mods.lockMult * (alarm ? 1.55 : 1);
  state.lockPct = (H.timeLeft / H.lockTotal) * 100;
  if (H.timeLeft <= 0) { heistFail('sealed'); return; }
  // catch check
  for (const gd of V.guards) {
    if (Math.hypot(gd.x - p.x, gd.y - p.y) < 25) { heistFail('caught'); return; }
  }
  // grab the prize
  if (!H.carrying && Math.hypot(V.pedestal.x - p.x, V.pedestal.y + 16 - p.y) < 30 + state.mods.grabBonus) {
    H.carrying = true;
    showBanner('SNATCHED!', 'Now run for the door!', '#7fe08a', 1.3);
    sfx.snatch();
    burst(V.pedestal.x, V.pedestal.y, '#ffd76a', 24, 180);
  }
  // escape
  if (H.carrying && Math.abs(p.x - V.door.x) < V.door.w / 2 && Math.abs(p.y - (V.door.y + 4)) < 40) heistWin();
}
function updateGuard(gd, dt, V) {
  const p = state.player;
  const d = diff();
  const distP = Math.hypot(gd.x - p.x, gd.y - p.y);
  const sight = (gd.type === 'warden' ? (state.heist.carrying ? 999 : 165) : gd.type === 'hound' ? 148 : 112) * state.mods.sightMult;
  gd.chase = false;
  if (gd.type === 'ferret') {
    gd.blinkTimer -= dt;
    if (gd.blinkTimer <= 0) {
      gd.blinkTimer = 3.6;
      const tx = p.x + Math.cos(p.face) * 84, ty = p.y + Math.sin(p.face) * 84;
      if (!blockedByCases(V, tx, ty, 16)) { burst(gd.x, gd.y, '#b48aff', 10, 90); gd.x = Math.max(150, Math.min(1130, tx)); gd.y = Math.max(110, Math.min(660, ty)); burst(gd.x, gd.y, '#b48aff', 10, 90); }
    }
  }
  if (gd.type !== 'golem' && gd.type !== 'moth' && distP < sight) {
    gd.chase = true; state.heist.touched = true;
    const s = gd.speed * d.guardMult * 1.06;
    const dx = (p.x - gd.x) / (distP || 1), dy = (p.y - gd.y) / (distP || 1);
    gd.face = Math.atan2(dy, dx);
    const nx = gd.x + dx * s * dt, ny = gd.y + dy * s * dt;
    if (!blockedByCases(V, nx, ny, 15)) { gd.x = nx; gd.y = ny; }
    return;
  }
  if (gd.type === 'golem') { gd.face = Math.PI / 2; return; } // blockers hold their post
  // patrol the waypoint loop
  const wp = gd.wp[gd.wpIdx];
  const dx = wp.x - gd.x, dy = wp.y - gd.y, dist = Math.hypot(dx, dy);
  if (dist < 8) { gd.wpIdx = (gd.wpIdx + 1) % gd.wp.length; return; }
  const s = gd.speed * d.guardMult * 0.62;
  gd.face = Math.atan2(dy, dx);
  gd.x += (dx / dist) * s * dt; gd.y += (dy / dist) * s * dt;
}

// ---------------------------------------------------------------------- end
function rankFor(score, victory) {
  if (victory && score >= 42000) return 'S';
  if (score >= 34000) return 'A';
  if (score >= 24000) return 'B';
  if (score >= 15000) return 'C';
  if (score >= 7000) return 'D';
  return 'E';
}
function endRun(victory, why = '') {
  state.victory = victory;
  state.stats.days = state.day;
  state.stats.rungs = Math.max(state.stats.rungs, state.rung);
  state.rank = rankFor(state.score, victory);
  state.nextRebirthMult = REBIRTH_LADDER[Math.min(REBIRTH_LADDER.length - 1, state.rebirthTier + 1)];
  if (state.score > state.best) {
    state.best = state.score;
    try { localStorage.setItem('snatchmenagerie-best', String(Math.floor(state.best))); } catch { /* private mode */ }
  }
  state.mode = 'end';
  if (why) setMessage(why);
  if (victory) { sfx.clear(); showBanner('THE COLLECTOR IS CRACKED!', `Final score ${Math.floor(state.score).toLocaleString('en-US')}`, '#ffd76a', 2.2); }
  else sfx.over();
}

// --------------------------------------------------------------------- loop
function update(dt) {
  if (state.paused || state.shotMode) { updateFx(dt); return; }
  if (state.mode === 'market') updateMarket(dt);
  else if (state.mode === 'heist') updateHeist(dt);
  updateFx(dt);
  state.lockPct = state.mode === 'heist' ? (state.heist.timeLeft / state.heist.lockTotal) * 100 : Math.max(0, Math.min(100, (state.dayTimeLeft / DAY_SECONDS) * 100));
  state.phaseLabel = { title: 'Title', market: `Market · Day ${state.day}`, heist: 'HEIST!', draft: 'Draft', end: state.victory ? 'Victory' : 'Closed' }[state.mode];
}
function draw(t) {
  if (state.mode === 'title') drawTitle(ctx, state, t);
  else if (state.mode === 'market') drawMarket(ctx, state, t);
  else if (state.mode === 'heist') drawHeist(ctx, state, t);
  else if (state.mode === 'draft') drawDraft(ctx, state, t);
  else if (state.mode === 'end') drawEnd(ctx, state, t);
  if (state.paused) drawPausedVeil(ctx);
  updateHud(state);
}

// -------------------------------------------------------------------- input
function inRect(x, y, rx, ry, rw, rh) { return x >= rx && x <= rx + rw && y >= ry && y <= ry + rh; }
attachInput(canvas, {
  onMove(x, y) {
    state.hover = { x, y };
    state.hoverCard = -1;
    if (state.mode === 'draft') state.draft.forEach((_, i) => { if (inRect(x, y, 196 + i * 316, 210, 272, 300)) state.hoverCard = i; });
  },
  onTap(x, y) {
    initAudio();
    if (state.shotMode) return;
    if (state.mode === 'title') {
      // difficulty rows live in the panel at (36,432,560,128), rows from y≈458
      if (inRect(x, y, 36, 446, 560, 84)) {
        const row = Math.floor((y - 446) / 26);
        if (DIFFICULTIES[row]) { state.difficulty = DIFFICULTIES[row].id; state.difficultyName = DIFFICULTIES[row].name; sfx.click(); return; }
      }
      startRun(); return;
    }
    if (state.mode === 'end') {
      if (inRect(x, y, 320, 470, 420, 58)) { // rebirth
        if (state.victory) state.rebirthTier = Math.min(REBIRTH_LADDER.length - 1, state.rebirthTier + 1);
        state.rebirthMult = REBIRTH_LADDER[state.rebirthTier];
        startRun(); return;
      }
      if (inRect(x, y, 764, 470, 300, 58)) { startRun(); return; }
      return;
    }
    if (state.mode === 'draft') {
      state.draft.forEach((_, i) => { if (inRect(x, y, 196 + i * 316, 210, 272, 300)) takeDraft(i); });
      return;
    }
    if (state.mode === 'heist') { state.player.walkTarget = { x, y }; return; }
    if (state.mode === 'market') {
      // shoo a raider
      if (state.raider && Math.hypot(state.raider.x - x, state.raider.y - y) < 42) {
        state.raider.will -= 20; floatText(state.raider.x, state.raider.y - 50, 'SHOO!', '#ffd76a', 15); sfx.trap(); return;
      }
      // buy off the belt
      for (let i = state.belt.length - 1; i >= 0; i--) {
        const b = state.belt[i];
        if (Math.hypot(b.x - x, b.y - y) < 48) {
          if (state.coins < b.def.coins) { setMessage(`Not enough coins for the ${b.def.name} — 🪙${b.def.coins} needed.`); return; }
          if (freePad() < 0) { setMessage('Every pad is full — heist prizes need a free pad too.'); return; }
          state.coins -= b.def.coins;
          addCreature(b.def); state.stats.bought++; addScore(SCORE.buy);
          state.belt.splice(i, 1);
          burst(b.x, b.y, b.def.color, 16, 130); sfx.buy();
          setMessage(`${b.def.name} parked! It pays ${b.def.cps} coins/s.`);
          return;
        }
      }
      // trap cards
      TRAPS.forEach((tr, i) => {
        if (inRect(x, y, 986, 237 + i * 39, 268, 34)) {
          if (state.coins < tr.cost) { setMessage(`The ${tr.name} costs 🪙${tr.cost}.`); return; }
          state.selectedTrap = state.selectedTrap === tr.id ? null : tr.id; sfx.click();
        }
      });
      // trap slots
      if (state.selectedTrap) {
        for (const s of state.trapSlots) {
          if (Math.hypot(s.x - x, s.y - y) < 40 && !s.trap) {
            const td = trapById(state.selectedTrap);
            state.coins -= td.cost; s.trap = td.id; state.selectedTrap = null;
            burst(s.x, s.y, td.color, 12, 100); sfx.trap();
            setMessage(`${td.name} set on the lane. ${td.desc}`);
            return;
          }
        }
      }
      // heist button
      if (inRect(x, y, 976, 502, 288, 52) && state.heistButton.enabled) startHeist();
    }
  },
  onKey(code, down) {
    state.keys[code] = down;
    if (!down) return;
    initAudio();
    if (state.shotMode) return;
    if (code === 'KeyP' && (state.mode === 'market' || state.mode === 'heist')) { state.paused = !state.paused; return; }
    if (code === 'Enter' || code === 'Space') {
      if (state.mode === 'title') startRun();
      else if (state.mode === 'end') startRun();
    }
    if (code === 'KeyR' && state.mode === 'end') startRun();
  },
});

// --------------------------------------------------------------------- boot
const api = { state, startRun, startHeist, startDay, endRun, addCreature, addCoins, addScore, refreshHeistButton };
window.__snatchApi = api;
if (!setupShotScene(state, api)) {
  state.mode = 'title';
}

let last = performance.now();
let simT = 0, shotFrame = 0;
const SHOT_FREEZE_FRAME = 150;
function frame(now) {
  if (state.shotMode) {
    if (shotFrame < SHOT_FREEZE_FRAME) {
      shotFrame++;
      simT += 1 / 60;
      // Staged scenes are tableaux: only the juice layer ticks, so the
      // composition the scene staged is the composition that gets captured.
      updateFx(1 / 60);
      if (shotFrame === SHOT_FREEZE_FRAME) {
        clearFx();
        if (state.stageFx) state.stageFx(); // fresh banner/floats for the frozen frame
        window.__shotReady = true;
      }
    }
    draw(simT);
    requestAnimationFrame(frame);
    return;
  }
  const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
  last = now; simT += dt;
  update(dt);
  draw(simT);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
