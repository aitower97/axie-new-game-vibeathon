// CoverScreen.jsx — portada del juego: primera pantalla que ve cualquiera
// (DEFAULT_ROUTE='portada' en routes.js). El pitch, el Lord y el roster en
// 3D real (mismo mixer/descriptores que el HUB y el tablero, cero assets
// nuevos) y dos puertas de entrada. Presentacional puro: no toca estado de
// partida, solo recibe `onEnter` (ir al HUB) y `onPlay` (partida libre
// directa).
//
// El logotipo es `public/brand/logo.svg` (formas propias dibujadas como
// paths, sin wordmark de Sky Mavis -ver el comentario de ese archivo),
// cargado como `<img>`: los zarcillos y la cinta viven DENTRO del SVG, asi
// que no hace falta ningun `VineIcon`/`cover-title-ribbon` aqui.
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
            src="/brand/axie-infinity-tactics-dices.png"
            alt="Axie Infinity Tactics Dices"
            className="cover-logo-img"
            width={460}
            height={220}
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
