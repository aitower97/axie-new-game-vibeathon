# Tactic Dice — Future Vision

> **Reading guide.** Every section is split into **Implemented now** (what the prototype does today) and **Future vision** (direction, not built). Nothing under "Future vision" exists in the current build.

## 1. From Prototype to Full Game

**Implemented now:** a playable tactics prototype — 8×7 3D board, three playable classes, AI enemies, PVE missions on a Lunacia map, PVP-style arenas against the AI, a hub with Lab / Research / Resources, ambient music and real Axie Origins VFX.

**What it proves:** the idea in one sentence — *the die of every Axie is made of its six body parts, and evolving a part rewrites that face.* A match is short, readable, and the character's genetics are what you play with.

**Future vision:** grow the same core into a full game without changing its rule: body part = die face.

## 2. Core Game Loop

**Implemented now:** roll the die → move / choose Basic or Special → resolve combat (affinity, crits, counterattack) → earn Essence → evolve or lock a part in the Lab → play again with a rewritten die.

**Future vision:** Axie → combat → progression → evolution → build decisions → new adventures, with each loop turn asking the player to reshape the probability of their Axies' dice, not just raise a number.

## 3. Axie Core

This is the heart of the project. **The genome is not decoration — it is the mechanic.**

**Implemented now:**
- Each Axie has six parts and a class. Each part maps to a die face (four combat slots: horn, mouth, back, tail; eyes and ears are reserved faces).
- Part names are real Axie parts (Imp, Little Branch, Balloon, Shrimp, Swallow…), rendered with the official 3D parts from the Axie Origins kit.
- Class drives stats, affinity triangle and critical profile.
- Evolving a part rewrites that die face; locking a part reshapes the die's probability.
- Remove the parts and there is no die — and without the die there is no game.

**Future vision:** more parts (eyes/ears with real effects), part synergies (e.g. the Nut Crack + Nut Throw combo already in the prototype as a pattern), and body-build identity beyond class.

## 4. Persistent Lunacia

**Implemented now:** a navigable Lunacia map with regions and mission nodes, a hub, and the Lord as your command post. State lives in the browser session only.

**Future vision:** a persistent world — regions that remember victories, events, and a campaign that progresses across sessions.

## 5. Axie Progression

**Implemented now:** evolve (1 Essence, irreversible) and lock (free) per part; the prototype's AXP/Ascension is a deliberate abstraction of the real 10/20/30 level Ascension.

**Future vision (directions only, no economy is defined):** evolution paths, specialisation, build archetypes, collection of parts, and strategic decisions about which faces to keep. No concrete economic system is proposed here.

## 6. PvE Expansion

**Implemented now:** three regions with several missions against wild and starter Axies.

**Future vision:** new regions, enemy types (chimera-style creatures), bosses, terrain scenarios, challenge modes and story campaigns.

## 7. PvP Expansion

**Implemented now:** three AI-run arenas with a 20 s turn clock and Sudden Death overtime (+2 movement, +50 % damage).

**Future vision:** real player-versus-player, ranked ladders, seasons, alternative formats and competitive builds (the die makes the "build" itself the metagame).

## 8. Colony / Resource Layer

**Implemented now:** a hub with Essence, a Research screen and a Resources screen — a session-level skeleton of the meta economy, not connected to any backend.

**Future vision:** a deeper meta layer where resources, research and the hub connect to progression across sessions. The asymmetric-sink idea already documented in `docs/design/decision-de-producto.md` (troops are consumed, the Lord is only wounded) fits this layer.

## 9. Axie Ecosystem / On-chain Future

| | Prototype abstraction | Potential production integration |
|---|---|---|
| Axies | Preset genes for three classes | Load a player's real Axie genes (the official mixer already consumes genes) |
| Ascension | 1 Essence, instant | Real levels 10/20/30 with an on-chain signature |
| AXP | Not used | AXP API (requires an approved app in the Ronin Developer Console) |
| Wallet | None | Ronin Waypoint |
| Items | Session-only | Ronin Store / Market |

**There is no on-chain integration in this build.** Everything in the right column is a possible direction that would need Sky Mavis approval and separate work.

## 10. Why This Could Scale

- **Different Axies → different dice.** Two Axies with the same class but different parts play differently.
- **Distributions, not stats.** Evolving and locking shape probabilities, giving depth without number inflation.
- **Builds and counterplay.** Affinity, guard, Break and crits make faces matter in context.
- **Readable progression.** A player sees exactly which face changed.
- **Collectability.** Every part is a piece of a die, so parts become meaningful to collect and combine.
