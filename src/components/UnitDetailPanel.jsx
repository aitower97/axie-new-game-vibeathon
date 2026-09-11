// UnitDetailPanel.jsx — panel COMPARTIDO debajo de las 3 cartas mini de un
// bando (pedido explicito 2026-09-10, "hacer una carta mas pequena... y
// cuando me ponga encima o cuando este seleccionando se despliega el detalle
// de las partes"): las 3 cartas se quedaron solo con retrato+stats+HP+cubo
// (UnitCard.jsx), y el detalle en texto de las 6 ranuras (antes apretado
// dentro de cada carta a 66px de ancho) vive aqui, con todo el ancho de la
// columna disponible -mismas clases base .die-list/.face-card que ya usaba
// la carta del Lord (lord-die-list), sin los recortes de `.card.mini`. Cada
// fila es FaceRow.jsx, compartida con el pie de la carta compacta.
import { CLASS_STATS, DIE_SLOTS } from '../axie'
import { ClassEmblem } from './Emblems'
import FaceRow from './FaceRow'

export default function UnitDetailPanel({ unit, rolledFace, rollTick }) {
  if (!unit) {
    return (
      <div className="unit-detail-panel empty">
        <p className="hint">Pasa el cursor o selecciona un Axie para ver el detalle de sus partes.</p>
      </div>
    )
  }

  const stats = CLASS_STATS[unit.klass]
  return (
    <div className="unit-detail-panel">
      <div className="detail-panel-head">
        <span className="card-insignia" style={{ color: stats.color }}>
          <ClassEmblem klass={unit.klass} />
        </span>
        <strong>#{unit.id.toUpperCase()}</strong>
        <span>{stats.label}</span>
      </div>
      <div className="die-list">
        {DIE_SLOTS.map((slot, idx) => {
          const face = unit.die.find((f) => f.slot === slot)
          const active = face && rolledFace && rolledFace.id === face.id
          return (
            <FaceRow
              key={active ? `${face.id}-${rollTick}` : (face?.id ?? slot)}
              slot={slot}
              face={face}
              active={active}
              idx={idx}
            />
          )
        })}
      </div>
    </div>
  )
}
