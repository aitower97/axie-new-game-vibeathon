// CoverScreen.jsx — portada del juego (sesion 2026-09-14, "que tenga vibras
// axie y que tenga una portada"; retocada la MISMA sesion tras feedback
// directo: "quitemos las cards redondas con colores transparentes tipicas de
// diseño de claude" + "los emojis en colores los evitaria, los haria con
// lineas finas y con un color acorde" + nombre nuevo relacionado con dados y
// tactica + mensaje centrado en el bucle evolucion-Axie/evolucion-dado).
// Segunda pasada, mismo dia, sobre el tratamiento del titulo: el usuario dejo
// dos capturas reales del logo oficial de Axie en /titulo (letra burbuja
// gruesa, contorno solido, relleno a cuadros, zarcillos pastel alrededor, y
// una cinta de color debajo con el descriptor) -el logotipo se rehizo para
// seguir ese lenguaje, solo con CSS/SVG inline (sin imagenes nuevas). De
// paso, la auditoria de esta pantalla encontro que `.cover-kicker` (el
// credito "Axie Vibeathon Ronda 1" en versalitas sobre una pildora) era
// exactamente el "eyebrow en versalitas sobre el titulo" de la lista de
// tells genericos -y que la linea "Axie" que colgaba encima del titulo
// repetia el MISMO patron. Las dos se quitaron: el credito paso a ser una
// linea de nota al pie del bloque de texto (sin pildora, sin versalitas, sin
// letter-spacing), y la palabra "Axie" suelta se elimino del logotipo.
//
// TERCERA pasada, mismo dia: nombre del juego a ingles ("yo lo llamaria
// Tactic Dice") + logo como ARCHIVO real reutilizable fuera de la app
// ("crearia un png o algo con fondo transparente que luego se pueda meter en
// cualquier parte") -se opto por SVG (mismo resultado, vectorial, sin
// perdida de calidad). El bloque de texto del logotipo (`.cover-title-*`,
// letra burbuja via CSS text-stroke/background-clip) se sustituyo por
// `public/brand/logo.svg` (lockup "AXIE INFINITY" + cinta "TACTIC DICE",
// mismas letras propias dibujadas como paths, mismo lenguaje visual) cargado
// como `<img>` -asi el archivo sirve igual para el README o el thumbnail del
// Vibeathon sin depender de React/CSS. Los zarcillos y la cinta ya viven
// DENTRO del SVG, asi que `VineIcon`/`cover-title-ribbon` salieron de aqui.
// Primera pantalla que ve cualquiera (DEFAULT_ROUTE='portada' en routes.js):
// el pitch, el Lord y el roster en 3D real (mismo mixer/descriptores que el
// HUB y el tablero, cero assets nuevos) y dos puertas de entrada.
// Presentacional puro: no toca estado de partida, solo recibe `onEnter` (ir
// al HUB) y `onPlay` (partida libre directa).
import Portrait3D from '../../Portrait3D'
import { AXIE_SAMPLE_GENES } from '../../Board3D'
import { LORD_DESCRIPTORS, ROSTER_DESCRIPTORS } from '../../axieGeneCatalog'
import { CLASS_STATS } from '../../axie'
import { ClassEmblem } from '../Emblems'
import { DiceIcon, BoltIcon, DnaIcon, SwordIcon, TrophyIcon } from '../LineIcons'

// Solo las 3 clases que el roster jugable usa de verdad (Plant queda fuera
// del MVP1, es referencia -ver axieGeneCatalog.js).
const SHOWCASE_KLASSES = ['beast', 'bird', 'aqua']

const STEPS = [
  { Icon: DiceIcon, title: 'Tira el dado', text: 'Cada cara es una parte real del cuerpo de tu Axie: cuerno, boca, lomo, cola.' },
  { Icon: BoltIcon, title: 'Juega la cara que sale', text: 'Mover nunca gasta el turno; la cara tirada decide con que golpeas o te repones.' },
  { Icon: DnaIcon, title: 'Evoluciona una parte', text: 'Mejora los genes de una parte y esa cara del dado se reescribe para siempre.' },
]

export default function CoverScreen({ onEnter, onPlay }) {
  return (
    <section className="cover-screen">
      <div className="cover-hero">
        <h1 className="cover-logo">
          <img
            src="/brand/logo.svg"
            alt="Axie Infinity — Tactic Dice"
            className="cover-logo-img"
            width={460}
            height={260}
          />
        </h1>
        <p className="cover-pitch">
          Evoluciona tus Axies y evoluciona tu dado. A medida que mejoras los genes de sus
          partes desbloqueas mejoras en el dado: caras nuevas y la opcion de bloquear las que
          ya tienes.
        </p>

        <div className="cover-classes">
          {SHOWCASE_KLASSES.map((k) => (
            <span key={k} className="cover-class-chip" style={{ '--chip-color': CLASS_STATS[k].color }}>
              <ClassEmblem klass={k} />
              {CLASS_STATS[k].label}
            </span>
          ))}
        </div>

        <div className="cover-actions">
          <button type="button" className="cover-cta" onClick={onEnter}>
            Entrar al puesto de mando
          </button>
          <button type="button" className="cover-cta-ghost" onClick={() => onPlay()}>
            <SwordIcon size={16} />
            Partida rapida
          </button>
        </div>

        <ol className="cover-steps">
          {STEPS.map(({ Icon, title, text }) => (
            <li key={title} className="cover-step">
              <span className="cover-step-icon" aria-hidden="true">
                <Icon size={17} />
              </span>
              <div>
                <b>{title}</b>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="cover-credit">
          <TrophyIcon size={14} />
          Prototipo para el Axie Vibeathon 2026, Ronda 1.
        </p>
      </div>

      <div className="cover-showcase">
        <div className="cover-lord-frame">
          <Portrait3D descriptor={LORD_DESCRIPTORS.player} genes={AXIE_SAMPLE_GENES} size={216} />
          <span className="cover-lord-tag">LORD</span>
        </div>
        <div className="cover-squad">
          {SHOWCASE_KLASSES.map((k) => (
            <div key={k} className="cover-squad-portrait" style={{ '--chip-color': CLASS_STATS[k].color }}>
              <Portrait3D descriptor={ROSTER_DESCRIPTORS.player[k]} genes={AXIE_SAMPLE_GENES} size={84} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
