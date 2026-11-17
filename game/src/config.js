// SNATCHMENAGERIE — every table in the game lives here: the 8 creature lines
// on their rarity ladder, the 8 rival vaults and their keepers, the 6 trap
// types, the 6 guard types, the 10 draft relics, the 9 menagerie rungs, the
// 3 difficulties, the Rebirth ladder and all scoring. Nothing in this file
// touches the DOM; the rest of the game reads these tables and simulates.

export const VIEW = { w: 1280, h: 720 };
export const HUD_H = 46;

// The play field inside the canvas (below the DOM HUD strip).
export const FIELD = { x: 24, y: 60, w: 1232, h: 636 };

// Market geometry: the sky-conveyor runs along the top of the field, the
// income pads sit in two rows under it, and the defence lane is the strip a
// raider crosses to reach the pads.
export const BELT = { x: 40, y: 84, w: 1200, h: 92 };
export const PADS = [];
for (let i = 0; i < 8; i++) {
  PADS.push({ x: 76 + (i % 4) * 300, y: 356 + Math.floor(i / 4) * 150, w: 240, h: 118 });
}
export const LANE_Y = 268;            // raiders walk this lane toward the pads
export const TRAP_SLOTS = [150, 390, 630, 870, 1110].map((x) => ({ x, y: LANE_Y, r: 30 }));

export const DAY_SECONDS = 55;        // one market day
export const HEIST_SECONDS = 34;      // base vault lock timer
export const RAID_WARN_SECONDS = 6;   // warning before a raider arrives

// ---------------------------------------------------------------- creatures
// 8 original creature lines. coins = price on the conveyor, cps = coins per
// second on a pad, quirk = behaviour id read by the income simulation.
export const CREATURES = [
  { id: 'snail',  name: 'Turbo Snail',    tier: 'Common',    coins: 40,   cps: 2,   color: '#7fe08a', accent: '#2c7a3f', quirk: 'burst',   desc: 'Pays in bursts — every 6 s it surges for triple coins.' },
  { id: 'crab',   name: 'Crystal Crab',   tier: 'Common',    coins: 70,   cps: 3,   color: '#8ad8ff', accent: '#2c5a8a', quirk: 'gems',    desc: 'Now and then sheds a gem worth 50 coins.' },
  { id: 'gloom',  name: 'Gloombat',       tier: 'Uncommon',  coins: 130,  cps: 6,   color: '#b48aff', accent: '#5a2c8a', quirk: 'night',   desc: 'Pays double while a heist alarm is ringing anywhere.' },
  { id: 'fox',    name: 'Ember Fox',      tier: 'Uncommon',  coins: 210,  cps: 9,   color: '#ffb35a', accent: '#8a4a1c', quirk: 'streak',  desc: 'Each clean heist in your chain stokes it: +10% pay per chain link.' },
  { id: 'jelly',  name: 'Moon Jelly',     tier: 'Rare',      coins: 340,  cps: 15,  color: '#a8f0ff', accent: '#3a7a9a', quirk: 'drift',   desc: 'Drifts between pads — every pad it visits pays a 12-coin bonus.' },
  { id: 'owl',    name: 'Clockwork Owl',  tier: 'Rare',      coins: 520,  cps: 24,  color: '#ffd76a', accent: '#8a6a1c', quirk: 'alarm',   desc: 'Winds your vault lock: raids against you start 2 s slower.' },
  { id: 'wyrm',   name: 'Velvet Wyrm',    tier: 'Epic',      coins: 850,  cps: 40,  color: '#ff8ad8', accent: '#8a2c6a', quirk: 'royal',   desc: 'Pays 1.5x whenever it is the richest creature on your pads.' },
  { id: 'kirin',  name: 'Starlight Kirin', tier: 'Legendary', coins: 1400, cps: 68,  color: '#fff3a8', accent: '#a8842c', quirk: 'choir',   desc: 'Sings: every other creature on your pads pays +15%.' },
];
export const creatureById = (id) => CREATURES.find((c) => c.id === id);

