// TerrainLegend.jsx — leyenda estatica de los tipos de terreno del tablero.
// No depende de ningun estado de partida.
export default function TerrainLegend() {
  return (
    <div className="terrain-legend">
      <span><i className="terrain-swatch terrain-grass" /> Abierto</span>
      <span><i className="terrain-swatch terrain-stone" /> Piedra: bloquea todo</span>
      <span><i className="terrain-swatch terrain-earth" /> Zona lenta: cuesta 2</span>
      <span><i className="terrain-swatch terrain-water" /> Agua: solo Aqua</span>
      <span><i className="terrain-swatch terrain-grass terrain-obstacle-swatch" /> Obstaculo: bloquea mover, no disparar</span>
    </div>
  )
}
