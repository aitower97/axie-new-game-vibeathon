// HelpOverlay.jsx — ayuda real al hacer clic en el signo de interrogación del tablero: la
// burbuja de hover no bastaba, el clic abre un panel con lo minimo
// para jugar: objetivo, rondas, turno, energia y controles. UI local de
// BoardRegion (estado propio), no toca el estado de partida.
export default function HelpOverlay({ onClose }) {
  return (
    <div className="help-backdrop" onClick={onClose}>
      <div className="help-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="How to play">
        <button type="button" className="help-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="help-title">How to play</h2>

        <section className="help-block">
          <h3>Goal</h3>
          <p>
            Lead your Axies to the <b>enemy Lord</b> and bring its HP to 0 before the enemy Lord
            finishes yours.
          </p>
        </section>

        <section className="help-block">
          <h3>Rounds</h3>
          <p>
            A match lasts <b>8 rounds</b>. One round = your turn + the enemy's turn. If neither Lord
            has fallen by round 8, whoever has more Lord HP wins.
          </p>
        </section>

        <section className="help-block">
          <h3>Your turn</h3>
          <p>
            Roll your dice: each Axie lands on the face of one of its <b>body parts</b>. Use that face
            (or the free <b>Basic</b> attack) to attack, move, guard... The enemy plays its turn
            right after yours.
          </p>
        </section>

        <section className="help-block">
          <h3>Energy</h3>
          <p>
            Every <b>non-strike face</b> you land on when rolling (guard or reposition) gives you <b>+1
            Energy</b>. The bank <b>persists the whole match</b> (cap 5): save it or spend it, within
            the 8 rounds it is a real decision. Uses: <b>+10 to the next hit</b> (2 E) or <b>+1
            movement tile</b> (2 E), right before using the ability in the selected Axie's
            panel.
          </p>
        </section>

        <section className="help-block">
          <h3>Controls</h3>
          <p>
            Drag the board to move the view · scroll wheel to zoom · press <b>R</b> to
            re-center the camera.
          </p>
        </section>

        <section className="help-block help-credits">
          <h3>Music</h3>
          <p className="help-credits-line">
            Tracks by <b>Kevin MacLeod</b> (incompetech.com), licensed <b>CC-BY 4.0</b> · Effects
            from the <b>Kenney</b> kit (CC0). Mute and unmute with the 🔊 button in the
            top bar. Full list and credits in <code>public/music/README.md</code>.
          </p>
        </section>
      </div>
    </div>
  )
}
