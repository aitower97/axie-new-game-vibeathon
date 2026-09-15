// LineIcons.jsx — iconos propios de trazo fino, en vez del emoji de color que
// llevaban antes la portada y el HUB. Mismo espiritu que ClassEmblem/
// Emblems.jsx (iconos propios, no arte de Axie real) pero de contorno en vez
// de silueta rellena: `stroke:currentColor`,
// sin relleno de color, para que hereden el acento de cada tarjeta/chip via la
// propiedad CSS `color` en vez de llevar su propio color fijo.
const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }

function Icon({ size, className, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      {children}
    </svg>
  )
}

export function DiceIcon({ size = 18, className }) {
  return (
    <Icon size={size} className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" {...STROKE} />
      <circle cx="8.3" cy="8.3" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="8.3" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="8.3" cy="15.7" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="15.7" r="1.05" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function BoltIcon({ size = 18, className }) {
  return (
    <Icon size={size} className={className}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" {...STROKE} />
    </Icon>
  )
}

export function DnaIcon({ size = 18, className }) {
  return (
    <Icon size={size} className={className}>
      <path d="M7 3c0 4 10 4 10 8s-10 4-10 8" {...STROKE} />
      <path d="M17 3c0 4-10 4-10 8s10 4 10 8" {...STROKE} />
      <path d="M8.4 7.2h7.2M8.4 16.8h7.2" {...STROKE} />
    </Icon>
  )
}

export function MapIcon({ size = 18, className }) {
  return (
    <Icon size={size} className={className}>
      <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" {...STROKE} />
      <path d="M9 4v14M15 6v14" {...STROKE} />
    </Icon>
  )
}

export function TrophyIcon({ size = 18, className }) {
  return (
    <Icon size={size} className={className}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" {...STROKE} />
      <path d="M7 5H4.2A2.8 2.8 0 0 0 7 9M17 5h2.8A2.8 2.8 0 0 1 17 9" {...STROKE} />
      <path d="M12 13v3M9 20h6M10 20v-3.2h4V20" {...STROKE} />
    </Icon>
  )
}

export function FlaskIcon({ size = 18, className }) {
  return (
    <Icon size={size} className={className}>
      <path d="M10 3h4M10 3v6.2L4.9 18a2 2 0 0 0 1.7 3h10.8a2 2 0 0 0 1.7-3L14 9.2V3" {...STROKE} />
      <path d="M8.3 15h7.4" {...STROKE} />
    </Icon>
  )
}

export function SearchIcon({ size = 18, className }) {
  return (
    <Icon size={size} className={className}>
      <circle cx="10.5" cy="10.5" r="6.3" {...STROKE} />
      <path d="M15.3 15.3 20.5 20.5" {...STROKE} />
    </Icon>
  )
}

export function ScaleIcon({ size = 18, className }) {
  return (
    <Icon size={size} className={className}>
      <path d="M12 3v18M6 21h12M5 7h4M15 7h4" {...STROKE} />
      <path d="M7 7 4.2 13a2.9 2.9 0 0 0 5.6 0L7 7ZM17 7l-2.8 6a2.9 2.9 0 0 0 5.6 0L17 7Z" {...STROKE} />
    </Icon>
  )
}

export function SwordIcon({ size = 18, className }) {
  return (
    <Icon size={size} className={className}>
      <path d="M20 4 10.5 13.5" {...STROKE} />
      <path d="M14.5 4h5.5v5.5" {...STROKE} />
      <path d="M11.5 12 4 19.5 4 21 5.5 21 13 13.5" {...STROKE} />
      <path d="M9 17l-2.5-2.5" {...STROKE} />
    </Icon>
  )
}

export function MoveIcon({ size = 14, className }) {
  return (
    <Icon size={size} className={className}>
      <path d="M12 3v18M3 12h18" {...STROKE} />
      <path d="m9 6 3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" {...STROKE} />
    </Icon>
  )
}

export function RangeIcon({ size = 14, className }) {
  return (
    <Icon size={size} className={className}>
      <circle cx="12" cy="12" r="7.5" {...STROKE} />
      <circle cx="12" cy="12" r="2" {...STROKE} />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" {...STROKE} />
    </Icon>
  )
}

export function CombatLogIcon({ kind = 'event', size = 14, className }) {
  const paths = {
    attack: <path d="m4 20 7-7m2-2 7-7M14 4h6v6M4 14l6 6" {...STROKE} />,
    move: <path d="M12 3v18M3 12h18m-9-9 3 3m-3-3L9 6m3 15 3-3m-3 3-3-3" {...STROKE} />,
    shield: <path d="m12 3 7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" {...STROKE} />,
    heal: <path d="M12 20S4 15.5 4 9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 6.5-6 10-6 10Zm0-8V8m-2 2h4" {...STROKE} />,
    target: <><circle cx="12" cy="12" r="7" {...STROKE} /><circle cx="12" cy="12" r="2" {...STROKE} /></>,
    event: <><circle cx="12" cy="12" r="8" {...STROKE} /><path d="M12 8v5m0 3h.01" {...STROKE} /></>,
  }
  return <Icon size={size} className={className}>{paths[kind] || paths.event}</Icon>
}

// Zarcillo decorativo (portada): doodle de trazo fino tipo enredadera, con
// dos "brotes" rellenos -mismo espiritu que el resto del set
// (stroke:currentColor, hereda el color via la propiedad CSS `color`), pero
// pensado como adorno alrededor de un logotipo, no como icono de UI. Nunca se
// anima (evita el loop decorativo infinito sin proposito real).
export function VineIcon({ size = 40, className }) {
  return (
    <Icon size={size} className={className}>
      <path d="M4 21c3-1 4-6 3-10-1-4 2-7 6-7" {...STROKE} />
      <path d="M8.5 9.4c2 .8 2.2 3.6 5 3.6" {...STROKE} strokeWidth={1.3} />
      <circle cx="13" cy="3.4" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="6.6" cy="12.2" r="1.2" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function HomeIcon({ size = 18, className }) {
  return (
    <Icon size={size} className={className}>
      <path d="M4 11 12 4l8 7" {...STROKE} />
      <path d="M6 10v9h12v-9" {...STROKE} />
      <path d="M10 19v-5h4v5" {...STROKE} />
    </Icon>
  )
}
