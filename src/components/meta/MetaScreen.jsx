// MetaScreen.jsx — shell comun de las pantallas meta (first-approach): una
// columna centrada con icono, titulo, resumen y contenido. Presentacional.
import { HpBar, ClassEmblem } from '../Emblems'
import { CLASS_STATS } from '../../axie'

export function StatChip({ label, value, title }) {
  return (
    <span className="stat-chip" title={title}>
      <b>{label}</b> {value}
    </span>
  )
}

export function MetaUnitRow({ u }) {
  const stats = CLASS_STATS[u.klass]
  return (
    <div className="meta-unit-row">
      <span className="meta-unit-emb" style={{ color: stats.color }}>
        <ClassEmblem klass={u.klass} />
      </span>
      <div className="meta-unit-info">
        <div className="meta-unit-name">
          <b>#{u.id.toUpperCase()}</b> {stats.label}
          <span className="meta-unit-stats">
            <StatChip label="MOV" value={stats.move} />
            <StatChip label="RNG" value={stats.range} />
          </span>
        </div>
        <HpBar hp={Math.max(u.hp, 0)} maxHp={u.maxHp} />
      </div>
    </div>
  )
}

export default function MetaScreen({ icon, title, blurb, children }) {
  return (
    <section className="meta-screen">
      <div className="meta-head">
        <span className="meta-icon" aria-hidden="true">
          {icon}
        </span>
        <div>
          <h2 className="meta-title">{title}</h2>
          <p className="meta-blurb">{blurb}</p>
        </div>
      </div>
      {children}
    </section>
  )
}