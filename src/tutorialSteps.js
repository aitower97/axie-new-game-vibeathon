// tutorialSteps.js — contenido de los dos tutoriales (en ingles): el recorrido
// por la navegacion ('nav') y el de la partida ('match'). Cada paso puede
// llevar `target` (selector CSS del elemento a resaltar; si no existe en ese
// momento, el paso se muestra igual, solo sin anillo) y `action` (un boton
// extra que navega a una ruta del hash).

export const NAV_STEPS = [
  {
    title: 'Welcome to Axie Tactics Dice',
    text: 'Every Axie has six body parts, and those six parts are the six faces of its die. This short tour shows you how to move around the game and start your first match.',
  },
  {
    title: 'Village',
    target: '.meta-tab[href="#/aldea"]',
    text: 'The Village is your home base. Your Axies work here to gather Wood, Stone and Food, shown at the top of the screen. Click an Axie or a building to see what is going on.',
  },
  {
    title: 'Lab',
    target: '.meta-tab[href="#/evolucion"]',
    text: 'In the Lab you spend Essence to EVOLVE a part (its die face is rewritten for good) and you can LOCK parts to take their faces out of the roll, so the faces you like come up more often.',
  },
  {
    title: 'PVE: the map of Lunacia',
    target: '.meta-tab[href="#/pve"]',
    text: 'Pick a region and a zone to fight starters and wild Axies. Every win gives Essence and unlocks the next zone. "Free match" starts a quick skirmish.',
  },
  {
    title: 'PVP: arenas',
    target: '.meta-tab[href="#/pvp"]',
    text: 'Duel AI-controlled rival teams. PVP matches have a 20-second turn clock and Sudden Death overtime, and every arena pays Essence.',
  },
  {
    title: 'Match',
    target: '.meta-tab[href="#/partida"]',
    text: 'This tab returns you to the match in progress. To start a new one, press "Free match" in PVE or "Challenge" in PVP. A second tutorial will explain the battle itself.',
  },
  {
    title: 'Music',
    target: '.music-toggle',
    text: 'Use the speaker button to mute or unmute the music. You can reopen this tour any time with the Tutorial button in the top bar.',
    action: { label: 'Start a match', route: 'pve' },
  },
]

export const MATCH_STEPS = [
  {
    title: 'Your goal',
    text: 'Destroy the enemy Lord before yours falls. A match lasts 8 rounds (one round = your turn + the enemy turn). If nobody falls, the Lord with more life left wins.',
  },
  {
    title: '1. Roll the dice',
    target: '.canvas-controls',
    text: 'Start every turn with "Roll dice". Each of your Axies lands on one face of its die, and that face is a real body part that decides what the Axie can do this turn.',
  },
  {
    title: 'Your Axies',
    target: '.roster-squad',
    text: 'Your squad is on the side panel. Hover an Axie to see all six of its parts, and select it to act. Guard and reposition faces give you +1 Energy when they come up.',
  },
  {
    title: '2. Select and move',
    target: '.board-col',
    text: 'Click one of your Axies: the tiles it can reach light up. Click a tile to move. Moving never spends the Axie\'s action, so position first, then strike. Drag the board to pan the camera and use the mouse wheel to zoom.',
  },
  {
    title: '3. Attack',
    target: '.action-pad',
    text: 'Click an enemy in range. Choose Basic (always available, class damage) or Special (the effect of the face you rolled). Hover an enemy to preview the exchange before you commit.',
  },
  {
    title: 'Affinity and critical hits',
    text: 'Beast beats Plant; Plant beats Aqua and Bird; Aqua and Bird beat Beast. An advantage deals x1.15 damage and a disadvantage x0.85. Every attack can also crit: chance and multiplier depend on the attacker\'s class.',
  },
  {
    title: 'Energy',
    target: '.energy-gauge',
    text: 'Energy builds up all match long (max 5). Spend 2 Energy for +10 damage on your next hit, or for +1 tile of movement. Saving up for a big turn is a real choice.',
  },
  {
    title: '4. Pass the turn',
    target: '.canvas-controls',
    text: 'When nothing useful is left, press "Pass turn". The enemy plays step by step, and the Axie that is acting glows. Counterattacks and terrain (slow zones, obstacles, water) also matter.',
  },
  {
    title: 'Help, Lords and PVP',
    text: 'Your Lord has its own die: attack, shield, mark, heal, buff and duplicate. Click the "?" at the top of the board for a quick rules reminder. In PVP you also have a 20-second turn clock, and after round 8 Sudden Death gives both sides +2 movement and +50% damage. Good luck!',
  },
]