// ------------------------------------------------------------------- vaults
// 8 rival vaults, one per rung pairing. prize = creature line waiting on the
// pedestal. guards = roster of guard type ids. midBoss / final mark the two
// boss vaults the BEDAH checklist demands.
export const VAULTS = [
  { rung: 1, keeper: 'Brasswick the Tinker',   name: "Brasswick's Strongbox", prize: 'crab',  guards: ['owl', 'owl'],                          lock: 1.0,  midBoss: false, final: false },
  { rung: 2, keeper: 'Madame Lumen',           name: "Madame Lumen's Safe",   prize: 'gloom', guards: ['owl', 'hound'],                        lock: 1.0,  midBoss: false, final: false },
  { rung: 3, keeper: 'The Quill Twins',        name: 'The Twins’ Twin Vault', prize: 'fox',   guards: ['owl', 'hound', 'moth'],                lock: 1.05, midBoss: false, final: false },
  { rung: 4, keeper: 'Father Corvid',          name: "Father Corvid's Crypt", prize: 'jelly', guards: ['hound', 'golem', 'owl'],               lock: 1.1,  midBoss: false, final: false },
  { rung: 5, keeper: 'Madame Vaultina',        name: 'The Vaultina Grand Safe', prize: 'owl', guards: ['golem', 'moth', 'hound', 'owl'],       lock: 1.15, midBoss: true,  final: false },
  { rung: 6, keeper: 'Sir Reginald Pounce',    name: "Pounce's Trophy Vault", prize: 'wyrm',  guards: ['ferret', 'hound', 'golem', 'moth'],    lock: 1.2,  midBoss: false, final: false },
  { rung: 7, keeper: 'The Hollow Curator',     name: 'The Hollow Gallery',    prize: 'kirin', guards: ['ferret', 'golem', 'moth', 'hound', 'owl'], lock: 1.25, midBoss: false, final: false },
  { rung: 9, keeper: 'The Collector',          name: "The Collector's Vault", prize: 'kirin', guards: ['warden', 'ferret', 'golem', 'moth', 'hound', 'warden'], lock: 1.35, midBoss: false, final: true },
];

// ------------------------------------------------------------------- guards
// 6 guard types, each with a genuinely different behaviour in the heist sim.
export const GUARDS = {
  owl:    { name: 'Sentry Owl',     speed: 52,  color: '#ffd76a', desc: 'Patrols a fixed loop, steady and predictable.' },
  hound:  { name: 'Bramble Hound',  speed: 96,  color: '#ff9a5a', desc: 'Smells you — chases on sight, gives up at range.' },
  golem:  { name: 'Clockwork Golem', speed: 30, color: '#a8b8d8', desc: 'Slow blocker — parks on chokepoints and will not move.' },
  moth:   { name: 'Lantern Moth',   speed: 64,  color: '#c9f0a8', desc: 'Raises the alarm: while it flutters, the lock seals faster.' },
  ferret: { name: 'Shadow Ferret',  speed: 78,  color: '#b48aff', desc: 'Blinks — teleports ahead of you every few seconds.' },
  warden: { name: 'Velvet Warden',  speed: 112, color: '#ff5a7a', desc: 'The Collector’s elite — fast, relentless, never gives up.' },
};

// -------------------------------------------------------------------- traps
// 6 trap types for the defence lane. cost in coins, effect read by raid sim.
export const TRAPS = [
  { id: 'banana', name: 'Banana Fanfare', cost: 60,  color: '#ffe95a', effect: 'slow',   power: 0.45, dur: 3,   desc: 'Slips the raider: 55% slower for 3 s.' },
  { id: 'glue',   name: 'Glue Lantern',   cost: 90,  color: '#a8f0ff', effect: 'slow',   power: 0.7,  dur: 4,   desc: 'Sticky light: 70% slower for 4 s.' },
  { id: 'bell',   name: 'Alarm Bell',     cost: 80,  color: '#ffd76a', effect: 'expose', power: 1,    dur: 5,   desc: 'Rings: the raider is exposed and your lock drains its nerve — it turns back at half health of will.' },
  { id: 'decoy',  name: 'Decoy Crate',    cost: 110, color: '#c9a06a', effect: 'decoy',  power: 1,    dur: 4,   desc: 'A fake prize: the raider stops to pry it open for 4 s.' },
  { id: 'spring', name: 'Spring Pad',     cost: 130, color: '#8affc9', effect: 'launch', power: 320,  dur: 0,   desc: 'Boing: launches the raider 320 px back toward the gate.' },
  { id: 'mirror', name: 'Mirror Snare',   cost: 160, color: '#e8c9ff', effect: 'stop',   power: 1,    dur: 2.5, desc: 'Catches the raider in its own reflection: frozen 2.5 s.' },
];
export const trapById = (id) => TRAPS.find((t) => t.id === id);

