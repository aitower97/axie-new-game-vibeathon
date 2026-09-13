// ActionPad.jsx — HUD flotante sobre el tablero que sustituye a la card
// estatica bajo el canvas (reporte del usuario: "no sirve, sobra espacio").
//
// REDISENO 2026-09-11, "mover no gasta la accion + poder atacar eligiendo
// basico o especial": la cara ya tirada de la unidad seleccionada, la banca de
// Energia (A3, con sus dos gastos de 2 E) y el selector de ataque Basico /
// Especial -justo la decision que antes se tomaba solo (el click siempre usaba
// el basico si la cara era de guardia). Ahora se decide aqui de forma visible.
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
}) {
  const isLord = !!lordSelected
  if (!unitLabel && !isLord) return null

  let context = null
  if (isLord && activeLordRoll) {
    context = (
      <>
        <b>Lord {lordLabel}</b> · {activeLordRoll.name}
        {activeLordRoll.effect === 'lord-attack' && ' Ataque del Lord: toca a un objetivo a alcance 2.'}
        {activeLordRoll.effect === 'lord-shield' && ' Muro: toca a un aliado a alcance 3 para darle 30 de escudo.'}
        {activeLordRoll.effect === 'lord-mark' && ' Marca: toca a un enemigo a alcance 3 -el proximo ataque que le impacte hace +20.'}
        {activeLordRoll.effect === 'lord-heal' && ' Cura: toca a un aliado a alcance 3 para darle 15 de vida.'}
        {activeLordRoll.effect === 'lord-buff' && ' Templanza: toca a un aliado a alcance 3 -su proximo ataque hara +15.'}
        {activeLordRoll.effect === 'lord-clone' &&
          (nextReserveLabel
            ? ` Duplicar: toca a un aliado a alcance 3 para clonarlo, o una casilla libre junto al Lord para sacar a ${nextReserveLabel} de la reserva.`
            : ' Duplicar: toca a un aliado a alcance 3 para clonarlo (no queda reserva que sacar).')}
      </>
    )
  } else if (unitLabel && rolled) {
    context = (
      <>
        <b>{unitLabel}</b> · {rolled.slotLabel} ({rolled.name}) · {rolled.text}
        {isReposition && ' Puedes moverte tu, o tocar a un aliado adyacente para reposicionarlo.'}
        {moved && <em className="pad-moved-hint">Ya se movio: solo puede atacar.</em>}
      </>
    )
  }

  return (
    <div className="action-pad">
      <div className="action-pad-line">
        <span className="action-pad-context">{context ?? <span>&nbsp;</span>}</span>
        <span className={`energy-chip ${energyBank > 0 ? 'has-energy' : ''}`}>Energia {energyBank}/{energyCap}</span>
      </div>

      {!isLord && !isReposition && (
        <div className="action-pad-actions">
          <button
            type="button"
            className={`attack-mode-btn basic ${mode === 'basic' ? 'on' : ''}`}
            disabled={!hasBasic}
            onClick={() => onMode('basic')}
          >
            Básico
          </button>
          {rolled && (
            <button
              type="button"
              className={`attack-mode-btn special ${mode === 'special' ? 'on' : ''}`}
              disabled={!hasSpecial}
              onClick={() => onMode('special')}
            >
              Especial: {rolled.name}
            </button>
          )}
          {!canAct && <span className="pad-no-target">Sin objetivos al alcance.</span>}
          <span className="action-pad-spacer" />
          <button
            type="button"
            className={`boost-btn ${moveBoostArmed ? 'armed' : ''}`}
            disabled={!canMoveBoost}
            onClick={onToggleMoveBoost}
          >
            {moveBoostArmed ? '+1 casilla listo (2 E)' : 'Gastar 2 E: +1 casilla'}
          </button>
          <button
            type="button"
            className={`boost-btn ${boostArmed ? 'armed' : ''}`}
            disabled={!canBoost}
            onClick={onToggleBoost}
          >
            {boostArmed ? '+10 listo (2 E)' : 'Gastar 2 E: +10 al golpe'}
          </button>
        </div>
      )}
    </div>
  )
}