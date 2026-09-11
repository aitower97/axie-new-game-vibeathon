// ActionBar.jsx — las 3 franjas de contexto bajo el HUD: la cara ya tirada de
// la unidad seleccionada, la fase de remate ("primer contacto"), o la cara del
// Lord activo. Todos los valores llegan ya resueltos a texto (nada de
// SLOT_LABEL_MVP1/CLASS_STATS/labelOf/sideLabel aqui) para que este componente
// no necesite importar datos de partida, solo pintar lo que le pasan.
// Tambien pinta la banca de Energia (A3) y la preview del intercambio (A2.3).
//
// Altura CONSTANTE en todos los estados (bug real 2026-09-11): antes cada rama
// devolvia un bloque de altura distinta y hasta null cuando no habia nada que
// mostrar. `.board-col` reparte el hueco sobrante hacia `.board3d-host`, asi
// que cada cambio de seleccion re-encuadraba la camara (ResizeObserver) y el
// tablero hacia "zoom hacia atras" al pulsar un axie. Ahora si se dibuja
// siempre la misma estructura (linea de contexto + caja fija de 3 renglones de
// intercambio); solo cambia el TEXTO, nunca la altura.
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
  let context = null
  if (selectedUnitLabel && selectedRoll && !isBonusPhase) {
    context = (
      <>
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
      </>
    )
  } else if (isBonusPhase) {
    context = (
      <>
        <b>{selectedUnitLabel}</b> · Primer contacto: puede rematar con un ataque basico.
        {bonusTargetsCount > 0
          ? ' Toca a un objetivo, o a otra casilla para no atacar.'
          : ' (sin objetivo valido ya, se pierde el remate).'}
      </>
    )
  } else if (lordSelected && activeLordRoll) {
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
  }

  const hasExchange = !!exchangeInfo && exchangeInfo.length > 0
  return (
    <div className="action-bar">
      <div className="action-bar-line">{context ?? <span>&nbsp;</span>}</div>
      <div className={`exchange-preview ${hasExchange ? '' : 'exchange-preview-empty'}`}>
        {hasExchange ? (
          exchangeInfo.map((line, i) => <div key={i}>{line}</div>)
        ) : (
          <>
            <div>&nbsp;</div>
            <div>&nbsp;</div>
            <div>&nbsp;</div>
          </>
        )}
      </div>
    </div>
  )
}