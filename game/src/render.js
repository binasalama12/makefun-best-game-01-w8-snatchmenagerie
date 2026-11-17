// SNATCHMENAGERIE — all canvas art: the lantern-lit night market (textured
// procedural background, never a plain grid), the sky-conveyor, the eight
// creature lines drawn as little vector beasts, the income pads, the defence
// lane, the vault floors with their guards, and the title / draft / end
// screens. Plus the juice: particles, floating numbers and event banners.

import { FIELD, BELT, PADS, TRAP_SLOTS, CREATURES, TRAPS, GUARDS, RUNGS, DIFFICULTIES, REBIRTH_LADDER, creatureById, trapById, relicById } from './config.js';

// ------------------------------------------------------------- juice system
const particles = [];
const floats = [];
let banner = null; // { text, sub, color, timer, total }

export function burst(x, y, color, n = 12, speed = 120) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.3 + Math.random() * 0.9);
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: 0.7 + Math.random() * 0.5, t: 0, color, r: 2 + Math.random() * 3 });
  }
}
export function floatText(x, y, text, color = '#ffe9b8', size = 17) {
  floats.push({ x, y, text, color, size, t: 0, life: 1.25 });
}
export function showBanner(text, sub = '', color = '#ffd76a', dur = 1.7) {
  banner = { text, sub, color, timer: dur, total: dur };
}
export function clearFx() { particles.length = 0; floats.length = 0; banner = null; }
export function updateFx(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.t += dt;
    if (p.t >= p.life) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 130 * dt;
  }
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i]; f.t += dt; f.y -= 34 * dt;
    if (f.t >= f.life) floats.splice(i, 1);
  }
  if (banner) { banner.timer -= dt; if (banner.timer <= 0) banner = null; }
}
function drawFx(ctx) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of floats) {
    ctx.globalAlpha = Math.max(0, 1 - f.t / f.life);
    ctx.font = `bold ${f.size}px Georgia`;
    ctx.textAlign = 'center';
    ctx.fillStyle = f.color;
    ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = 3;
    ctx.strokeText(f.text, f.x, f.y); ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  if (banner) {
    const a = Math.min(1, banner.timer / 0.35, (banner.total - banner.timer) / 0.18 + 0.2);
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    ctx.textAlign = 'center';
    ctx.font = 'bold 54px Georgia';
    ctx.fillStyle = banner.color;
    ctx.strokeStyle = 'rgba(10,4,24,.8)'; ctx.lineWidth = 8;
    ctx.strokeText(banner.text, 640, 300); ctx.fillText(banner.text, 640, 300);
    if (banner.sub) {
      ctx.font = 'bold 21px Georgia';
      ctx.fillStyle = '#fff3d6';
      ctx.strokeText(banner.sub, 640, 334); ctx.fillText(banner.sub, 640, 334);
    }
    ctx.globalAlpha = 1;
  }
}

// -------------------------------------------------------------- backgrounds
// Textured night-market backdrop: layered silhouettes, hanging lanterns,
// stall awnings and drifting fireflies — drawn from seeded positions so it
// is identical in every render of a scene.
const STARS = [];
for (let i = 0; i < 90; i++) STARS.push({ x: (i * 173) % 1280, y: 56 + ((i * 97) % 300), r: 0.8 + (i % 3) * 0.5, tw: i * 0.7 });
const LANTERNS = [];
for (let i = 0; i < 11; i++) LANTERNS.push({ x: 70 + i * 116, y: 66 + (i % 3) * 9, c: ['#ffb35a', '#ff8ad8', '#8ad8ff', '#ffd76a'][i % 4] });

