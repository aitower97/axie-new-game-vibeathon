// LunaciaBackdrop.jsx — fondo ambiental, puramente decorativo, detras del tablero.
//
// Reemplaza la escena Three.js (islas flotantes/luna) por un fondo 2D de pueblo/
// naturaleza: a peticion del usuario, que enseno una referencia real de Terrariums
// y un boceto del campo de batalla. Assets reales de Kenney (paquete "Tiny Town",
// kenney.nl/assets/tiny-town, licencia CC0) recoloreados hacia la paleta del juego
// (verde-menta en vez del verde saturado original) con un script de un solo uso -no
// quedan en package.json, son PNGs ya procesados en src/assets/backdrop/. Ya no hace
// falta `three`: se quita del proyecto.
import grassPlain from './assets/backdrop/grass-plain.png'
import grassFlower from './assets/backdrop/grass-flower.png'
import treePine from './assets/backdrop/tree-pine.png'
import treeRound from './assets/backdrop/tree-round.png'
import treeShort from './assets/backdrop/tree-short.png'
import mushrooms from './assets/backdrop/mushrooms.png'
import fenceH from './assets/backdrop/fence-h.png'
import fencePost from './assets/backdrop/fence-post.png'

// Posiciones fijas (no aleatorias en cada render). El layout de dos columnas deja
// visible sobre todo la franja izquierda del tablero y una tira arriba -la derecha
// la tapa la barra lateral-, asi que la densidad se concentra ahi, con tamanos y
// opacidades variadas para dar sensacion de profundidad (mas grande y opaco = mas
// cerca). grass-flower.png solo se usa como textura tileada (ver lunacia-grass-detail
// en App.css): suelta como sprite se ve como un cuadrado con bordes duros, asi que no
// entra en esta lista.
const DECOR = [
  // Franja izquierda, de arriba a abajo, dos "columnas" de profundidad
  { img: treePine, left: '10%', top: '3%', size: 92, opacity: 0.95 },
  { img: treeRound, left: '2%', top: '6%', size: 70, opacity: 0.9 },
  { img: treeShort, left: '17%', top: '2%', size: 54, opacity: 0.85 },
  { img: treeRound, left: '6%', top: '17%', size: 60, opacity: 0.88 },
  { img: mushrooms, left: '15%', top: '19%', size: 38, opacity: 0.85 },
  { img: treePine, left: '1%', top: '27%', size: 84, opacity: 0.92 },
  { img: treeShort, left: '11%', top: '30%', size: 46, opacity: 0.8 },
  { img: mushrooms, left: '4%', top: '40%', size: 34, opacity: 0.8 },
  { img: treeRound, left: '16%', top: '42%', size: 58, opacity: 0.85 },
  { img: treePine, left: '3%', top: '50%', size: 78, opacity: 0.9 },
  { img: treeShort, left: '13%', top: '54%', size: 50, opacity: 0.82 },
  { img: mushrooms, left: '8%', top: '63%', size: 36, opacity: 0.8 },
  { img: treeRound, left: '18%', top: '65%', size: 64, opacity: 0.87 },
  { img: treePine, left: '2%', top: '72%', size: 86, opacity: 0.93 },
  { img: treeShort, left: '10%', top: '80%', size: 52, opacity: 0.83 },
  { img: fencePost, left: '5%', top: '90%', size: 38, opacity: 0.75 },
  { img: fenceH, left: '8%', top: '91%', size: 54, opacity: 0.75 },
  { img: fenceH, left: '14%', top: '90%', size: 54, opacity: 0.75 },
  { img: treeRound, left: '20%', top: '89%', size: 56, opacity: 0.82 },
  // Tira de arriba, encima del header
  { img: treeShort, left: '35%', top: '1%', size: 40, opacity: 0.7 },
  { img: treeRound, left: '55%', top: '1%', size: 44, opacity: 0.7 },
  // Derecha: pequeno detalle por si el panel lateral deja algun borde visible
  { img: treePine, left: '97%', top: '3%', size: 60, opacity: 0.7 },
  { img: mushrooms, left: '96%', top: '20%', size: 30, opacity: 0.65 },
]

export default function LunaciaBackdrop() {
  return (
    <div className="lunacia-backdrop" aria-hidden="true">
      <div className="lunacia-grass" style={{ backgroundImage: `url(${grassPlain})` }} />
      <div className="lunacia-grass lunacia-grass-detail" style={{ backgroundImage: `url(${grassFlower})` }} />
      <div className="lunacia-vignette" />
      {DECOR.map((d, i) => (
        <img
          key={i}
          src={d.img}
          alt=""
          className="lunacia-decor"
          style={{ left: d.left, top: d.top, width: d.size, height: d.size, opacity: d.opacity }}
        />
      ))}
    </div>
  )
}
