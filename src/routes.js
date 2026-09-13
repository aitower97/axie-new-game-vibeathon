// routes.js — mini-routing por hash (sin dependencias, sin router: el repo
// trabaja React+Vite sin libreria de estado/router). `#/partida` (o sin hash)
// muestra la partida en vivo; las rutas meta muestran las pantallas del hub.
// DEFAULT_ROUTE='base': la app aterriza en el HUB (equipo en el centro,
// mundo a los lados), no en la partida -la partida es "la que eliges".
import { useEffect, useState } from 'react'

export const META_ROUTES = ['base', 'recursos', 'investigacion', 'evolucion', 'pve', 'pvp']
export const DEFAULT_ROUTE = 'base'

export function getHashRoute() {
  const h = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase()
  if (h === 'partida') return 'partida'
  return META_ROUTES.includes(h) ? h : DEFAULT_ROUTE
}

export function useHashRoute() {
  const [route, setRoute] = useState(getHashRoute)
  useEffect(() => {
    const on = () => setRoute(getHashRoute())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  // Cambia la ruta manteniendo el hash como fuente de verdad (el navegador
  // dispara `hashchange` y el estado se entera solo).
  const navigate = (r) => {
    window.location.hash = `/${r}`
  }
  return { route, navigate }
}