export function drawBackground(ctx, t, dark = 0) {
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, '#160b31'); g.addColorStop(0.55, '#1d0f3d'); g.addColorStop(1, '#0d0619');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1280, 720);
  // moon
  ctx.fillStyle = '#f7ead0';
  ctx.beginPath(); ctx.arc(1170, 108, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(247,234,208,.16)';
  ctx.beginPath(); ctx.arc(1170, 108, 58, 0, Math.PI * 2); ctx.fill();
  for (const s of STARS) {
    ctx.globalAlpha = 0.35 + 0.3 * Math.sin(t * 1.4 + s.tw);
    ctx.fillStyle = '#ffeec9';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // rooftops silhouette
  ctx.fillStyle = '#0a0518';
  ctx.beginPath(); ctx.moveTo(0, 470);
  const roofs = [0, 120, 260, 420, 560, 720, 880, 1030, 1180, 1280];
  for (let i = 0; i < roofs.length - 1; i++) {
    const x0 = roofs[i], x1 = roofs[i + 1], peak = 408 + ((i * 53) % 44);
    ctx.lineTo(x0, 470 - ((i * 37) % 30)); ctx.lineTo((x0 + x1) / 2, peak); ctx.lineTo(x1, 470 - ((i * 29) % 26));
  }
  ctx.lineTo(1280, 720); ctx.lineTo(0, 720); ctx.closePath(); ctx.fill();
  // hanging lanterns on a wire
  ctx.strokeStyle = 'rgba(255,220,160,.35)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, 58);
  for (let x = 0; x <= 1280; x += 80) ctx.lineTo(x, 58 + Math.sin(x * 0.01) * 7);
  ctx.stroke();
  for (const L of LANTERNS) {
    const sway = Math.sin(t * 1.1 + L.x) * 2.5;
    ctx.fillStyle = L.c; ctx.globalAlpha = 0.92;
    ctx.beginPath(); ctx.ellipse(L.x + sway, L.y + 14, 8, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.2; ctx.beginPath(); ctx.ellipse(L.x + sway, L.y + 14, 17, 21, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (dark > 0) { ctx.fillStyle = `rgba(4,2,10,${dark})`; ctx.fillRect(0, 0, 1280, 720); }
}

// --------------------------------------------------------------- creatures
// Each of the 8 lines gets its own little vector silhouette in its colours.
export function drawCreature(ctx, def, x, y, s = 1, t = 0) {
  const bob = Math.sin(t * 2.4 + x * 0.05) * 2.2;
  ctx.save(); ctx.translate(x, y + bob); ctx.scale(s, s);
  ctx.shadowColor = def.color; ctx.shadowBlur = 13;
  const C = def.color, A = def.accent;
  ctx.fillStyle = C; ctx.strokeStyle = A; ctx.lineWidth = 2.4;
  const eye = (ex, ey) => { ctx.fillStyle = '#14102a'; ctx.beginPath(); ctx.arc(ex, ey, 2.6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = C; };
  switch (def.id) {
    case 'snail': {
      ctx.beginPath(); ctx.ellipse(4, 8, 21, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = A; ctx.beginPath(); ctx.arc(-6, -2, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = C; ctx.beginPath(); ctx.arc(-6, -2, 8.5, 0.4, 4.6); ctx.stroke();
      ctx.strokeStyle = A; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(26, -13); ctx.moveTo(14, -2); ctx.lineTo(16, -14); ctx.stroke();
      eye(24, -11); eye(15, -12); break;
    }
    case 'crab': {
      ctx.beginPath(); ctx.ellipse(0, 2, 19, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (const sgn of [-1, 1]) {
        ctx.beginPath(); ctx.arc(sgn * 26, -8, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sgn * 26, -8); ctx.lineTo(sgn * 33, -17); ctx.stroke();
        for (let l = 0; l < 3; l++) { ctx.beginPath(); ctx.moveTo(sgn * (8 + l * 6), 12); ctx.lineTo(sgn * (13 + l * 7), 20); ctx.stroke(); }
      }
      ctx.fillStyle = '#dff4ff';
      for (const [px, py] of [[-9, -14], [0, -19], [9, -14]]) { ctx.beginPath(); ctx.moveTo(px - 4, py + 7); ctx.lineTo(px, py); ctx.lineTo(px + 4, py + 7); ctx.closePath(); ctx.fill(); }
      eye(-6, -1); eye(6, -1); break;
    }
    case 'gloom': {
      for (const sgn of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(sgn * 4, -2);
        ctx.quadraticCurveTo(sgn * 26, -18 - Math.sin(t * 6) * 4, sgn * 30, 2);
        ctx.quadraticCurveTo(sgn * 18, -3, sgn * 10, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(0, 2, 11, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sgn * 5, -10); ctx.lineTo(sgn * 8, -19); ctx.lineTo(sgn * 11, -9); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#ffe95a'; ctx.beginPath(); ctx.arc(-4, 0, 2.6, 0, Math.PI * 2); ctx.arc(4, 0, 2.6, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'fox': {
      ctx.beginPath(); ctx.moveTo(14, 6); ctx.quadraticCurveTo(34, -4, 30, 16); ctx.quadraticCurveTo(20, 22, 12, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-2, 4, 16, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sgn * 7 - 8, -8); ctx.lineTo(sgn * 10 - 8, -20); ctx.lineTo(sgn * 13 - 8, -7); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#fff3d6'; ctx.beginPath(); ctx.ellipse(6, 9, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
      eye(2, 0); break;
    }
    case 'jelly': {
      ctx.beginPath(); ctx.arc(0, 0, 17, Math.PI, 0); ctx.quadraticCurveTo(10, 8, 0, 7); ctx.quadraticCurveTo(-10, 8, -17, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = C; ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 6, 7); ctx.quadraticCurveTo(i * 6 + Math.sin(t * 3 + i) * 3, 14, i * 6, 21); ctx.stroke(); }
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.75; ctx.beginPath(); ctx.arc(-5, -6, 3.4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      eye(-5, -1); eye(5, -1); break;
    }
    case 'owl': {
      ctx.beginPath(); ctx.ellipse(0, 2, 15, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sgn * 10, -12); ctx.lineTo(sgn * 14, -21); ctx.lineTo(sgn * 5, -15); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = A; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 3, 9, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, 1); ctx.moveTo(0, 3); ctx.lineTo(6, 3); ctx.stroke();
      ctx.fillStyle = '#14102a'; ctx.beginPath(); ctx.arc(-5.5, -4, 3, 0, Math.PI * 2); ctx.arc(5.5, -4, 3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'wyrm': {
      for (let i = 4; i >= 0; i--) {
        ctx.beginPath(); ctx.arc(-18 + i * 10, 6 - Math.sin(t * 3 + i * 0.9) * 4 - i * 2.4, 10.5 - i * 0.7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(22 + sgn * 3, -12); ctx.quadraticCurveTo(28 + sgn * 5, -22, 32 + sgn * 4, -14); ctx.stroke(); }
      eye(24, -6); break;
    }
    case 'kirin': {
      ctx.beginPath(); ctx.ellipse(-4, 6, 19, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.quadraticCurveTo(18, -12, 24, -13); ctx.lineTo(27, -5); ctx.quadraticCurveTo(19, -2, 15, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(23, -13); ctx.lineTo(27, -25); ctx.stroke();
      ctx.strokeStyle = A; ctx.lineWidth = 2.2;
      for (const lx of [-14, -4, 6]) { ctx.beginPath(); ctx.moveTo(lx, 14); ctx.lineTo(lx, 23); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-22, 2); ctx.quadraticCurveTo(-32, -6 - Math.sin(t * 4) * 3, -28, -14); ctx.stroke();
      eye(21, -8); break;
    }
    default: { ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); eye(-5, -2); eye(5, -2); }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ panels
export function panel(ctx, x, y, w, h, title, accent = '#8a6fd0') {
  ctx.fillStyle = 'rgba(16,9,36,.88)';
  ctx.strokeStyle = accent; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.stroke();
  if (title) {
    ctx.fillStyle = '#c9a8ff'; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'left';
    ctx.fillText(title.toUpperCase(), x + 12, y + 19);
  }
}
function bar(ctx, x, y, w, h, pct, c1, c2) {
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, Math.max(h, w * Math.max(0, Math.min(1, pct))), h, h / 2); ctx.fill();
}

// ------------------------------------------------------------- market scene
export function drawMarket(ctx, state, t) {
  drawBackground(ctx, t);
  // ground plaza
  const g = ctx.createLinearGradient(0, 470, 0, 720);
  g.addColorStop(0, '#241243'); g.addColorStop(1, '#170b2e');
  ctx.fillStyle = g; ctx.fillRect(0, 470, 1280, 250);
  ctx.strokeStyle = 'rgba(200,160,255,.10)';
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(0, 486 + i * 28); ctx.lineTo(1280, 486 + i * 28); ctx.stroke(); }

  // --- sky-conveyor
  ctx.fillStyle = 'rgba(30,17,64,.92)';
  ctx.strokeStyle = '#6a4fb0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(BELT.x - 14, BELT.y - 30, BELT.w + 28, BELT.h + 40, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe9b8'; ctx.font = 'bold 15px Georgia'; ctx.textAlign = 'left';
  ctx.fillText('SKY-CONVEYOR — click a creature to buy it', BELT.x, BELT.y - 8);
  ctx.strokeStyle = '#ffb35a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(BELT.x, BELT.y + BELT.h - 12); ctx.lineTo(BELT.x + BELT.w, BELT.y + BELT.h - 12); ctx.stroke();
  ctx.fillStyle = '#ffb35a';
  for (let i = 0; i < 24; i++) { const rx = BELT.x + ((i * 52 + t * 40) % BELT.w); ctx.beginPath(); ctx.arc(rx, BELT.y + BELT.h - 12, 3.4, 0, Math.PI * 2); ctx.fill(); }
  for (const b of state.belt) {
    drawCreature(ctx, b.def, b.x, b.y, 1.05, t + b.bob);
    ctx.fillStyle = 'rgba(10,5,26,.85)'; ctx.beginPath(); ctx.roundRect(b.x - 40, b.y + 30, 80, 21, 6); ctx.fill();
    ctx.fillStyle = b.def.color; ctx.font = 'bold 11.5px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(b.def.name, b.x, b.y + 40);
    ctx.fillStyle = state.coins >= b.def.coins ? '#ffd76a' : '#ff8a8a'; ctx.font = 'bold 12px Georgia';
    ctx.fillText(`🪙 ${b.def.coins} · ${b.def.cps}/s`, b.x, b.y + 63);
  }

  // --- defence lane
  ctx.fillStyle = 'rgba(90,50,140,.20)'; ctx.fillRect(FIELD.x, 238, FIELD.w, 62);
  ctx.fillStyle = '#c9a8ff'; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'left';
  ctx.fillText('DEFENCE LANE — raiders cross here. Pick a trap card (right), then click a glowing slot.', FIELD.x + 4, 254);
  for (const s of state.trapSlots) {
    ctx.strokeStyle = state.selectedTrap ? '#ffd76a' : 'rgba(200,170,255,.4)';
    ctx.lineWidth = state.selectedTrap ? 2.6 : 1.4;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.stroke();
    if (s.trap) {
      const td = trapById(s.trap);
      ctx.fillStyle = td.color; ctx.beginPath(); ctx.arc(s.x, s.y, 17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1c1038'; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center';
      ctx.fillText(td.name.split(' ')[0], s.x, s.y + 3);
    } else {
      ctx.fillStyle = 'rgba(230,215,255,.5)'; ctx.font = '11px Georgia'; ctx.textAlign = 'center';
      ctx.fillText('slot', s.x, s.y + 4);
    }
  }
  if (state.raider) drawRaider(ctx, state, t);

  // --- income pads
  state.pads.forEach((pad, i) => {
    const P = PADS[i];
    if (!P) return;
    ctx.fillStyle = pad.def ? 'rgba(46,26,92,.95)' : 'rgba(22,13,48,.9)';
    ctx.strokeStyle = pad.def ? pad.def.color : 'rgba(150,120,220,.35)'; ctx.lineWidth = pad.def ? 2 : 1.3;
    ctx.beginPath(); ctx.roundRect(P.x, P.y, P.w, P.h, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,233,184,.55)'; ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'left';
    ctx.fillText(`PAD ${i + 1}`, P.x + 10, P.y + 17);
    if (pad.def) {
      drawCreature(ctx, pad.def, P.x + 52, P.y + 62, 1.25, t + i);
      ctx.fillStyle = '#fff3d6'; ctx.font = 'bold 14.5px Georgia';
      ctx.fillText(pad.def.name, P.x + 96, P.y + 44);
      ctx.fillStyle = pad.def.color; ctx.font = '12.5px Georgia';
      ctx.fillText(`${pad.def.tier} · ${pad.def.cps} coins/s`, P.x + 96, P.y + 64);
      ctx.fillStyle = 'rgba(255,243,214,.75)'; ctx.font = '11.5px Georgia';
      ctx.fillText(pad.def.desc.slice(0, 44) + '…', P.x + 96, P.y + 84);
    } else {
      ctx.fillStyle = 'rgba(230,215,255,.4)'; ctx.font = '13px Georgia'; ctx.textAlign = 'center';
      ctx.fillText('— empty pad —', P.x + P.w / 2, P.y + 66); ctx.textAlign = 'left';
    }
  });

  drawMarketPanels(ctx, state, t);
  drawFx(ctx);
}

function drawRaider(ctx, state, t) {
  const r = state.raider;
  ctx.save(); ctx.translate(r.x, r.y + Math.sin(t * 9) * 2);
  ctx.fillStyle = '#2a2f4a'; ctx.strokeStyle = '#0d0d1f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 4, 15, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8c9a8'; ctx.beginPath(); ctx.arc(0, -14, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#151528'; ctx.beginPath(); ctx.arc(0, -19, 10, Math.PI, 0); ctx.fill();
  ctx.fillRect(-10, -20, 20, 4);
  if (r.carrying) drawCreature(ctx, r.carrying, 20, 8, 0.6, t);
  ctx.restore();
  ctx.fillStyle = '#ff8a8a'; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'center';
  ctx.fillText(r.name, r.x, r.y - 34);
  bar(ctx, r.x - 26, r.y - 30, 52, 6, r.will / 100, '#ff8a5a', '#ff5a7a');
}

function drawMarketPanels(ctx, state, t) {
  // Day / quota panel (top-right under HUD)
  panel(ctx, 976, 56, 288, 92, `Day ${state.day} · Rung ${state.rung} — ${RUNGS[state.rung - 1].name}`);
  ctx.fillStyle = '#fff3d6'; ctx.font = 'bold 15px Georgia'; ctx.textAlign = 'left';
  ctx.fillText(`Day ends in ${Math.ceil(state.dayTimeLeft)}s`, 988, 102);
  ctx.fillStyle = '#c9b8ff'; ctx.font = '12.5px Georgia';
  ctx.fillText(`Quota: earn ${RUNGS[state.rung - 1].quota} today (earned ${Math.floor(state.dayEarned)})`, 988, 122);
  bar(ctx, 988, 130, 264, 9, state.dayEarned / RUNGS[state.rung - 1].quota, '#7fe08a', '#ffd76a');

  // Incoming raid warning panel
  if (state.raidWarn !== null && state.raidWarn !== undefined) {
    panel(ctx, 976, 156, 288, 62, '⚠ Incoming raid', '#ff5a7a');
    ctx.fillStyle = '#ffb8c9'; ctx.font = 'bold 14px Georgia';
    const who = state.nextRaiderName || 'A rival thief';
    ctx.fillText(`${who} in ${Math.ceil(state.raidWarn)}s!`, 988, 196);
  } else if (state.raider) {
    panel(ctx, 976, 156, 288, 62, '⚠ Raid in progress', '#ff5a7a');
    ctx.fillStyle = '#ffb8c9'; ctx.font = 'bold 14px Georgia';
    ctx.fillText(`${state.raider.name} is on the lane!`, 988, 196);
  }

  // Trap cards (right column)
  panel(ctx, 976, 226, 288, 268, 'Trap cards — click, then click a slot');
  TRAPS.forEach((tr, i) => {
    const y = 252 + i * 39;
    const owned = state.coins >= tr.cost;
    ctx.fillStyle = state.selectedTrap === tr.id ? 'rgba(255,215,106,.22)' : 'rgba(255,255,255,.045)';
    ctx.strokeStyle = state.selectedTrap === tr.id ? '#ffd76a' : 'rgba(160,130,230,.3)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.roundRect(986, y - 15, 268, 34, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = tr.color; ctx.beginPath(); ctx.arc(1004, y + 2, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = owned ? '#fff3d6' : 'rgba(255,243,214,.45)'; ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'left';
    ctx.fillText(`${tr.name} — 🪙${tr.cost}`, 1020, y + 6);
  });

  // Heist button + collection panel (bottom strip)
  const hb = state.heistButton;
  ctx.fillStyle = hb.enabled ? '#7a2c8a' : 'rgba(70,50,110,.6)';
  ctx.strokeStyle = '#ff8ad8'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(976, 502, 288, 52, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe9fb'; ctx.font = 'bold 17px Georgia'; ctx.textAlign = 'center';
  ctx.fillText(`🗝 HEIST: ${hb.vaultName}`, 1120, 526);
  ctx.font = '12px Georgia'; ctx.fillStyle = '#ffc9ec';
  ctx.fillText(hb.enabled ? 'Raid the vault, grab the prize, escape in time' : hb.why, 1120, 544);

  panel(ctx, 24, 640, 928, 62, '');
  ctx.fillStyle = '#c9a8ff'; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'left';
  ctx.fillText('COLLECTION', 36, 659);
  const owned = state.collection;
  CREATURES.forEach((c, i) => {
    const x = 130 + i * 102;
    const n = owned[c.id] || 0;
    ctx.globalAlpha = n > 0 ? 1 : 0.3;
    drawCreature(ctx, c, x, 672, 0.52, t + i);
    ctx.globalAlpha = 1;
    ctx.fillStyle = n > 0 ? '#fff3d6' : 'rgba(255,243,214,.4)'; ctx.font = 'bold 11.5px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(`×${n}`, x + 24, 678);
  });
  ctx.fillStyle = '#ffe9b8'; ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'right';
  ctx.fillText(`Relics: ${state.relicsOwned.length ? state.relicsOwned.map((id) => relicById(id).icon).join(' ') : 'none yet'}`, 940, 659);
}

// -------------------------------------------------------------- heist scene
export function drawHeist(ctx, state, t) {
  drawBackground(ctx, t, 0.25);
  const V = state.vault;
  // vault floor
  ctx.fillStyle = '#1c1038';
  ctx.strokeStyle = '#8a6fd0'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(120, 66, 1040, 624, 16); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(160,130,230,.13)'; ctx.lineWidth = 1;
  for (let x = 180; x < 1160; x += 60) { ctx.beginPath(); ctx.moveTo(x, 70); ctx.lineTo(x, 686); ctx.stroke(); }
  for (let y = 126; y < 690; y += 60) { ctx.beginPath(); ctx.moveTo(124, y); ctx.lineTo(1156, y); ctx.stroke(); }
  // Vault title as a floor inscription in the gap between the corner
  // panels, above the door: the top-centre band is owned by the WIN/LOSE
  // panel and the lock bar (a centred title at y=92 rendered unreadable
  // behind that panel), and the bottom-left corner belongs to the threat
  // panel, which dimmed a title starting at x=140.
  ctx.fillStyle = '#ffe9b8'; ctx.font = 'bold 15px Georgia'; ctx.textAlign = 'left';
  ctx.fillText(`${V.def.name} — keeper: ${V.def.keeper}${V.def.final ? ' 👑' : ''}${V.def.midBoss ? ' ⚔ mid-boss vault' : ''}`, 264, 650);

  // display cases
  for (const c of V.cases) {
    ctx.fillStyle = '#2c1a58'; ctx.strokeStyle = '#6a4fb0'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.roundRect(c.x, c.y, c.w, c.h, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(200,170,255,.25)';
    ctx.beginPath(); ctx.roundRect(c.x + 5, c.y + 4, c.w - 10, 5, 3); ctx.fill();
  }

  // pedestal + prize
  const P = V.pedestal;
  ctx.fillStyle = '#3a2470'; ctx.beginPath(); ctx.arc(P.x, P.y + 16, P.r + 12, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(P.x, P.y + 16, P.r + 12, 0, Math.PI * 2); ctx.stroke();
  if (!state.heist.carrying) {
    drawCreature(ctx, creatureById(V.def.prize), P.x, P.y + 8, 1.3, t);
    ctx.fillStyle = '#ffd76a'; ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center';
    ctx.fillText(`PRIZE: ${creatureById(V.def.prize).name}`, P.x, P.y + 62);
  } else {
    // At the PRIZE label's own spot (P.y + 62): P.y + 30 landed on the vault
    // lock bar row and the two texts smeared into one line.
    ctx.fillStyle = '#7fe08a'; ctx.font = 'bold 14px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('PRIZE SNATCHED — RUN!', P.x, P.y + 62);
  }

  // door
  const D = V.door;
  ctx.fillStyle = state.heist.carrying ? '#1f5a34' : '#4a2c14';
  ctx.strokeStyle = state.heist.carrying ? '#7fe08a' : '#c98a4a'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.roundRect(D.x - D.w / 2, D.y, D.w, D.h, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe9b8'; ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'center';
  ctx.fillText('EXIT DOOR', D.x, D.y + 18);

  // guards
  for (const gd of V.guards) drawGuard(ctx, gd, t, state.mods.showCones);

  // player
  drawPlayer(ctx, state, t);
  if (state.heist.carrying) drawCreature(ctx, creatureById(V.def.prize), state.player.x + 24, state.player.y - 6, 0.72, t);

  drawHeistPanels(ctx, state, t);
  drawFx(ctx);
}

function drawGuard(ctx, gd, t, showCones) {
  if (showCones || gd.chase) {
    ctx.fillStyle = gd.chase ? 'rgba(255,90,122,.14)' : 'rgba(255,215,106,.10)';
    ctx.beginPath(); ctx.moveTo(gd.x, gd.y);
    ctx.arc(gd.x, gd.y, 96, gd.face - 0.62, gd.face + 0.62); ctx.closePath(); ctx.fill();
  }
  ctx.save(); ctx.translate(gd.x, gd.y + Math.sin(t * 5 + gd.phase) * 1.6);
  ctx.fillStyle = gd.color; ctx.strokeStyle = '#14102a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 2, 15, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#14102a';
  const fx = Math.cos(gd.face || 0) * 4, fy = Math.sin(gd.face || 0) * 3;
  ctx.beginPath(); ctx.arc(-5 + fx, -3 + fy, 2.8, 0, Math.PI * 2); ctx.arc(5 + fx, -3 + fy, 2.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Georgia'; ctx.textAlign = 'center';
  ctx.restore();
  ctx.fillStyle = gd.chase ? '#ff8aa5' : 'rgba(255,243,214,.8)'; ctx.font = 'bold 11px Georgia'; ctx.textAlign = 'center';
  ctx.fillText(gd.name + (gd.chase ? ' — ON YOU!' : ''), gd.x, gd.y - 26);
}

function drawPlayer(ctx, state, t) {
  const p = state.player;
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = '#3a5a8a'; ctx.strokeStyle = '#0d1a2e'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 4, 14, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffd9b8'; ctx.beginPath(); ctx.arc(0, -13, 8.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a2c8a'; ctx.beginPath(); ctx.arc(0, -18, 9.6, Math.PI, 0); ctx.fill();
  ctx.fillRect(-10, -19, 20, 3.6);
  ctx.fillStyle = '#14102a'; ctx.beginPath(); ctx.arc(-3.4, -12, 1.9, 0, Math.PI * 2); ctx.arc(3.4, -12, 1.9, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawHeistPanels(ctx, state, t) {
  const H = state.heist;
  // WIN / LOSE — explicit, top centre, impossible to miss
  panel(ctx, 356, 56, 568, 74, '');
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7fe08a'; ctx.font = 'bold 16.5px Georgia';
  ctx.fillText(`WIN: escape with the ${creatureById(state.vault.def.prize).name} before the lock seals`, 640, 84);
  ctx.fillStyle = '#ff8aa5'; ctx.font = 'bold 16.5px Georgia';
  ctx.fillText('LOSE: a guard catches you — or the vault seals', 640, 110);
  // lock timer bar
  ctx.fillStyle = '#c9a8ff'; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'left';
  ctx.fillText(`VAULT LOCK — ${Math.ceil(H.timeLeft)}s`, 368, 146);
  bar(ctx, 500, 136, 280, 11, H.timeLeft / H.lockTotal, '#ffb347', '#ff5a7a');
  ctx.fillStyle = '#ffe9b8'; ctx.font = 'bold 13px Georgia'; ctx.textAlign = 'right';
  ctx.fillText(`Combo chain ×${state.combo} · Score ${Math.floor(state.score).toLocaleString('en-US')}`, 912, 146);
  if (state.vault.alarm > 0) {
    ctx.fillStyle = '#ff8aa5'; ctx.font = 'bold 14px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('🔔 ALARM — the Lantern Moth is speeding the lock!', 640, 168);
  }
  // guard roster panel (threat panel)
  panel(ctx, 24, 470, 224, 220, 'Vault guards — threat panel');
  Object.keys(GUARDS).forEach((k, i) => {
    const n = state.vault.guards.filter((g) => g.type === k).length;
    if (!n) return;
    ctx.fillStyle = GUARDS[k].color; ctx.font = 'bold 12px Georgia'; ctx.textAlign = 'left';
    ctx.fillText(`${GUARDS[k].name} ×${n}`, 36, 514 + i * 24);
  });
  ctx.fillStyle = 'rgba(255,243,214,.75)'; ctx.font = '11.5px Georgia';
  ctx.fillText(state.heist.touched ? 'Spotted once — chain broken risk!' : 'Untouched so far: clean bonus alive', 36, 514 + Object.keys(GUARDS).length * 24 + 6);
  // carried / objective panel
  panel(ctx, 1032, 470, 224, 220, 'Heist satchel');
  ctx.fillStyle = '#fff3d6'; ctx.font = '13px Georgia'; ctx.textAlign = 'left';
  ctx.fillText(H.carrying ? '👜 Carrying the prize!' : '👜 Empty — reach the pedestal', 1044, 514);
  ctx.fillText(`Grab range: ${26 + state.mods.grabBonus}px`, 1044, 538);
  ctx.fillText(`Sneak speed ×${state.mods.sneakMult.toFixed(2)}`, 1044, 560);
  ctx.fillText(`Lock speed ×${state.mods.lockMult.toFixed(2)}`, 1044, 582);
  ctx.fillStyle = '#c9a8ff'; ctx.font = 'bold 12px Georgia';
  ctx.fillText('WASD / arrows to sneak · click floor to walk', 1044, 620);
  ctx.fillText('Touch the prize, then the EXIT DOOR.', 1044, 642);
}

// -------------------------------------------------------------- draft scene
export function drawDraft(ctx, state, t) {
  drawBackground(ctx, t, 0.35);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9b8'; ctx.font = 'bold 40px Georgia';
  ctx.fillText(`Day ${state.day} complete — Rung ${state.rung} cleared!`, 640, 130);
  ctx.fillStyle = '#c9b8ff'; ctx.font = '19px Georgia';
  ctx.fillText(`Quota ${RUNGS[state.rung - 1].quota} — you earned ${Math.floor(state.dayEarned)} coins today. Draft 1 of 3 upgrades:`, 640, 166);
  state.draft.forEach((rid, i) => {
    const r = relicById(rid);
    const x = 196 + i * 316, y = 210, w = 272, h = 300;
    const hover = state.hoverCard === i;
    ctx.fillStyle = hover ? 'rgba(70,44,140,.97)' : 'rgba(34,20,74,.97)';
    ctx.strokeStyle = hover ? '#ffd76a' : '#8a6fd0'; ctx.lineWidth = hover ? 3 : 2;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 16); ctx.fill(); ctx.stroke();
    ctx.font = '52px Georgia'; ctx.fillText(r.icon, x + w / 2, y + 84);
    ctx.fillStyle = '#ffe9b8'; ctx.font = 'bold 23px Georgia';
    ctx.fillText(r.name, x + w / 2, y + 128);
    ctx.fillStyle = '#e6d5ff'; ctx.font = '16.5px Georgia';
    wrapText(ctx, r.desc, x + w / 2, y + 162, w - 44, 23);
    ctx.fillStyle = '#ffd76a'; ctx.font = 'bold 14px Georgia';
    ctx.fillText('CLICK TO DRAFT', x + w / 2, y + h - 26);
  });
  // owned relics strip = the meta-progression record
  panel(ctx, 196, 548, 888, 108, 'Your drafted relics so far (meta progression)');
  if (state.relicsOwned.length === 0) {
    ctx.fillStyle = '#c9b8ff'; ctx.font = '15px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('None yet — this is your first draft. Every relic is a real, permanent run effect.', 640, 606);
  } else {
    state.relicsOwned.forEach((rid, i) => {
      const r = relicById(rid);
      ctx.font = '26px Georgia'; ctx.textAlign = 'center';
      ctx.fillText(r.icon, 250 + i * 74, 606);
      ctx.fillStyle = '#e6d5ff'; ctx.font = '11px Georgia';
      ctx.fillText(r.name.split(' ')[1] || r.name, 250 + i * 74, 626);
      ctx.fillStyle = '#fff';
    });
  }
  drawFx(ctx);
}

function wrapText(ctx, text, cx, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, cx, yy); line = w; yy += lh; }
    else line = test;
  }
  if (line) ctx.fillText(line, cx, yy);
}

// -------------------------------------------------------------- title scene
export function drawTitle(ctx, state, t) {
  drawBackground(ctx, t);
  drawCreature(ctx, CREATURES[7], 168, 128, 1.7, t);
  drawCreature(ctx, CREATURES[1], 1112, 128, 1.7, t + 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd76a'; ctx.font = 'bold 62px Georgia';
  ctx.strokeStyle = 'rgba(20,8,44,.9)'; ctx.lineWidth = 10;
  ctx.strokeText('SNATCHMENAGERIE', 640, 118); ctx.fillText('SNATCHMENAGERIE', 640, 118);
  ctx.fillStyle = '#ffc9ec'; ctx.font = 'bold 19.5px Georgia';
  ctx.fillText('buy, park, snatch: 8 creature lines · 8 rival vaults · 6 traps · 9 rungs · final vault The Collector', 640, 152);
  ctx.fillStyle = '#c9b8ff'; ctx.font = '16px Georgia';
  ctx.fillText('A steal-and-defend creature tycoon vs AI keepers. Your creatures earn. Their vaults tempt. Your traps answer back.', 640, 178);

  // How to play
  panel(ctx, 36, 200, 560, 218, 'How to play');
  ctx.fillStyle = '#fff3d6'; ctx.font = '14.5px Georgia'; ctx.textAlign = 'left';
  const how = [
    '1. BUY creatures off the sky-conveyor (click) — rarer pays more.',
    '2. PARK them on income pads; floating coins are real income.',
    '3. HEIST rival vaults: WASD to sneak, grab the prize creature,',
    '    dodge the guards, escape before the vault lock seals.',
    '4. DEFEND: rivals raid your pads — place 6 trap types on the lane.',
    '5. DRAFT 1-of-3 relics after each day; climb 9 rungs; crack',
    '    The Collector’s vault on rung 9. Caught 3× or a stolen',
    '    menagerie emptied = the night market closes. Score big!',
  ];
  how.forEach((line, i) => ctx.fillText(line, 52, 238 + i * 21));

  // Difficulties + rebirth
  panel(ctx, 36, 432, 560, 128, 'Difficulties & the endless layer');
  DIFFICULTIES.forEach((d, i) => {
    ctx.fillStyle = state.difficulty === d.id ? '#ffd76a' : '#e6d5ff';
    ctx.font = 'bold 14.5px Georgia';
    ctx.fillText(`${state.difficulty === d.id ? '▶' : '·'} ${d.name} — guards ×${d.guardMult}, lock ×${d.lockMult}, start 🪙${d.startCoins} (click to choose)`, 52, 470 + i * 24);
  });
  ctx.fillStyle = '#ffc9ec'; ctx.font = '14px Georgia';
  ctx.fillText(`REBIRTH ladder (endless): beat The Collector, reset, keep ×${REBIRTH_LADDER.join(' → ×')} lifetime score.`, 52, 470 + 3 * 24 + 8);

  // Bestiary
  panel(ctx, 628, 200, 616, 360, 'Creature bestiary — the 8 lines & their quirks');
  CREATURES.forEach((c, i) => {
    const y = 240 + i * 41;
    drawCreature(ctx, c, 668, y - 6, 0.78, t + i);
    ctx.fillStyle = c.color; ctx.font = 'bold 14px Georgia'; ctx.textAlign = 'left';
    ctx.fillText(`${c.name} (${c.tier})`, 700, y);
    ctx.fillStyle = '#e6d5ff'; ctx.font = '12.5px Georgia';
    ctx.fillText(`🪙${c.coins} · ${c.cps}/s — ${c.desc}`, 700, y + 16);
  });

  ctx.fillStyle = '#ffe9b8'; ctx.font = 'bold 21px Georgia'; ctx.textAlign = 'center';
  ctx.fillText(state.best > 0 ? `Click or press Enter to open the market · Best score ${Math.floor(state.best).toLocaleString('en-US')}` : 'Click or press Enter to open the market', 640, 606);
  ctx.fillStyle = '#c9b8ff'; ctx.font = '14px Georgia';
  ctx.fillText('Guards you will dodge: Sentry Owl · Bramble Hound · Clockwork Golem · Lantern Moth · Shadow Ferret · Velvet Warden', 640, 634);
  ctx.fillText('Mid-boss vault: Madame Vaultina (rung 5) · Final vault: The Collector (rung 9)', 640, 658);
  drawFx(ctx);
}

// ---------------------------------------------------------------- end scene
export function drawEnd(ctx, state, t) {
  drawBackground(ctx, t, 0.3);
  const S = state.stats;
  ctx.textAlign = 'center';
  ctx.fillStyle = state.victory ? '#ffd76a' : '#ff8aa5'; ctx.font = 'bold 44px Georgia';
  ctx.fillText(state.victory ? 'THE COLLECTOR IS CRACKED!' : 'THE NIGHT MARKET CLOSES…', 640, 108);
  ctx.fillStyle = '#c9b8ff'; ctx.font = '18px Georgia';
  ctx.fillText(state.victory
    ? 'You snatched the Starlight Kirin from the final vault. The menagerie is legend.'
    : 'Three catches — or an emptied menagerie — end the run. The conveyor will roll again.', 640, 140);

  // letter rank
  ctx.fillStyle = 'rgba(34,20,74,.95)'; ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.roundRect(88, 176, 200, 200, 18); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#c9a8ff'; ctx.font = 'bold 14px Georgia';
  ctx.fillText('FINAL RANK', 188, 208);
  ctx.fillStyle = '#ffd76a'; ctx.font = 'bold 118px Georgia';
  ctx.fillText(state.rank, 188, 330);
  ctx.fillStyle = '#fff3d6'; ctx.font = 'bold 21px Georgia';
  ctx.fillText(`Score ${Math.floor(state.score).toLocaleString('en-US')}`, 188, 404);
  ctx.font = '14px Georgia'; ctx.fillStyle = '#c9b8ff';
  ctx.fillText(`Rebirth tier ×${state.rebirthMult}`, 188, 428);

  // 10 stats
  panel(ctx, 320, 176, 520, 252, 'Run statistics');
  const rows = [
    ['Days kept', S.days], ['Rungs climbed', `${S.rungs}/9`], ['Creatures bought', S.bought],
    ['Heists attempted', S.heists], ['Heists escaped clean', S.heistsWon], ['Best combo chain', `×${S.bestCombo}`],
    ['Raids repelled', S.raidsRepelled], ['Creatures stolen from you', S.stolen],
    ['Traps sprung', S.trapsSprung], ['Coins earned (lifetime)', Math.floor(S.coinsEarned).toLocaleString('en-US')],
  ];
  rows.forEach((r, i) => {
    const y = 216 + i * 21.5;
    ctx.fillStyle = '#c9b8ff'; ctx.font = '14px Georgia'; ctx.textAlign = 'left';
    ctx.fillText(r[0], 336, y);
    ctx.fillStyle = '#fff3d6'; ctx.font = 'bold 14px Georgia'; ctx.textAlign = 'right';
    ctx.fillText(String(r[1]), 824, y); ctx.textAlign = 'left';
  });

  // collection recap
  panel(ctx, 872, 176, 372, 252, 'Collection recap');
  CREATURES.forEach((c, i) => {
    const y = 216 + i * 25;
    const n = state.collection[c.id] || 0;
    ctx.globalAlpha = n > 0 ? 1 : 0.32;
    drawCreature(ctx, c, 902, y - 5, 0.55, t + i);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff3d6'; ctx.font = '13.5px Georgia'; ctx.textAlign = 'left';
    ctx.fillText(`${c.name} ×${n}`, 928, y);
  });
  ctx.fillStyle = '#c9a8ff'; ctx.font = 'bold 12.5px Georgia';
  ctx.fillText(`Relics drafted: ${state.relicsOwned.length}`, 888, 216 + 8 * 25 + 6);
  ctx.fillStyle = '#e6d5ff'; ctx.font = '12.5px Georgia';
  ctx.fillText(state.relicsOwned.map((id) => relicById(id).name).join(' · ').slice(0, 52) || 'none', 888, 216 + 8 * 25 + 24);

  // rebirth / restart
  ctx.fillStyle = '#7a2c8a'; ctx.strokeStyle = '#ff8ad8'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(320, 470, 420, 58, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe9fb'; ctx.font = 'bold 18px Georgia'; ctx.textAlign = 'center';
  ctx.fillText(state.victory ? `↻ REBIRTH — restart at ×${state.nextRebirthMult} (click)` : '↻ Run it back — click to restart', 530, 506);
  ctx.fillStyle = '#3a5a2e'; ctx.strokeStyle = '#7fe08a';
  ctx.beginPath(); ctx.roundRect(764, 470, 300, 58, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#eaffea'; ctx.fillText('New run (Enter)', 914, 506);
  ctx.fillStyle = '#c9b8ff'; ctx.font = '14px Georgia';
  ctx.fillText(`Best score: ${Math.floor(state.best).toLocaleString('en-US')} · Difficulty: ${state.difficultyName}`, 640, 566);
  drawFx(ctx);
}

export function drawPausedVeil(ctx) {
  ctx.fillStyle = 'rgba(6,3,16,.72)'; ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#ffe9b8'; ctx.font = 'bold 44px Georgia'; ctx.textAlign = 'center';
  ctx.fillText('PAUSED', 640, 350);
  ctx.font = '18px Georgia'; ctx.fillStyle = '#c9b8ff';
  ctx.fillText('Press P to resume', 640, 386);
}
