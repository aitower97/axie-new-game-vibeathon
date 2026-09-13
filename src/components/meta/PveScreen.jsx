// PveScreen.jsx — pantalla meta "PVE": el mapa navegable de Lunacia (ver
// LunaciaMap.jsx). Sustituye a la lista plana first-approach: ahora cada
// region del mapa tiene sus nodos, terreno propio y desbloqueo progresivo.
import LunaciaMap from './LunaciaMap'

export default function PveScreen(props) {
  return <LunaciaMap {...props} />
}