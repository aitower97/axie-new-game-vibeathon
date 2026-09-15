// routes.js — mini-routing por hash (sin dependencias, sin router: el repo
// trabaja React+Vite sin libreria de estado/router). `#/partida` muestra la
// partida en vivo; las rutas meta muestran las pantallas del hub.
// DEFAULT_ROUTE='portada': la app aterriza en una pantalla de titulo con el
// pitch y el Lord/roster en 3D -desde ahi se entra al HUB ('base', equipo en
// el centro,
// mundo a los lados). La portada no tiene su propia entrada en MetaNav (no es
// una pestaña del juego, es la puerta de entrada); se vuelve a ella con el
// logo de la barra superior.
import { useEffect, useState } from 'react'

export const META_ROUTES = ['portada', 'base', 'aldea', 'recursos', 'investigacion', 'evolucion', 'pve', 'pvp']
export const DEFAULT_ROUTE = 'portada'

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
