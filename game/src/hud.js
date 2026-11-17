// SNATCHMENAGERIE — DOM HUD strip (the bar across the top of the stage) and
// the hint line under it. The canvas draws the rich in-world panels; this
// strip is the always-readable summary: rung, coins, income, score, combo
// chain, vault lock and phase.

const el = (id) => document.getElementById(id);

export function updateHud(state) {
  const rung = el('h-rung'), coins = el('h-coins'), income = el('h-income');
  const score = el('h-score'), combo = el('h-combo'), phase = el('h-phase');
  const lockbar = el('h-lockbar');
  if (!rung) return;
  rung.textContent = state.rung ? `${state.rung}/9` : '–';
  coins.textContent = String(Math.floor(state.coins));
  income.textContent = `${state.incomePerSec.toFixed(1)}/s`;
  score.textContent = String(Math.floor(state.score)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  combo.textContent = `×${state.combo}`;
  phase.textContent = state.phaseLabel || '–';
  if (lockbar) {
    const pct = Math.max(0, Math.min(100, state.lockPct));
    lockbar.style.width = pct + '%';
  }
}

let msgTimer = null;
export function setMessage(text) {
  const msg = el('msg');
  if (!msg) return;
  msg.textContent = text;
  if (msgTimer) clearTimeout(msgTimer);
  if (text) msgTimer = setTimeout(() => { msg.textContent = ''; }, 6000);
}
