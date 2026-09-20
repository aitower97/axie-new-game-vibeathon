// FaceRow.jsx — una fila de "cara del dado" (icono de la parte + nombre +
// efecto, con tooltip al pasar el cursor). Extraida de UnitDetailPanel.jsx
// para reutilizarla tal cual en dos sitios: el panel de detalle compartido
// (las 6 ranuras) y el pie de la carta compacta (SOLO la ranura que salio en
// la tirada). El `key` de remount-por-tirada se pone en el call site
// (no aqui dentro), porque solo tiene sentido en el punto donde React
// necesita distinguir instancias.
import { faceValue, SLOT_LABEL_MVP1 } from '../axie'
import { EFFECT_GLYPH } from '../gameConstants'
import { PartLogo } from './Emblems'

export default function FaceRow({ slot, face, active, idx }) {
  const style = idx != null ? { '--i': idx } : undefined
  if (!face) {
    return (
      <div className="face-card empty" style={style}>
        <PartLogo slot={slot} />
        <div className="face-info">
          <span className="face-part">No card</span>
          <span className="face-effect">—</span>
        </div>
        <div className="part-tip">
          <b>{SLOT_LABEL_MVP1[slot]}</b>
          Not available in MVP1: this slot is not rolled when the dice is thrown.
        </div>
      </div>
    )
  }
  return (
    <div className={`face-card ${active ? 'active' : ''}`} style={style}>
      <PartLogo slot={slot} />
      <div className="face-info">
        <span className="face-part">{face.name}</span>
        <span className="face-effect">
          <span className="face-glyph">{EFFECT_GLYPH[face.effect]}</span>
          {faceValue(face) != null ? faceValue(face) : '—'}
        </span>
      </div>
      <div className="part-tip">
        <b>{face.name} · {SLOT_LABEL_MVP1[face.slot]}</b>
        <span>{face.text}</span>
        {face.affinity && face.value != null && (
          <em className="tip-affinity">
            ★ Class affinity: {face.value} base + 10 = {face.value + 10}
          </em>
        )}
      </div>
    </div>
  )
}