// ------------------------------------------------------------------- relics
// 10 passive collectibles, drafted 1-of-3 after each day. apply() mutates the
// run's modifier bag; every effect is real in the sim.
export const RELICS = [
  { id: 'gloves', name: 'Velvet Gloves',  icon: '🧤', desc: 'Heist grab is instant from 14 px further away.', apply: (m) => { m.grabBonus += 14; } },
  { id: 'boots',  name: 'Moon Boots',     icon: '🥾', desc: '+12% sneak speed inside vaults.',              apply: (m) => { m.sneakMult *= 1.12; } },
  { id: 'magnet', name: 'Coin Magnet',    icon: '🧲', desc: 'All pad income +15%.',                            apply: (m) => { m.incomeMult *= 1.15; } },
  { id: 'jammer', name: 'Trap Jammer',    icon: '📡', desc: 'Vault locks seal 15% slower.',                    apply: (m) => { m.lockMult *= 0.85; } },
  { id: 'clover', name: 'Lucky Clover',   icon: '🍀', desc: 'Conveyor deals rarer creatures more often.',      apply: (m) => { m.luck += 0.18; } },
  { id: 'bell',   name: 'Echo Bell',      icon: '🔔', desc: 'Raid warnings arrive 3 s earlier.',               apply: (m) => { m.warnBonus += 3; } },
  { id: 'cloak',  name: 'Shadow Cloak',   icon: '🌑', desc: 'Guards notice you 20% later.',                    apply: (m) => { m.sightMult *= 0.8; } },
  { id: 'leash',  name: 'Golden Leash',   icon: '✨', desc: 'Clean-heist combo pays +25% more score.',         apply: (m) => { m.comboMult *= 1.25; } },
  { id: 'lens',   name: 'Night Lens',     icon: '🔭', desc: 'Guard sight cones are drawn — see exactly what they see.', apply: (m) => { m.showCones = true; } },
  { id: 'charter', name: 'Pad Charter',   icon: '📜', desc: '+1 income pad, forever yours.',                   apply: (m) => { m.extraPads += 1; } },
];
export const relicById = (id) => RELICS.find((r) => r.id === id);

export function freshMods() {
  return {
    grabBonus: 0, sneakMult: 1, incomeMult: 1, lockMult: 1, luck: 0,
    warnBonus: 0, sightMult: 1, comboMult: 1, showCones: false, extraPads: 0,
  };
}

// -------------------------------------------------------------------- rungs
// 9 menagerie rungs: the run's spine. Each rung names its day quota (coins
// earned that day to advance cleanly) and which vault opens after the day.
export const RUNGS = [
  { n: 1, name: 'Curio Cart',        quota: 120,  vault: 0 },
  { n: 2, name: 'Lantern Stall',     quota: 260,  vault: 1 },
  { n: 3, name: 'Oddity Booth',      quota: 480,  vault: 2 },
  { n: 4, name: 'Wonder Tent',       quota: 800,  vault: 3 },
  { n: 5, name: 'Grand Menagerie',   quota: 1250, vault: 4 },
  { n: 6, name: 'Marvel Pavilion',   quota: 1900, vault: 5 },
  { n: 7, name: 'Celestial Arcade',  quota: 2800, vault: 6 },
  { n: 8, name: 'The Gilded Row',    quota: 4000, vault: 6 },
  { n: 9, name: "Collector's Row",   quota: 5600, vault: 7 },
];

// --------------------------------------------------------------- difficulty
export const DIFFICULTIES = [
  { id: 'casual',   name: 'Casual Keeper',  guardMult: 0.85, lockMult: 1.2,  startCoins: 160 },
  { id: 'standard', name: 'Standard Keeper', guardMult: 1.0,  lockMult: 1.0,  startCoins: 120 },
  { id: 'daring',   name: 'Daring Keeper',  guardMult: 1.18, lockMult: 0.88, startCoins: 100 },
];

// ----------------------------------------------------------------- rebirth
// The endless layer: after beating The Collector you may Rebirth — the run
// resets, the lifetime multiplier climbs the ladder, and the market reopens.
export const REBIRTH_LADDER = [1, 2, 3, 5];

// ------------------------------------------------------------------ scoring
export const SCORE = {
  coinEarned: 1,          // per coin of income, banked into score at day end
  buy: 25,                // per creature bought
  heistBase: 1200,        // per successful heist, before combo
  heistPerSecondLeft: 60, // per second of lock left when you escape
  cleanBonus: 800,        // untouched heist
  raidRepelled: 500,      // raider turned away empty-handed
  trapSprings: 40,        // per trap that fires
  finalVault: 5000,       // cracking The Collector
};
