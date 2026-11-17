// Deterministic screenshot scenes for SNATCHMENAGERIE, driven by the URL:
//   ?shot=climax&seed=7  the final-vault heist vs The Collector, mid-escape
//   ?shot=draft&seed=7   the upgrade draft (meta) screen after day 4
//   ?shot=title&seed=7   the dense title: how-to, bestiary, difficulties
//   ?shot=end&seed=7     the victory end screen: rank, stats, collection
// Each scene writes a coherent mid-run state directly (the same fields the
// live game maintains), then the main loop freezes the frame and raises
// window.__shotReady. Without a ?shot param this module does nothing.

import { buildVault } from './world.js';
import { makeRng } from './rng.js';
import { showBanner, floatText, burst } from './render.js';
import { CREATURES } from './config.js';

function baseRun(state) {
  state.difficulty = 'standard';
  state.difficultyName = 'Standard Keeper';
  state.rebirthTier = 0; state.rebirthMult = 1; state.nextRebirthMult = 2;
  state.collection = {};
  for (const c of CREATURES) state.collection[c.id] = 0;
  state.mods = { grabBonus: 14, sneakMult: 1.12, incomeMult: 1.15, lockMult: 0.85, luck: 0.18, warnBonus: 3, sightMult: 0.9, comboMult: 1.25, showCones: true, extraPads: 0 };
  state.relicsOwned = ['gloves', 'boots', 'magnet', 'jammer', 'lens', 'leash'];
}

export function setupShotScene(state, api) {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) return false;
  const seed = parseInt(params.get('seed') || '7', 10) || 7;
  state.shotMode = shot;
  baseRun(state);

  if (shot === 'climax') {
    const rng = makeRng(seed * 31 + 7);
    state.mode = 'heist';
    state.rung = 9; state.day = 9;
    state.coins = 6840; state.score = 38640; state.combo = 4;
    state.incomePerSec = 214.5;
    state.phaseLabel = 'HEIST!';
    state.collection = { snail: 3, crab: 2, gloom: 2, fox: 2, jelly: 1, owl: 1, wyrm: 1, kirin: 0 };
    state.vault = buildVault(7, rng);
    state.vault.alarm = 1;
    state.player = { x: 706, y: 448, walkTarget: null, face: 1.85 };
    state.heist = { carrying: true, touched: true, lockTotal: 45.9, timeLeft: 11.2 };
    state.lockPct = (11.2 / 45.9) * 100;
    const G = state.vault.guards;
    // Roster order for The Collector: warden, ferret, golem, moth, hound, warden.
    if (G[0]) { G[0].x = 852; G[0].y = 386; G[0].chase = true; G[0].face = 2.62; }
    if (G[1]) { G[1].x = 566; G[1].y = 566; G[1].face = -0.4; }
    if (G[3]) { G[3].x = 800; G[3].y = 540; G[3].face = 2.4; }
    if (G[4]) { G[4].x = 420; G[4].y = 300; G[4].chase = true; G[4].face = 0.7; }
    if (G[5]) { G[5].x = 1052; G[5].y = 196; G[5].face = 2.8; }
    state.stageFx = () => {
      showBanner('SNATCHED!', 'The Starlight Kirin is grabbed — RUN for the door!', '#7fe08a', 99);
      floatText(706, 396, '+2,400', '#ffd76a', 21);
      floatText(852, 348, 'WARDEN — ON YOU!', '#ff8aa5', 15);
      floatText(640, 128, 'PRIZE TAKEN', '#7fe08a', 16);
      burst(706, 448, '#fff3a8', 16, 150);
      burst(640, 130, '#ffd76a', 12, 120);
    };
  } else if (shot === 'draft') {
    state.mode = 'draft';
    state.rung = 4; state.day = 4;
    state.coins = 2130; state.score = 12480; state.combo = 3;
    state.incomePerSec = 96;
    state.dayEarned = 1875; state.dayTimeLeft = 0;
    state.phaseLabel = 'Draft';
    state.draft = ['magnet', 'cloak', 'charter'];
    state.relicsOwned = ['gloves', 'boots', 'jammer'];
    state.hoverCard = 1;
    state.stageFx = () => { burst(640, 356, '#ffd76a', 18, 140); };
  } else if (shot === 'title') {
    state.mode = 'title';
    state.best = 38640;
    state.phaseLabel = 'Title';
    state.stageFx = null;
  } else if (shot === 'end') {
    state.mode = 'end';
    state.victory = true;
    state.rung = 9; state.day = 9;
    state.score = 48720; state.best = 48720; state.rank = 'S';
    state.combo = 5; state.coins = 3120;
    state.phaseLabel = 'Victory';
    state.collection = { snail: 4, crab: 3, gloom: 3, fox: 2, jelly: 2, owl: 2, wyrm: 1, kirin: 1 };
    state.stats = { days: 9, rungs: 9, bought: 14, heists: 8, heistsWon: 7, bestCombo: 5, raidsRepelled: 5, stolen: 2, trapsSprung: 11, coinsEarned: 31240 };
    state.stageFx = () => {
      burst(300, 300, '#ffd76a', 20, 170);
      burst(980, 260, '#ff8ad8', 16, 150);
      floatText(640, 470, '48,720', '#ffd76a', 22);
    };
  } else {
    return false;
  }

  const msg = document.getElementById('msg');
  if (msg && (shot === 'title' || shot === 'end' || shot === 'draft')) msg.textContent = '';
  if (msg && shot === 'climax') msg.textContent = 'The Collector’s Vault — escape with the Kirin before the lock seals!';
  return true;
}
