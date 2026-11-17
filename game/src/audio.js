// SNATCHMENAGERIE — tiny WebAudio synth: soft blips for buys, a chime for
// income gems, a snatch sting, an alarm for raids and a seal clang for a
// vault that closes on you. No assets, everything is oscillators.

let ac = null;

export function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { ac = null; }
}

function tone(freq, dur, type = 'sine', gain = 0.08, when = 0, slide = 0) {
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ac.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

export const sfx = {
  buy()     { tone(520, 0.09, 'triangle', 0.09); tone(780, 0.12, 'triangle', 0.07, 0.06); },
  coin()    { tone(1180, 0.05, 'square', 0.025); },
  gem()     { tone(1560, 0.14, 'sine', 0.07); tone(2090, 0.18, 'sine', 0.05, 0.07); },
  snatch()  { tone(340, 0.16, 'sawtooth', 0.07, 0, 660); tone(990, 0.14, 'triangle', 0.08, 0.1); },
  caught()  { tone(220, 0.3, 'sawtooth', 0.09, 0, -140); },
  sealed()  { tone(140, 0.4, 'square', 0.1, 0, -60); tone(90, 0.5, 'square', 0.08, 0.08); },
  alarm()   { tone(880, 0.12, 'square', 0.05); tone(880, 0.12, 'square', 0.05, 0.18); },
  trap()    { tone(660, 0.08, 'triangle', 0.07, 0, -220); },
  draft()   { tone(587, 0.1, 'triangle', 0.07); tone(880, 0.14, 'triangle', 0.07, 0.08); },
  clear()   { tone(523, 0.12, 'triangle', 0.08); tone(659, 0.12, 'triangle', 0.08, 0.1); tone(784, 0.2, 'triangle', 0.08, 0.2); },
  over()    { tone(392, 0.2, 'triangle', 0.08); tone(311, 0.2, 'triangle', 0.08, 0.16); tone(233, 0.34, 'triangle', 0.08, 0.32); },
  click()   { tone(440, 0.05, 'triangle', 0.05); },
};
