// routes.js — mini-routing por hash (sin dependencias, sin router: el repo
// trabaja React+Vite sin libreria de estado/router). `#/partida` (o sin hash)
// muestra la partida en vivo; `#/base|recursos|investigacion|pve|pvp` muestran
// las pantallas meta (first-approach) en el mismo shell de la app.
import { useEffect, useState } from 'react'

export const META_ROUTES = ['base', 'recursos', 'investigacion', 'pve', 'pvp']

export function getHashRoute() {
  const h = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase()
  return META_ROUTES.includes(h) ? h : 'partida'
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