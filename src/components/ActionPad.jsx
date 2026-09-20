// ActionPad.jsx — HUD flotante sobre el tablero que sustituye a la card
// estatica bajo el canvas, que dejaba sobrar espacio.
//
// Muestra la cara ya tirada de la unidad seleccionada, la banca de Energia
// (A3, con sus dos gastos de 2 E) y el selector de ataque Basico / Especial
// -la decision de que ataque usar se toma aqui de forma visible, nunca de
// forma implicita.
//
// Es 100% posicion flotante (position:absolute sobre .board-col): NO consume
// espacio de layout, asi que el tablero 3D nunca re-encuadra por su altura
// (el bug de zoom del ActionBar de abajo queda eliminado de raiz).
export default function ActionPad({
  unitLabel,
  rolled,
  isReposition,
  moved,
  canAct,
  hasSpecial,
  hasBasic,
  mode,
  onMode,
  lordSelected,
  lordLabel,
  activeLordRoll,
  nextReserveLabel,
  energyBank,
  energyCap,
  boostArmed,
  canBoost,
  onToggleBoost,
  moveBoostArmed,
  canMoveBoost,
  onToggleMoveBoost,
  exchangeAffinity,
  exchangeCrit,
  overtime,
}) {
  const isLord = !!lordSelected
  if (!unitLabel && !isLord) return null

  let context = null
  if (isLord && activeLordRoll) {
    context = (
      <>
        <b>Lord {lordLabel}</b> · {activeLordRoll.name}
        {activeLordRoll.effect === 'lord-attack' && ' Lord Attack: tap a target within range 2.'}
        {activeLordRoll.effect === 'lord-shield' && ' Wall: tap an ally within range 3 to give it 30 shield.'}
        {activeLordRoll.effect === 'lord-mark' && ' Mark: tap an enemy within range 3 - the next attack that hits it deals +20.'}
        {activeLordRoll.effect === 'lord-heal' && ' Heal: tap an ally within range 3 to give it 15 HP.'}
        {activeLordRoll.effect === 'lord-buff' && ' Temperance: tap an ally within range 3 - its next attack will deal +15.'}
        {activeLordRoll.effect === 'lord-clone' &&
          (nextReserveLabel
            ? ` Duplicate: tap an ally within range 3 to clone it, or a free tile next to the Lord to bring ${nextReserveLabel} out of reserve.`
            : ' Duplicate: tap an ally within range 3 to clone it (no reserve left to bring out).')}
      </>
    )
  } else if (unitLabel && rolled) {
    context = (
      <>
        <b>{unitLabel}</b> · {rolled.slotLabel} ({rolled.name}) · {rolled.text}
        {isReposition && ' You can move yourself, or tap an adjacent ally to reposition it.'}
        {moved && <em className="pad-moved-hint">Already moved: it can only attack.</em>}
      </>
    )
  }

  return (
    <div className="action-pad">
      <div className="action-pad-line">
        <span className="action-pad-context">{context ?? <span>&nbsp;</span>}</span>
        <span className={`energy-chip ${energyBank > 0 ? 'has-energy' : ''}`}>Energy {energyBank}/{energyCap}</span>
      </div>

      {!isLord && (
        <div className="action-pad-line action-pad-odds">
          {/* Afinidad (x1.15/x0.85 por clases) y critico genetico de la
              preview del objetivo bajo el cursor. Solo se muestran cuando hay un
              intercambio calculandose (exchangeAffinity/exchangeCrit llegan de
              describeExchange via App.jsx). */}
          {exchangeAffinity != null && (
            <span className={`odds-chip affinity ${exchangeAffinity > 1 ? 'up' : exchangeAffinity < 1 ? 'down' : ''}`}>
              {exchangeAffinity > 1 ? `Affinity x${exchangeAffinity}` : exchangeAffinity < 1 ? `Weak x${exchangeAffinity}` : 'Neutral affinity'}
            </span>
          )}
          {exchangeCrit && exchangeCrit.rate > 0 && (
            <span className="odds-chip crit">Critical {Math.round(exchangeCrit.rate)}% x{exchangeCrit.dmg}</span>
          )}
          {overtime && <span className="odds-chip overtime">Sudden Death: +2 tiles, +50% damage</span>}
        </div>
      )}

      {!isLord && !isReposition && (
        <div className="action-pad-actions">
          <button
            type="button"
            className={`attack-mode-btn basic ${mode === 'basic' ? 'on' : ''}`}
            disabled={!hasBasic}
            onClick={() => onMode('basic')}
          >
            Basic
          </button>
          {rolled && (
            <button
              type="button"
              className={`attack-mode-btn special ${mode === 'special' ? 'on' : ''}`}
              disabled={!hasSpecial}
              onClick={() => onMode('special')}
            >
              Special: {rolled.name}
            </button>
          )}
          {!canAct && <span className="pad-no-target">No targets in range.</span>}
          <span className="action-pad-spacer" />
          <button
            type="button"
            className={`boost-btn ${moveBoostArmed ? 'armed' : ''}`}
            disabled={!canMoveBoost}
            onClick={onToggleMoveBoost}
          >
            {moveBoostArmed ? '+1 tile ready (2 E)' : 'Spend 2 E: +1 tile'}
          </button>
          <button
            type="button"
            className={`boost-btn ${boostArmed ? 'armed' : ''}`}
            disabled={!canBoost}
            onClick={onToggleBoost}
          >
            {boostArmed ? '+10 ready (2 E)' : 'Spend 2 E: +10 to the hit'}
          </button>
        </div>
      )}
    </div>
  )
}