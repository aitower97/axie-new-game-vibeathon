# Axie Tactics Dices — Submission copy (Axie Vibeathon 2026, Round 1)

Copy/paste-ready text for the submission form. Placeholders in `[BRACKETS]` must be filled before submitting.

## Project Title

Axie Tactics Dices

## One-sentence Pitch

A turn-based tactics game where the dice of every Axie is made of its six body parts — and evolving a part rewrites that face of the dice.

## Short Description

Axie Tactics Dices is a browser tactics game on a 3D grid. Each Axie's six body parts are the six faces of its combat dice: you don't roll "how hard to hit", you roll *what you can do this turn*. Class affinity, genetic crits and an Energy bank add tactics, and the Lab lets you evolve or lock parts to reshape your dice. Axie genetics are the core mechanic, not decoration.

## Full Description

**Gameplay.** You command three Axies and a Lord on an 8×7 board against an AI. Each turn you roll the dice of every Axie; the face that comes up depends on which body part that Axie carries (Imp, Little Branch, Balloon, Shrimp, Swallow…). Moving never spends your action, so you choose where to stand and then whether to use a Basic attack or the Special of the face you rolled. Class affinity (Beast > Plant > Aqua/Bird; Aqua and Bird > Beast), class-based critical hits, counterattacks, Break, terrain and an Energy bank create decisions beyond luck. Matches last 8 rounds; PVP arenas add a 20-second turn clock and Sudden Death overtime.

**Innovation.** Dice-based tactics exist, and so do grid tactics with summoners. What is new here is that the faces of the dice *are* the body parts of a collectible creature. Evolving a part doesn't add a number: it rewrites one specific face. Locking parts shapes the probability of the dice.

**Axie Core.** Six parts + class drive the mechanic. Change a part and you change what the Axie can do. Models and parts use the official Axie 3D kit.

**Progression.** In the Lab you spend Essence to evolve a part (irreversible) or lock parts for free to concentrate the dice on the faces you want. The Village sketches the meta loop.

**Future vision.** Persistent Lunacia, deeper part synergies, new regions/bosses, real PvP and — as a direction only — real Axie genes and Ascension via Ronin. See `docs/FUTURE_VISION.md`.

## How to Play

Desktop, mouse. Enter the Village → PVE → **Roll dice** → click one of your Axies → click a tile to move → click an enemy to attack (Basic or Special) → **Pass turn**. Drag to pan the camera, wheel to zoom. Evolve parts in the Lab between matches. Full guide: `docs/HOW_TO_PLAY.md`.

## Axie Core Fit

The body parts are not skins or a stat sheet: they are the six faces of the dice that runs the whole game. Axie's genome — six parts plus a class — becomes a probability distribution the player shapes by evolving and locking parts. Real part names, real 3D parts from the Axie Origins kit, the class triangle and a class-based crit profile all come from Axie. If you remove the Axie parts, there is no dice and no game.

## Current Prototype

- 8×7 3D board (Three.js) with terrain: stone, water, slow zones, low obstacles.
- Three playable classes (Beast, Bird, Aqua) with 12 real Axie parts as dice faces.
- Lord with its own dice (attack, shield, mark, heal, buff, duplicate).
- Class affinity, genetic critical hits, counterattacks, Break, Energy bank.
- AI enemy with priorities; starter Axies (Buba, Momo, Puffy) as PVE enemies.
- PVE map of Lunacia with missions; three AI arenas with a 20 s turn clock and Sudden Death.
- Lab (evolve / lock) and a Village screen where Axies gather Wood, Stone and Food.
- Ambient music per game state; Axie Origins VFX on every hit.
- Desktop only; nothing on-chain; AXP/Ascension is an abstraction (1 Essence per evolution vs. the real 10/20/30 levels with on-chain signature).

## Future Vision

Persistent Lunacia world, deeper progression and part synergies, more PvE regions and bosses, real PvP with ranked play, a colony/resource meta layer, and — only as a possible direction — integration of real Axie genes, AXP and Ronin services. Details, and the split between "implemented" and "future", in `docs/FUTURE_VISION.md`.

## AI Tools

- **Claude Code** (Anthropic's coding agent) was used throughout Round 1 for game logic, UI components, visual iteration, documentation, and original SVG artwork (logo and some background elements).
- Session-by-session scope and verification are documented in `CLAUDE.md`.
- No other AI tool is documented in this repository.

## Repository

https://github.com/aitower97/axie-new-game-vibeathon

## Playable Build

[PUBLIC_GAME_URL — fill in after the Vercel deploy is verified]

## Video

VIDEO_URL_HERE

## Assets & credits

Axie Origins Battle Kit (official, per Vibeathon rules §5); Kenney CC0 3D props; Kevin MacLeod (incompetech.com) music, CC-BY 4.0. Full inventory in `docs/design/recursos-vibeathon.md`.
