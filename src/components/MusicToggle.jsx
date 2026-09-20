// MusicToggle.jsx — boton global de musica del topbar (🔊/🔇). Lee el estado
// del singleton de music.js via subscribe (sin estado de partida en App.jsx:
// la musica es infraestructura de modulo, como OVERTIME_ACTIVE).
import { useEffect, useState } from 'react'
import { isMuted, subscribe, toggleMuted } from '../music'

export default function MusicToggle() {
  const [muted, setMuted] = useState(isMuted())
  useEffect(() => subscribe(({ muted: m }) => setMuted(m)), [])
  return (
    <button
      type="button"
      className="music-toggle"
      title={muted ? 'Unmute music' : 'Mute music'}
      aria-label={muted ? 'Unmute music' : 'Mute music'}
      aria-pressed={!muted}
      onClick={toggleMuted}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}