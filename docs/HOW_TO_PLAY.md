# Axie Tactics Dice — How to Play

## 1. What is Axie Tactics Dice?

A turn-based tactics game on an 8×7 grid where **the die of every Axie is made of its six body parts**. Eyes, ears, horn, mouth, back and tail are the six faces. You don't roll "how hard do I hit" — you roll **what can I do this turn**. Kill the enemy Lord to win.

## 2. First 30 seconds

An interactive **tutorial** opens by itself the first time you enter the Village and again the first time you start a match. Reopen it any time with the **? Tutorial** button in the top bar.

1. Open the game. On the cover screen click **Enter the command post** (you land in the Village) or **Quick match** to jump straight into a skirmish.
2. In the top bar pick **PVE** (or *Free match*) and start a mission.
3. Press **Roll dice**. Every living Axie of yours rolls one of its faces.
4. Click one of your Axies — the tiles it can reach light up.
5. Click a tile to move, then click an adjacent/in-range enemy to attack.
6. When nothing useful is left, press **Pass turn**. The enemy plays its turn step by step.

## 3. Controls

Desktop browser (Chrome / Edge) with a mouse. No touch/mobile support.

| Action | How |
|---|---|
| Move the camera | Drag the board |
| Zoom | Mouse wheel |
| Select a unit | Click one of your Axies (or your Lord) |
| Move | Click a highlighted tile. Moving never spends the unit's action |
| Attack | Click an enemy in range |
| Roll dice | **Roll dice** button |
| Basic / Special | Buttons in the action pad at the bottom of the board |
| Pass turn | **Pass turn** button |
| Help | Click the hand icon at the top of the board |
| Music | 🔊 / 🔇 button in the top bar (starts on your first click, browser autoplay policy) |

## 4. The Die

Each Axie has six body parts: eyes, ears, horn, mouth, back, tail. Each part is one face of its die. In this prototype the four combat slots (**horn, mouth, back, tail**) produce actions; eyes and ears are shown as empty faces. The face you roll decides which special action the Axie has this turn. Hover an Axie to see its six parts in the detail panel.

## 5. Combat

- **Movement**: Beast 2, Bird 2, Aqua 3, Plant 1 tiles. Slow zones cost 2. Any Axie can always move, whatever face it rolled.
- **Attacks**: melee range 1 (Bird shoots at range 3). Damage depends on the face and class.
- **Energy**: faces with no strike (guard, reposition) give **+1 Energy** when you roll. The bank lasts the whole match (cap 5). Spend **2 Energy** for **+10 damage** on your next hit, or **+1 movement**.
- **Guard / reposition**: guard faces (e.g. Pumpkin, Hermit, Balloon) apply a shield right when rolled; Swallow lets you move an adjacent ally 1 tile instead of attacking.
- **Terrain**: stone blocks; water is Aqua-only; slow zones give +10 guard to whoever is hit there; a low obstacle gives +1 range to a shooter standing next to it.
- **Rounds**: a match lasts **8 rounds**. If neither Lord dies, the Lord with more life left wins.
- **Enemies**: the AI rolls, then moves and attacks with each unit in turn (highlighted with a pulsing halo), finishing wounded units and heading for your Lord when it can.
- **Break**: hitting a target with class-effect advantage can *Break* it: it cannot counterattack that exchange or the next hit.
- **Counterattack**: a surviving unit in range answers once with its own rolled face.

## 6. Affinity

Class triangle used in the prototype (damage ×1.15 with advantage, ×0.85 with disadvantage):

- **Beast** beats Plant; loses to Aqua and Bird.
- **Plant** beats Aqua and Bird; loses to Beast.
- **Aqua** beats Beast; loses to Plant.
- **Bird** beats Beast; loses to Plant.
- Aqua vs Bird, and same-class pairs, are neutral. Attacks against a Lord are neutral.

The action pad previews the modifier before you commit.

## 7. Critical Hits

Each attack can crit. Chance and multiplier come from the attacker's **class** (Beast 20 % ×2.0, Bird 25 % ×2.5, Aqua 15 % ×3.0, Plant 5 % ×1.5); a special face adds +5 % chance and +0.25 multiplier. Basic attacks use the class base only. The preview shows the numbers; the roll happens when you hit.

## 8. Basic vs Special

- **Basic**: a free attack with the class's base damage. Always available if a target is in range.
- **Special**: the effect of the face you rolled (pierce, drain, ranged bonus, dash-attack…). Guard and reposition faces are not attacks, so with those you pick Basic explicitly if you want to hit.

## 9. PVE

Open **PVE** in the top bar: a map of Lunacia with regions and missions against wild/starter Axies (Buba, Momo, Puffy and others). Win to unlock the next mission and earn Essence. Objective: destroy the enemy Lord (or lead on Lord life after round 8).

## 10. PVP

**PVP** offers three arenas against AI-controlled rivals (Novice, Merchant, Lighthouse) — there is no online multiplayer. PVP-specific rules:
- **Turn clock**: 20 s per playable turn; when it runs out, the game rolls if needed and passes the turn.
- **Sudden Death**: after round 8, two extra rounds with **+2 movement and +50 % damage for both sides**; then the Lord with more life wins.

## 11. Progression

Open the **Lab**. For each class you can:
- **Evolve** a part (1 Essence, irreversible): it rewrites that die face (+10 value).
- **Lock** a part (free): the face leaves the die so the others come up more often. Evolved parts cannot be locked.

Changes apply to your next match. The **Village** shows the session economy skeleton: Axies work jobs to gather Wood, Stone and Food (no backend, nothing persists).

## 12. Tips

1. Roll first, then plan — the faces you got decide who should move where.
2. Guard faces are not wasted: they give Energy for the big turn.
3. Watch the affinity chip before attacking; send Beasts at Plants, not at Aqua.
4. Protect your Lord: troops are expendable, the Lord isn't.
5. Use slow zones and obstacles for defense and range.
6. Lock the faces you never use in the Lab to raise the odds of the good ones.
7. In PVP, don't let the clock decide for you.
8. Hover enemies for the exchange preview (damage, affinity, crit).

## 13. Known limitations

- Desktop only, mouse only — a deliberate scope choice for Round 1.
- It is a **prototype**: three classes (Beast, Bird, Aqua) are playable; Plant exists in the affinity rules but is not part of the playable roster.
- **Nothing is on-chain.** No wallet, no NFTs.
- **AXP / Ascension is abstracted**: in real Axie, Ascension happens at levels 10/20/30 and needs a signed on-chain transaction; here evolving costs 1 Essence so progression is visible in a demo.
- PVP is against the AI, not other players.
- Sudden Death was verified by code review, not by a full recorded match.
