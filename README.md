[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w8-snatchmenagerie/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w8-snatchmenagerie/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# SNATCHMENAGERIE

**SNATCHMENAGERIE — buy, park, snatch: 8 creature lines, 8 rival vaults, 6 traps, 9 rungs, final vault The Collector**

A steal-and-defend creature tycoon on a 2D canvas — no libraries, no build step, no
network. Open `game/index.html` from any static server and play, fully offline.

## The game

Oddball creatures ride a **sky-conveyor** over a lantern-lit night market. **Buy** them
off the belt, **park** them on your income pads, and watch the coins roll in — every
creature pays coins per second and carries a behaviour quirk (the Turbo Snail pays in
bursts, the Gloombat only pays at full tilt in the dark hours, the Crystal Crab
sometimes sheds a gem worth fifty coins). Between market days, run timed **heists**
into rival keepers' vaults: cross the vault floor, grab the prize creature off its
pedestal, dodge six kinds of AI guards, and escape through the door before the vault
lock seals. Rivals raid **you** in return — six trap types and an upgradeable vault
lock defend your pads while a thief creeps for your richest creature. After each day,
**draft 1 of 3 upgrades** from a pool of ten named relics, climb **9 menagerie rungs**
through **8 rival vaults**, and crack the final vault: **The Collector**. A **Rebirth
ladder** (×2, ×3, ×5 lifetime multipliers) is the endless layer on top of three
difficulties.

- **8 creature lines** on a rarity ladder — Turbo Snail, Gloombat, Crystal Crab,
  Ember Fox, Moon Jelly, Clockwork Owl, Velvet Wyrm, Starlight Kirin — each with its
  own coins/sec and quirk.
- **8 rival vaults**, one per keeper (Brasswick, Madame Lumen, the Quill Twins,
  Father Corvid, Madame Vaultina the mid-boss, Sir Reginald Pounce, the Hollow
  Curator, and The Collector), each with its own guard mix and prize creature.
- **6 trap types** — Banana Fanfare, Glue Lantern, Alarm Bell, Decoy Crate,
  Spring Pad, Mirror Snare — placed on your defence lane to slow, stop or expose
  raiders.
- **6 guard types** with distinct behaviour — Sentry Owl (patrol), Bramble Hound
  (chaser), Clockwork Golem (slow blocker), Lantern Moth (alarm raiser),
  Shadow Ferret (teleporter) and Velvet Warden (fast final-vault elite).
- **10 draft relics** with real effects: Velvet Gloves, Moon Boots, Coin Magnet,
  Trap Jammer, Lucky Clover, Echo Bell, Shadow Cloak, Golden Leash, Night Lens,
  Pad Charter.
- **9 rungs**, a score chain for clean heists (combo multiplier up to ×5), and full
  runs that score in the tens of thousands.

## Controls

- **Mouse / touch:** click a creature on the conveyor to buy it; click a trap card,
  then a defence-lane slot, to place a trap; click **HEIST** to raid the next vault;
  click a draft card to take it.
- **WASD / arrow keys:** sneak through a vault (or click the floor to walk there).
- **Enter / Space / click:** start, advance, restart.
- **P:** pause.

## Screens

`screenshots/` holds four real renders of the game itself, in dossier order: the
final-vault heist climax against The Collector mid-escape with the full HUD, the
upgrade draft (meta) screen, the dense title screen with the how-to and the creature
bestiary, and the end screen with the letter rank, full run stats and the collection
recap.

## Layout

- `game/index.html` — the page and HUD strip.
- `game/src/config.js` — every table: 8 creature lines, 8 vaults, 6 traps, 6 guards,
  10 relics, 9 rungs, difficulties, scoring.
- `game/src/world.js` — the conveyor spawner, vault layouts and guard rosters, the
  raider generator.
- `game/src/render.js` — all canvas art and screens: the night market, creatures,
  vaults, guards, the draft / title / end screens, juice (floating numbers, banners,
  particles).
- `game/src/main.js` — the game loop and state: market days, income, heists, raids,
  drafts, rungs, rebirth, win / lose.
- `game/src/hud.js`, `game/src/input.js`, `game/src/audio.js` — HUD strip, controls,
  WebAudio synth blips.
- `game/src/shots.js` — deterministic `?shot=` scenes used to render the screenshots.
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` out and writes the dossier.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## Hand in

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
node serve.ts        # or any static server over game/, to play it
```

MIT licensed — see `LICENSE`.
