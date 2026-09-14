// Emblems.jsx — iconos/barras pequenos y sin estado que usan las cartas y el
// overlay del tablero. Ninguno depende de estado de partida (solo de props),
// movidos tal cual desde App.jsx.
import { SLOT_ICON_URL } from '../slotIcons'
import { SLOT_LABEL_MVP1 } from '../axie'

// Barra de HP con semaforo: verde entera, naranja por debajo de la mitad,
// roja por debajo del 25% -sustituye al numero suelto que habia antes en el
// overlay del tablero. Corazon a la izquierda, mismo patron que el escudo de
// abajo (icono + barra). En las
// cartas del dashboard se pasa showValue para que ademas se lean los numeros
// del momento de la batalla (hp actual / vida maxima).
export function HpBar({ hp, maxHp, showValue }) {
  const ratio = maxHp > 0 ? Math.max(0, hp) / maxHp : 0
  const tone = ratio > 0.5 ? 'good' : ratio > 0.25 ? 'mid' : 'low'
  return (
    <div className={`stat-row hp-row ${showValue ? 'with-value' : ''}`}>
      <HeartEmblem />
      <div className="hp-bar">
        <div className={`hp-bar-fill ${tone}`} style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }} />
      </div>
      {showValue && <span className="stat-value">{Math.max(0, hp)}/{maxHp}</span>}
    </div>
  )
}

// Barra de escudo (mismo patron que la de HP): azul, debajo
// de la vida, icono de escudo a la izquierda. El escudo no tiene un tope
// maximo real en las reglas del MVP1 (lo dan varias caras con valores
// distintos segun nivel) -en vez de inventarme un maximo para calcular un
// porcentaje, la barra va llena mientras el escudo este activo (>0), como un
// indicador de estado, no de cantidad exacta. En la carta del dashboard el
// valor numerico si se lee al lado (los datos del momento de la batalla).
export function ShieldBar({ value }) {
  return (
    <div className="stat-row shield-row">
      <ShieldEmblem />
      <div className="hp-bar shield-bar">
        <div className="hp-bar-fill shield-fill" style={{ width: '100%' }} />
      </div>
      {value > 0 && <span className="stat-value">{value}</span>}
    </div>
  )
}

// Emblema 2D por clase para el overlay del tablero. No hay ningun set de iconos de clase real de
// Axie en los recursos que tenemos localmente (ni en @axieinfinity/mixer, que
// solo trae datos de genes en JSON, ni en el pack del mixer 3D, que solo trae
// modelos/texturas 3D) -son iconos propios, sencillos y tematicos por clase,
// no arte de Axie real.
const CLASS_EMBLEM = {
  beast: (
    <>
      <ellipse cx="12" cy="15.5" rx="6" ry="5" />
      <circle cx="5.5" cy="7.5" r="2.3" />
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="18.5" cy="7.5" r="2.3" />
    </>
  ),
  aqua: <path d="M12 2C12 2 4.5 12 4.5 17a7.5 7.5 0 0 0 15 0C19.5 12 12 2 12 2Z" />,
  bird: <path d="M2 20C2 20 5 5 22 2C22 2 17 11 9 14C9 14 13.5 15.5 18 13C13.5 20 5.5 22 2 20Z" />,
  plant: <path d="M12 2C4.5 3.5 3 11 6 17C8 21 12 22 12 22C12 22 20 18.5 20 10.5C20 5.5 16.5 3 12 2Z" />,
}
export function ClassEmblem({ klass }) {
  const shape = CLASS_EMBLEM[klass]
  if (!shape) return null
  return (
    <svg className="class-emblem" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      {shape}
    </svg>
  )
}

// Emblema de corona para el Lord, mismo espiritu que ClassEmblem: icono
// propio simple, no arte de Axie real.
export function CrownEmblem() {
  return (
    <svg className="class-emblem crown-emblem" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M3 8l4 3 5-6 5 6 4-3-1.5 10h-15L3 8Z" />
    </svg>
  )
}

// Icono de escudo sin numero (nada de numeros sueltos en el overlay) -solo
// indica "esta unidad tiene escudo activo ahora mismo".
export function ShieldEmblem() {
  return (
    <svg className="stat-emblem shield-emblem" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
      <path d="M12 2 4 5v6c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V5l-8-3Z" />
    </svg>
  )
}

// Pictograma de la ranura: el emblema OFICIAL de Axie para esa ranura (ver
// slotIcons.js) -el mismo para boca, cuerno, etc. sea cual sea el Axie o la
// parte concreta. El PNG del marketplace es gris metalico CON degradado real
// (borde oscuro ~53,53,48, relieve claro ~140-158): un mask-image + relleno
// plano aplanaria borde y relieve al MISMO tono y la forma desapareceria;
// aqui se usa un filtro CSS (mismo que Die3D.jsx en canvas, ver ICON_FILTER)
// que solo cambia el tono, conservando el claroscuro original.
export function PartLogo({ slot }) {
  const url = SLOT_ICON_URL[slot]
  return <img className="face-logo" src={url} alt={SLOT_LABEL_MVP1[slot]} draggable={false} />
}

// Corazon junto a la barra de HP.
export function HeartEmblem() {
  return (
    <svg className="stat-emblem heart-emblem" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
      <path d="M12 21S3.5 15.9 3.5 9.8C3.5 6.6 6 4.5 8.7 4.5c1.5 0 2.9.7 3.3 1.8.4-1.1 1.8-1.8 3.3-1.8 2.7 0 5.2 2.1 5.2 5.3 0 6.1-8.5 11.2-8.5 11.2Z" />
    </svg>
  )
}
