// PveScreen.jsx — pantalla meta "PVE" (first-approach): escaramuzas contra la
// IA en cadena. Tres misiones con dificultad/escala de partida y recompensa
// estimada; "Jugar" reinicia la partida en vivo (resetMatch) y viaja a la
// pestaña Partida. La IA/contenido real por mision se implementa en fases
// siguientes; la partida actual ya es la "escaramuza" base.
import MetaScreen, { StatChip } from './MetaScreen'

const MISSIONS = [
  {
    id: 'escaramuza',
    icon: '🌲',
    name: 'Escaramuza del bosque',
    difficulty: 'Facil',
    blurb: 'Un puñado de axies salvajes. La partida de demo actual con IA de 4 prioridades.',
    reward: 2,
    color: 'var(--mint)',
  },
  {
    id: 'avanzada',
    icon: '🪨',
    name: 'Avanzada de piedra',
    difficulty: 'Media',
    blurb: 'Terreno rocoso y zona lenta: el contragolpe y el terreno deciden. (Contenido futuro, ya esta el A5.)',
    reward: 4,
    color: 'var(--amber)',
    disabled: true,
  },
  {
    id: 'foco',
    icon: '🔥',
    name: 'Asalto al foco',
    difficulty: 'Dificil',
    blurb: 'El Lord rival ampliado y un roster mayor. (Contenido futuro.)',
    reward: 6,
    color: 'var(--rose)',
    disabled: true,
  },
]

export default function PveScreen({ onPlay }) {
  return (
    <MetaScreen
      icon="🤖"
      title="PVE: Escaramuzas"
      blurb="Campanas de una partida que alimentan la economia de sesion. La mision base usa la partida en vivo ya jugable."
    >
      <div className="meta-grid">
        {MISSIONS.map((m) => (
          <div key={m.id} className="meta-panel">
            <div className="meta-panel-title">
              <span aria-hidden="true">{m.icon}</span> {m.name}
              <span className="meta-difficulty" style={{ color: m.color }}>
                {m.difficulty}
              </span>
            </div>
            <p className="meta-note">{m.blurb}</p>
            <div className="meta-panel-actions">
              <StatChip label="RECOMPENSA" value={`${m.reward} esencia`} />
              <button
                type="button"
                className="ghost meta-action"
                disabled={m.disabled}
                onClick={onPlay}
              >
                {m.disabled ? 'Proximamente' : 'Jugar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </MetaScreen>
  )
}