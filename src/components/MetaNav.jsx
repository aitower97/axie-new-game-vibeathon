// MetaNav.jsx — pestañas de navegacion del shell: Partida (la partida en vivo)
// + las 5 pantallas meta first-approach (Base, Recursos, Investigacion, PVE,
// PVP). Enlaces reales por hash; la ruta activa viene resuelta por el shim de
// arriba. Idioma visual: pestañas planas con acento ambar en la activa, en
// linea con el HUD; sin romper el layout de la partida.
const TABS = [
  { key: 'partida', label: 'Partida', icon: '⚔' },
  { key: 'base', label: 'Base', icon: '🏰' },
  { key: 'recursos', label: 'Recursos', icon: '⚖' },
  { key: 'investigacion', label: 'Investigacion', icon: '🔬' },
  { key: 'pve', label: 'PVE', icon: '🤖' },
  { key: 'pvp', label: 'PVP', icon: '🏆' },
]

export default function MetaNav({ route, compressed }) {
  return (
    <nav className={`meta-nav ${compressed ? 'compressed' : ''}`} aria-label="Navegacion">
      {TABS.map((t) => (
        <a
          key={t.key}
          href={`#/${t.key}`}
          className={route === t.key ? 'meta-tab active' : 'meta-tab'}
          title={t.label}
          aria-label={t.label}
        >
          <span className="meta-tab-icon" aria-hidden="true">
            {t.icon}
          </span>
          {!compressed && t.label}
        </a>
      ))}
    </nav>
  )
}