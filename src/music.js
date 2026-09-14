// music.js — musica ambiental por estado del juego (modulo singleton, sin
// dependencias). Pistas de Kevin MacLeod (incompetech.com) bajo CC-BY 4.0
// (atribucion en public/music/README.md y en el panel de ayuda). Estados:
//   hub      -> pantallas meta (base/pve/pvp/laboratorio/recursos/investigacion)
//   pve      -> partida contra la IA en campaña
//   pvp      -> arena PVP
//   overtime -> prorroga de la arena PVP (misma pista a 1.35x, mas urgente)
//   victory  -> banner de victoria (Carefree)
//   defeat   -> banner de derrota (Bittersweet)
// Autoplay: los navegadores exigen un gesto del usuario para sonar; el modulo
// registra listeners {once} de pointerdown/keydown/touchstart que llaman a
// unlock() la primera vez. Antes de eso setMusicKey solo guarda el destino.

const TRACK_URL = {
  hub: '/music/hub.mp3',
  pve: '/music/pve.mp3',
  pvp: '/music/pvp.mp3',
  overtime: '/music/pvp.mp3',
  victory: '/music/victory.mp3',
  defeat: '/music/defeat.mp3',
}
const OVERTIME_RATE = 1.35
const VOLUME = 0.5
const FADE_MS = 60
const FADE_TOTAL = 20
const MUTE_KEY = 'lunacia-music-muted'

let els = []
let playing = 0 // indice del elemento que suena (o el ultimo)
let current = null
let unlocked = false
let muted = false
try {
  muted = localStorage.getItem(MUTE_KEY) === '1'
} catch {
  muted = false
}
const subs = new Set()
let rampTimer = null
let muteLevel = 0 // volumen real del elemento activo (0 = en mute)

function makeEl() {
  const a = new Audio()
  a.loop = true
  a.preload = 'auto'
  a.volume = 0
  return a
}

function stopRamp() {
  if (rampTimer) {
    clearInterval(rampTimer)
    rampTimer = null
  }
}

// Sube o baja el volumen del elemento activo en rampa hasta `goal`.
function rampGoal(goal) {
  stopRamp()
  const el = els[playing]
  if (!el) return
  const from = muteLevel
  let step = 0
  rampTimer = setInterval(() => {
    step += 1
    const f = step / FADE_TOTAL
    muteLevel = from + (goal - from) * f
    el.volume = Math.max(0, Math.min(1, muteLevel))
    if (step >= FADE_TOTAL) {
      stopRamp()
      muteLevel = goal
      el.volume = Math.max(0, Math.min(1, goal))
      if (goal <= 0) el.pause()
    }
  }, FADE_MS)
}

// Cambia de pista con crossfade: el elemento inactivo arranca la nueva mientras
// el activo baja; al terminar invierten el rol.
function crossfade(key) {
  stopRamp()
  const out = els[playing] || null
  const inn = els[1 - playing] || (els[1 - playing] = makeEl())
  inn.src = TRACK_URL[key]
  inn.loop = true
  inn.volume = 0
  muteLevel = 0
  inn.playbackRate = key === 'overtime' ? OVERTIME_RATE : 1
  const p = inn.play()
  if (p && p.catch) p.catch(() => {})
  const goal = muted ? 0 : VOLUME
  let step = 0
  rampTimer = setInterval(() => {
    step += 1
    const f = step / FADE_TOTAL
    if (out) out.volume = Math.max(0, Math.min(1, VOLUME * (1 - f)))
    inn.volume = Math.max(0, Math.min(1, goal * f))
    if (step >= FADE_TOTAL) {
      stopRamp()
      if (out && out !== inn) {
        out.pause()
        out.volume = 0
      }
      muteLevel = goal
      inn.volume = goal
      playing = els.indexOf(inn)
    }
  }, FADE_MS)
}

export function setMusicKey(key) {
  current = key
  if (!TRACK_URL[key]) return
  if (!unlocked || muted) {
    if (unlocked && muted) {
      // En silencio no suena, pero precargamos el destino en el elemento libre
      // para que al reactivar suene la pista que toca, no la anterior.
      const active = els[playing]
      if (!active || !active.src.endsWith(TRACK_URL[key])) {
        const spare = els[1 - playing] || (els[1 - playing] = makeEl())
        spare.src = TRACK_URL[key]
        spare.playbackRate = key === 'overtime' ? OVERTIME_RATE : 1
      }
    } else if (!unlocked) {
      // Precalentamos el elemento para que arranque rapido al desbloquear.
      const el = els[0] || (els[0] = makeEl())
      el.src = TRACK_URL[key]
      el.playbackRate = key === 'overtime' ? OVERTIME_RATE : 1
    }
    return
  }
  const sameEl = els[playing] && els[playing].src.endsWith(TRACK_URL[key])
  if (sameEl) {
    els[playing].playbackRate = key === 'overtime' ? OVERTIME_RATE : 1
  } else {
    crossfade(key)
  }
}

export function unlock() {
  if (!unlocked && TRACK_URL[current]) {
    unlocked = true
    if (muted) return
    const el = els[0] || (els[0] = makeEl())
    if (!el.src.endsWith(TRACK_URL[current])) el.src = TRACK_URL[current]
    el.loop = true
    el.playbackRate = current === 'overtime' ? OVERTIME_RATE : 1
    el.volume = 0
    muteLevel = 0
    const p = el.play()
    if (p && p.catch) p.catch(() => {})
    playing = 0
    rampGoal(VOLUME)
  }
}

export function toggleMuted() {
  muted = !muted
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    // sin almacen persistente (modo privado): la sesion decide
  }
  const el = els[playing]
  if (unlocked && el) {
    if (muted) {
      rampGoal(0)
    } else {
      // Si el estado cambio mientras estabamos en silencio, el elemento activo
      // sigue en la pista vieja: hacemos crossfade al destino que toca.
      if (!el.src.endsWith(TRACK_URL[current])) {
        crossfade(current)
      } else {
        if (el.paused) {
          const p = el.play()
          if (p && p.catch) p.catch(() => {})
        }
        rampGoal(VOLUME)
      }
    }
  }
  notify()
}

export function isMuted() {
  return muted
}

export function subscribe(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

function notify() {
  subs.forEach((fn) => {
    try {
      fn({ muted, key: current })
    } catch {
      // los listeners de UI no deben romper la musica
    }
  })
}

if (typeof window !== 'undefined') {
  const unlockHandler = () => unlock()
  window.addEventListener('pointerdown', unlockHandler, { capture: true, once: true })
  window.addEventListener('keydown', unlockHandler, { capture: true, once: true })
  window.addEventListener('touchstart', unlockHandler, { capture: true, once: true })
  // Hook de debug (no toca la logica).
  window.__musicDebug = () => ({
    key: current,
    muted,
    unlocked,
    lsMuted: (() => {
      try {
        return localStorage.getItem(MUTE_KEY)
      } catch {
        return null
      }
    })(),
    els: els.map((e) => ({
      src: e.currentSrc || e.src || null,
      paused: e.paused,
      volume: e.volume,
      rate: e.playbackRate,
    })),
  })
}