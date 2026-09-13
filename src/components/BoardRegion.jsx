// BoardRegion.jsx — la escena 3D del tablero (Board3D) mas la leyenda de
// terreno y el overlay interactivo de React alineado por matriz CSS. Es la
// unica region que no se atomiza mas: toca casi todo el estado de partida
// (unidades, Lords, seleccion, objetivos resaltados), asi que partirla en
// piezas mas pequenas solo multiplicaria el prop-drilling sin beneficio real.
import { useCallback, useRef, useState } from 'react'
import Board3D from '../Board3D'
import EnergyGauge from './EnergyGauge'
import HelpOverlay from './HelpOverlay'
import { HpBar, ShieldBar, ClassEmblem, CrownEmblem } from './Emblems'
import { LORD_STATS } from '../axie'
import { ROWS, COLS, PLAYER_LORD, ENEMY_LORD, CELL_SIZE, LORD_GLYPH } from '../gameConstants'

export default function BoardRegion({ board3d, overlay }) {
  const {
    blockUrl, terrainAt, terrainBlockUrls, decorUrls, axieUnits, fx, onReady,
  } = board3d
  const {
    visible, units, lords, activeSide, selected, lordSelected,
    moveCells, targets, allyChoices, lordSummonCells, lordRoll, lordActed,
    playerLordHp, enemyLordHp, rollTick, floats, impacts,
    enemyActing,
    energyBank, enemyEnergyBank, energyCap, exchangeInfo, onCellClick, onCellHover,
  } = overlay

  // Ref sobre la que Board3D escribe DIRECTAMENTE la matriz 3D->DOM (CSS
  // transform) sin pasar por estado de React (REDISENO 2026-09-11): asi el
  // overlay esta siempre alineado y App deja de guardar board3dMatrix/onTransform.
  const overlayElRef = useRef(null)

  // Panel de ayuda (pedido 2026-09-12, "pinchas la mano y no pasa nada"): el
  // clic en la mano lo abre. Estado LOCAL de UI, igual que hoveredId en
  // Roster.jsx -no es estado de partida, no vive en App.jsx.
  const [showHelp, setShowHelp] = useState(false)

  // Alineacion del marcador con el Axie durante el tween (T1): Board3D emite
  // por frame el desplazamiento fraccional respecto a la casilla destino
  // (publishUnitMove). Se aplica como translate() directo al nodo DOM del
  // marcador -sin re-render de React-, conservando el centrado translateX(-50%)
  // que trae de CSS, y se limpia con `done`.
  const unitNodes = useRef(new Map())
  const setUnitNode = useCallback((id) => (el) => {
    if (el) unitNodes.current.set(id, el)
    else unitNodes.current.delete(id)
  }, [])
  const handleUnitTween = useCallback((ev) => {
    const node = unitNodes.current.get(ev.id)
    if (!node) return
    node.style.transform = ev.done ? '' : `translate(${ev.dx}px, ${ev.dy}px) translateX(-50%)`
  }, [])

  return (
    <>
      <div className={`board-scene ${impacts.length > 0 ? 'board-shake' : ''}`}>
        {/* Dos medidores, cada uno en SU lado (pedido 2026-09-11, "la mia a
            mi lado y la suya al suyo"): el propio arriba a la IZQUIERDA
            (lado de "TU MANDO" en el layout de dos columnas), el del rival
            arriba a la DERECHA (lado de "ASEDIANTES"), en rojo -mismo color
            de acento que el resto de la UI del bando enemigo
            (.unit.enemy/.roster-title.enemy). Arriba y no abajo: abajo esta
            el ActionPad (seleccion de ataque basico/especial), que no puede
            compartir hueco -reportado explicitamente ("abajo no puede estar
            porque esta lo de seleccionar las habilidades especiales"). */}
        <EnergyGauge bank={energyBank} cap={energyCap} />
        <EnergyGauge bank={enemyEnergyBank} cap={energyCap} side="enemy" label="Energía rival" />
        <div className="board3d-host">
          <Board3D
            rows={ROWS}
            cols={COLS}
            blockUrl={blockUrl}
            cellSizePx={CELL_SIZE}
            overlayElRef={overlayElRef}
            onReady={onReady}
            terrainAt={terrainAt}
            terrainBlockUrls={terrainBlockUrls}
            decorUrls={decorUrls}
            axieUnits={axieUnits}
            fx={fx}
            onTween={handleUnitTween}
          />
          {/* Reducido a icono (pedido 2026-09-11, "lo de la vision se puede
              poner como un icono, cuidado con ponerlo muy arriba"): antes era
              una franja de texto arriba a la izquierda, justo donde ahora va
              el medidor de Energia propio. El texto completo NO va en
              `title` (bug real reportado justo despues, "pinchas la mano o
              te pones encima y no pasa nada": el tooltip nativo del
              navegador tarda 1-1.5s en aparecer y solo si el raton se queda
              quieto del todo, asi que en la practica parecia que el icono no
              hacia nada) -va como burbuja CSS propia (`.board-view-hint
              .tip`), visible al instante con `:hover`, sin depender del
              tooltip del sistema operativo. Y ademas (pedido 2026-09-12) el
              CLIC abre el panel de ayuda real HelpOverlay: hover informa,
              clic explica. */}
          <div className="board-view-hint" onClick={() => setShowHelp(true)}>
            🖐️
            <span className="tip">Clic para ver como jugar · Arrastra para mover · rueda para zoom · R para centrar</span>
          </div>
          {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
          {visible && (
            <div className="board-overlay-3d" ref={overlayElRef}>
              {Array.from({ length: ROWS }).map((_, r) =>
                Array.from({ length: COLS }).map((_, c) => {
                  const isPLord = r === PLAYER_LORD.r && c === PLAYER_LORD.c
                  const isELord = r === ENEMY_LORD.r && c === ENEMY_LORD.c
                  const unit = units.find((u) => u.alive && u.pos && u.pos.r === r && u.pos.c === c)
                  const canMoveHere = moveCells.some((cell) => cell.r === r && cell.c === c) || lordSummonCells.some((cell) => cell.r === r && cell.c === c)
                  const canAttackHere = targets.some((t) => t.pos.r === r && t.pos.c === c)
                  const canReposHere = allyChoices.some((a) => a.pos.r === r && a.pos.c === c)
                  const isSelected = (unit && selected === unit.id) || (lordSelected && r === lords[activeSide].r && c === lords[activeSide].c)
                  return (
                    <div
                      key={`${r}-${c}`}
                      data-r={r}
                      data-c={c}
                      className={[
                        'cell3d',
                        // El tinte de fondo por terreno (TERRAIN_CLASS) ya NO se
                        // aplica aqui: era un rectangulo plano compitiendo con la
                        // roca/laguna/tierra 3D real que ya esta debajo -un
                        // rectangulo nunca calza con una forma irregular (la
                        // laguna es redonda), asi que siempre se veia "descuadrado".
                        // Se queda solo para la leyenda (terrain-swatch, mas abajo).
                        canMoveHere || canReposHere ? 'summon-zone' : '',
                        canAttackHere ? 'in-range' : '',
                        isSelected ? 'selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={{
                        left: c * CELL_SIZE,
                        top: r * CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                      }}
                      onClick={() => onCellClick(r, c)}
                      onMouseEnter={() => onCellHover({ r, c })}
                      onMouseLeave={() => onCellHover(null)}
                    >
                      {isPLord && (
                        <div className={`lord-unit own-lord ${lordActed.player ? 'spent' : ''}`}>
                          <CrownEmblem />
                          <HpBar hp={playerLordHp} maxHp={LORD_STATS.hp} />
                          {activeSide === 'player' && lordRoll.player && (
                            <em key={rollTick} className="lord-glyph">{LORD_GLYPH[lordRoll.player.effect]}</em>
                          )}
                        </div>
                      )}
                      {isELord && (
                        <div className={`lord-unit enemy-lord ${lordActed.enemy ? 'spent' : ''} ${enemyActing === 'lord-enemy' ? 'acting' : ''}`}>
                          <CrownEmblem />
                          <HpBar hp={enemyLordHp} maxHp={LORD_STATS.hp} />
                          {activeSide === 'enemy' && lordRoll.enemy && (
                            <em className="lord-glyph">{LORD_GLYPH[lordRoll.enemy.effect]}</em>
                          )}
                        </div>
                      )}
                      {unit && (
                        <div
                          data-unit-id={unit.id}
                          ref={setUnitNode(unit.id)}
                          className={`unit ${unit.side === 'player' ? 'own' : 'enemy'} ${unit.acted ? 'spent' : ''} ${unit.marked ? 'marked' : ''} ${unit.buffed ? 'buffed' : ''} ${unit.broken ? 'broken' : ''} ${enemyActing === unit.id ? 'acting' : ''}`}
                        >
                          <span className="unit-medallion">
                            <ClassEmblem klass={unit.klass} />
                          </span>
                          <HpBar hp={unit.hp} maxHp={unit.maxHp} />
                          {unit.shield > 0 && <ShieldBar />}
                          {unit.broken && <span className="unit-broken" title="Rotura: no puede contraatacar">Rotura</span>}
                          {selected === unit.id && energyBank > 0 && (
                            <span className="unit-energy" title="Banca de Energia persistente: caras sin golpe de tu tirada dan +1">⚡{energyBank}/{energyCap}</span>
                          )}
                        </div>
                      )}
                      {floats
                        .filter((f) => f.r === r && f.c === c)
                        .map((f) => (
                          <span key={f.id} className={`combat-float variant-${f.variant}`}>
                            {f.text}
                          </span>
                        ))}
                      {impacts
                        .filter((i) => i.r === r && i.c === c)
                        .map((i) => (
                          <span key={i.id} className={`impact-ring kind-${i.kind}`} />
                        ))}
                      {exchangeInfo && exchangeInfo.cell.r === r && exchangeInfo.cell.c === c && (
                        <div className="exchange-preview-chip">
                          {exchangeInfo.lines.map((line, i) => (
                            <div key={i}>{line}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
