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
  { Icon: DiceIcon, title: 'Roll the die', text: 'Each face is a real body part of your Axie: horn, mouth, back, tail.' },
  { Icon: BoltIcon, title: 'Play the face that comes up', text: 'Moving never spends your turn; the rolled face decides what you strike with or recover with.' },
  { Icon: DnaIcon, title: 'Evolve a part', text: 'Upgrade the genes of a part and that die face is rewritten forever.' },
]

export default function CoverScreen({ onEnter, onPlay }) {
  return (
    <section className="cover-screen">
      <div className="cover-hero">
        <h1 className="cover-logo">
          <img
            src="/brand/logo.svg"
            alt="Tactic Dice"
            className="cover-logo-img"
            width={460}
            height={220}
          />
        </h1>
        <p className="cover-pitch">
          Evolve your Axies and evolve your die. As you upgrade the genes of their
          parts you unlock die upgrades: new faces and the option to lock the ones
          you already have.
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
            Enter the command post
          </button>
          <button type="button" className="cover-cta-ghost" onClick={() => onPlay()}>
            <SwordIcon size={16} />
            Quick match
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
          Prototype for the Axie Vibeathon 2026, Round 1.
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
