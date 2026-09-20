# Axie Tactics Dice — Axie Vibeathon 2026, Round 1

> A turn-based tactics game where the die of every Axie is made of its six body parts — and evolving a part rewrites that face of the die.

Prototype built for **Round 1 of the Axie Vibeathon 2026**, using the official
[Axie Origins Battle Kit](https://github.com/axieinfinity/axie-origins-asset-kit) under the
permission granted in Section 5 of the Vibeathon Official Rules.

# PLAY THE PROTOTYPE

**https://axie-new-game-vibeathon.vercel.app/**

Desktop browser (Chrome / Edge) with a mouse. The game UI is in English and includes an interactive tutorial (navigation + how to play a match). The first load downloads the 3D Axie assets, so the 3D models can take a few seconds to appear.

# HOW TO PLAY

Full guide: [docs/HOW_TO_PLAY.md](docs/HOW_TO_PLAY.md). The quick version:

1. On the cover screen press **Enter the command post** (Village) or **Quick match**.
2. Start a match from **PVE** (map of Lunacia, or *Free match*) or **PVP** (arenas).
3. **Roll dice**: every Axie lands on one face of its die — a real body part that decides what it can do.
4. Click one of your Axies, click a tile to move (moving never spends the action), then click an enemy to attack with **Basic** or **Special**.
5. **Pass turn** when nothing useful is left. Destroy the enemy Lord within 8 rounds.

Controls: drag the board to pan, mouse wheel to zoom, **? Tutorial** in the top bar to replay the tutorial, speaker button for music.

# FUTURE VISION

See [docs/FUTURE_VISION.md](docs/FUTURE_VISION.md). It separates clearly what is **implemented now** from what is **future vision**.

**Repository:** https://github.com/aitower97/axie-new-game-vibeathon ·
**Submission copy:** [docs/SUBMISSION.md](docs/SUBMISSION.md)

---

## The idea in thirty seconds

Every Axie has six body parts: eyes, ears, horn, mouth, back and tail. **Those six parts are the six faces of its die.** Rolling does not tell you "how hard you hit"; it tells you **what you can do this turn**, and which face comes up depends on **which specific part** the Axie carries: an *Imp* horn pierces, a *Little Branch* hits softer but doubles as guard, a *Cactus* horn does not attack at all.

Progression follows the same idea. Evolving a part does not raise a number: it **rewrites that face of the die for good**. The Lab also lets you **lock** parts, taking their faces out of the roll: it does not buy power, it buys certainty about which face comes up.

## What is implemented

- **Combat**: 8×7 3D board (Three.js) with terrain (stone, water, slow zones, low obstacles), three playable classes (Beast, Bird, Aqua) using 12 real Axie parts as die faces, and a Lord with its own die (attack, shield, mark, heal, buff, duplicate).
- **Tactics layers**:
  - **Class affinity** (Axie's class triangle): Beast beats Plant; Plant beats Aqua and Bird; Aqua and Bird beat Beast. Damage x1.15 / x0.85, previewed before you hit.
  - **Genetic critical hits**: chance and multiplier come from the attacker's class (Beast 20 % x2.0, Bird 25 % x2.5, Aqua 15 % x3.0, Plant 5 % x1.5), plus a bonus from the rolled part.
  - **Counterattacks and Break**, and an **Energy bank** filled by non-strike faces (guard, reposition) and spent on +10 damage or +1 movement.
  - **Sudden Death (PVP)**: after round 8, two extra rounds with +2 movement and +50 % damage for both sides.
- **Modes**: PVE missions on a map of Lunacia (starter Axies Buba, Momo and Puffy plus wild Axies), three PVP-style arenas against an AI with a 20-second turn clock, and a quick match.
- **Meta**: a Village where Axies work jobs to gather Wood, Stone and Food, and a **Parts Lab** to evolve and lock parts (Essence is earned by winning matches).
- **Presentation**: real Axie 3D models and parts from the official kit, real Axie Origins VFX on every hit, ambient music that changes with the game state, and an interactive tutorial.

## Axie Core fit

Axie's genome (six parts + a class) stops being cosmetic or a stat sheet: **it is the source of the core mechanic**, the probability distribution of the die. Change a part and you literally change what the creature can do that turn. Evolving a part rewrites that face permanently. It is the same genetics that already exist in the Axie ecosystem, turned into the lever of play instead of a background number. If you remove the Axie parts, there is no die, and without the die there is no game.

Design references and market analysis (Lord/troop structure, asymmetric sink, mint subscription, competitor study) are in [docs/design/](docs/design/) (written in Spanish).

## Known limitations

- **Desktop only, mouse only.** There is no touch/mobile support; it was a deliberate scope choice to focus Round 1 on combat.
- **Slow first load.** The 3D assets are heavy, so the models can take a while to appear on the first visit. Loading is not optimized yet.
- **No automated tests.** Combat logic (affinity, criticals, counterattacks, Sudden Death) was verified by code review and hand-played matches, not by a test suite.
- **Sudden Death was verified by code review**, not by a fully recorded match: the AI usually wins before round 9 if the player does not defend.
- **AXP / Ascension is abstracted.** In real Axie, Ascension happens at levels 10/20/30 and needs a signed on-chain transaction. Here evolving costs 1 Essence and is instant, so progression is visible in a short demo. This is declared as an abstraction, not a misunderstanding of the real system.
- **Nothing is on-chain.** This is deliberate: the Vibeathon rules make it optional at the prototype stage.
- **PVP is against an AI**, not other players. Research and Resources screens exist in the code but are hidden until their logic is properly implemented.
- **The 2D Lunacia background is our own composition**, not official Sky Mavis art.

## Disclosures

- **Material use of AI**: this prototype was built with extensive assistance from **Claude Code** (Anthropic's coding agent) throughout Round 1: game logic, UI components, visual iteration, tutorial, documentation, and original derived artwork (some SVG elements were drawn by the agent, not traced from third-party assets). The session-by-session scope and verification are recorded in [`CLAUDE.md`](CLAUDE.md).
- **Pre-existing work / starters**: none beyond the official Vibeathon tools listed below.
- **Code dependencies**: React 19, Vite 8, Three.js, Tailwind CSS 4, and `@jaatster/threejs-axie-mixer3d-public` (a vendored 3D mixer from the competition ecosystem, in `vendor/`). Full list in `package.json`.
- **Axie Origins Battle Kit assets** (3D models, parts, combat VFX, slot emblems): full inventory in [docs/design/recursos-vibeathon.md](docs/design/recursos-vibeathon.md). To keep the deployment small, `public/assets/axie` contains only the subset the game loads.
- **Other third-party assets**: CC0 3D props from Kenney (Platformer Kit, Mini Forest) for terrain and scenery; ambient music by Kevin MacLeod (incompetech.com), CC-BY 4.0, credited in the in-game help panel and in `public/music/README.md`.
- **Contributors**: solo project (see the git history for authorship).

## Run locally

```
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
npm run lint     # oxlint
```

The build is a static Vite app: no backend, no database. It is deployed on Vercel from `main` (`vercel.json`: build `npm run build`, output `dist`).

## Repository structure

```
src/
  App.jsx             orchestrator: match state, turns, combat and AI logic
  components/         UI (cover, HUD, cards, board overlay, Lab, tutorial)
  modes/village/      the Village scene
  core/               grid pathfinding and actor helpers
  axie.js             parts, classes, dice and effect resolution
  tutorialSteps.js    tutorial content
public/               assets served as-is: assets/axie (3D pack subset), models, music, vfx, brand
vendor/               vendored 3D mixer (needed for the remote build)
docs/                 how to play, future vision, submission copy, video script, thumbnail brief, checklist
docs/design/          internal design documents (MVP1 rules, market study, resources), in Spanish
vercel.json           static deployment config
CLAUDE.md             full development session history, with verification
```
