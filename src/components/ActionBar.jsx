// ActionBar.jsx — las 3 franjas de contexto bajo el HUD: la cara ya tirada de
// la unidad seleccionada, la fase de remate ("primer contacto"), o la cara del
// Lord activo. Todos los valores llegan ya resueltos a texto (nada de
// SLOT_LABEL_MVP1/CLASS_STATS/labelOf/sideLabel aqui) para que este componente
// no necesite importar datos de partida, solo pintar lo que le pasan.
// Tambien pinta la banca de Energia (A3) y la preview del intercambio (A2.3).
export default function ActionBar({
  selectedUnitLabel,
  selectedRoll,
  isReposition,
  isBonusPhase,
  bonusTargetsCount,
  lordSelected,
  lordLabel,
  activeLordRoll,
  nextReserveLabel,
  exchangeInfo,
  energyBank,
  energyCap,
  boostArmed,
  canBoost,
  onToggleBoost,
  moveBoostArmed,
  canMoveBoost,
  onToggleMoveBoost,
}) {
  if (selectedUnitLabel && selectedRoll && !isBonusPhase) {
    return (
      <div className="action-bar">
        <div className="action-bar-line">
          <b>{selectedUnitLabel}</b> · {selectedRoll.slotLabel} ({selectedRoll.name}) ·{' '}
          {selectedRoll.text}
          {isReposition && ' Toca a un aliado adyacente.'}
          <span className={`energy-chip ${energyBank > 0 ? 'has-energy' : ''}`}>Energia {energyBank}/{energyCap}</span>
          {!isReposition && (
            <button
              type="button"
              className={`boost-btn ${moveBoostArmed ? 'armed' : ''}`}
              disabled={!canMoveBoost}
              onClick={onToggleMoveBoost}
            >
              {moveBoostArmed ? '+1 casilla listo (2 E)' : 'Gastar 2 E: +1 casilla'}
            </button>
          )}
          <button
            type="button"
            className={`boost-btn ${boostArmed ? 'armed' : ''}`}
            disabled={!canBoost}
            onClick={onToggleBoost}
          >
            {boostArmed ? '+10 listo (2 E)' : 'Gastar 2 E: +10 al golpe'}
          </button>
        </div>
        {exchangeInfo && exchangeInfo.length > 0 ? (
          <div className="exchange-preview">
            {exchangeInfo.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        ) : (
          // Hueco pre-reservado (hasta 3 lineas): sin el, la aparicion del
          // desglose al pasar el cursor hacia mas alto el ActionBar, el layout
          // empujaba el tablero y el ResizeObserver de Board3D re-encuadraba la
          // camara -> flicker de zoom dentro del propio hover (bug real,
          // 2026-09-11, mensura con CDP: host oscilaba 433<->484 px y la matriz
          // CSS cambiaba con el). Con el hueco fijo el tablero no se mueve y el
          // cursor no salta de celda en la misma pasada.
          <div className="exchange-preview exchange-preview-empty">
            <div>&nbsp;</div>
            <div>&nbsp;</div>
            <div>&nbsp;</div>
          </div>
        )}
      </div>
    )
  }

  if (isBonusPhase) {
    return (
      <div className="action-bar">
        <b>{selectedUnitLabel}</b> · Primer contacto: puede rematar con un ataque basico.
        {bonusTargetsCount > 0
          ? ' Toca a un objetivo, o a otra casilla para no atacar.'
          : ' (sin objetivo valido ya, se pierde el remate).'}
      </div>
    )
  }

  if (lordSelected && activeLordRoll) {
    return (
      <div className="action-bar">
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
      </div>
    )
  }

  return null
}
