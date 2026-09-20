// Navegacion principal del shell: gestion, modos de juego y partida.
const TABS = [
  { key: 'aldea', label: 'Village', icon: 'VI' },
  { key: 'evolucion', label: 'Lab', icon: 'LA' },
  { key: 'pve', label: 'PVE', icon: 'PV' },
  { key: 'pvp', label: 'PVP', icon: 'VP' },
  { key: 'partida', label: 'Match', icon: 'MA' },
]

export default function MetaNav({ route, compressed }) {
  return (
    <nav className={`meta-nav ${compressed ? 'compressed' : ''}`} aria-label="Navigation">
      {TABS.map((t) => (
        <a
          key={t.key}
          href={`#/${t.key}`}
          className={route === t.key ? 'meta-tab active' : 'meta-tab'}
          title={t.label}
          aria-label={t.label}
        >
          <span className="meta-tab-icon" aria-hidden="true">{t.icon}</span>
          <span className="meta-tab-label">{t.label}</span>
        </a>
      ))}
    </nav>
  )
}
