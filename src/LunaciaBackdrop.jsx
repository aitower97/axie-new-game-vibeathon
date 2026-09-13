// LunaciaBackdrop.jsx — fondo ambiental 2D, puramente decorativo, detras del
// tablero (el canvas WebGL de Board3D usa alpha:true sin setClearColor, asi
// que su margen transparente deja ver esta capa por debajo -confirmado en
// vivo, ver CLAUDE.md).
//
// REDISENO 2026-09-11 ("quiero que parezca un campo de verdad, un mundo,
// Kenney tiene ecosistemas completos y lo que hay ahora son 3 arboles y 2
// setas mal puestas"): en vez de bajar un pack de sprites 2D nuevo, se
// reaprovecha el ecosistema Kenney que YA esta en el repo para el tablero 3D
// (Platformer Kit + Mini Forest, ambos CC0, public/models/) volcado a PNG por
// backdropSprite3D.js (misma tecnica que partIcon3D.js, pero conservando el
// material/textura real del .glb en vez de una silueta de un color). 13
// especies en vez de 2, organizadas en CLUSTERS con intencion (una arboleda,
// un roquedal con setas a su sombra, un prado de flores, un borde de aldea
// con valla y cajones) en vez de puntos sueltos al azar -para que lea como un
// sitio, no como decorado repetido.
import { useEffect, useState } from 'react'
import grassPlain from './assets/backdrop/grass-plain.png'
import grassFlower from './assets/backdrop/grass-flower.png'
import { backdropSpriteUrl } from './backdropSprite3D'

// Especie -> .glb real del pack (mismas rutas que TERRAIN_BLOCK_URLS/
// TERRAIN_DECOR_URLS en App.jsx) + tamano base en pantalla (una especie
// grande como un arbol se ve grande, una flor se ve pequena -no se normaliza
// todo al mismo marco, para que la escala lea como un mundo real).
const SPECIES = {
  treePine: { url: '/models/tree-pine.glb', size: 108 },
  treePineSmall: { url: '/models/tree-pine-small.glb', size: 68 },
  treeRound: { url: '/models/mini-forest/tree.glb', size: 92 },
  treeHigh: { url: '/models/mini-forest/tree-high.glb', size: 128 },
  bush: { url: '/models/mini-forest/plant.glb', size: 54 },
  flowers: { url: '/models/flowers.glb', size: 40 },
  mushrooms: { url: '/models/mushrooms.glb', size: 34 },
  rocksBig: { url: '/models/rocks.glb', size: 72 },
  rocksHigh: { url: '/models/mini-forest/rocks-high.glb', size: 58 },
  rocksLow: { url: '/models/mini-forest/rocks-low.glb', size: 42 },
  stones: { url: '/models/mini-forest/stones.glb', size: 28 },
  fence: { url: '/models/fence-low-straight.glb', size: 62 },
  crate: { url: '/models/crate.glb', size: 44 },
}

// Posiciones fijas (no aleatorias en cada render), en clusters con intencion
// en vez de puntos sueltos: una arboleda arriba a la izquierda, un roquedal
// con setas a media altura, un prado de flores mas abajo, y un borde de
// aldea (valla + cajones) al fondo -la misma progresion "bosque -> roca ->
// prado -> aldea" a los dos lados, mas corta a la derecha (el panel lateral
// deja menos hueco visible ahi). `flip` espeja el sprite en horizontal para
// que la misma especie repetida no se vea como una fotocopia exacta.
const DECOR = [
  // --- Arboleda, borde izquierdo, franja superior ---
  { s: 'treeHigh', left: '1%', top: '2%', opacity: 0.95 },
  { s: 'treePine', left: '11%', top: '1%', opacity: 0.92 },
  { s: 'treeRound', left: '6%', top: '8%', opacity: 0.9, flip: true },
  { s: 'treePineSmall', left: '17%', top: '4%', opacity: 0.85 },
  { s: 'bush', left: '3%', top: '14%', opacity: 0.85 },
  { s: 'treePine', left: '0%', top: '19%', opacity: 0.9 },
  { s: 'treeRound', left: '15%', top: '17%', opacity: 0.85, flip: true },
  { s: 'stones', left: '9%', top: '22%', opacity: 0.75 },

  // --- Roquedal con setas a su sombra, media altura ---
  { s: 'rocksBig', left: '2%', top: '30%', opacity: 0.92 },
  { s: 'rocksHigh', left: '13%', top: '28%', opacity: 0.88 },
  { s: 'mushrooms', left: '8%', top: '35%', opacity: 0.88 },
  { s: 'mushrooms', left: '17%', top: '33%', opacity: 0.82, flip: true },
  { s: 'rocksLow', left: '0%', top: '38%', opacity: 0.8 },
  { s: 'stones', left: '19%', top: '40%', opacity: 0.7 },
  { s: 'treeRound', left: '5%', top: '42%', opacity: 0.85 },

  // --- Prado de flores ---
  { s: 'flowers', left: '10%', top: '50%', opacity: 0.85 },
  { s: 'flowers', left: '2%', top: '52%', opacity: 0.8, flip: true },
  { s: 'bush', left: '16%', top: '48%', opacity: 0.8 },
  { s: 'flowers', left: '6%', top: '58%', opacity: 0.82 },
  { s: 'treePineSmall', left: '19%', top: '55%', opacity: 0.82 },
  { s: 'rocksLow', left: '12%', top: '61%', opacity: 0.75, flip: true },

  // --- Borde de aldea: valla + cajones + un ultimo arbol ---
  { s: 'treePine', left: '1%', top: '66%', opacity: 0.9 },
  { s: 'fence', left: '9%', top: '72%', opacity: 0.85 },
  { s: 'fence', left: '15%', top: '71%', opacity: 0.85 },
  { s: 'crate', left: '5%', top: '76%', opacity: 0.85 },
  { s: 'bush', left: '18%', top: '76%', opacity: 0.8 },
  { s: 'fence', left: '11%', top: '84%', opacity: 0.8, flip: true },
  { s: 'crate', left: '17%', top: '85%', opacity: 0.8 },
  { s: 'treeRound', left: '2%', top: '88%', opacity: 0.88 },
  { s: 'stones', left: '13%', top: '92%', opacity: 0.7 },

  // --- Tira superior, por encima del topbar ---
  { s: 'treePineSmall', left: '38%', top: '0.5%', opacity: 0.7 },
  { s: 'bush', left: '46%', top: '1%', opacity: 0.65 },
  { s: 'treeRound', left: '57%', top: '0.5%', opacity: 0.68, flip: true },

  // --- Borde derecho, version mas corta (menos hueco visible ahi) ---
  { s: 'treeHigh', left: '98%', top: '2%', opacity: 0.85, flip: true },
  { s: 'treePine', left: '95%', top: '10%', opacity: 0.8 },
  { s: 'mushrooms', left: '97%', top: '18%', opacity: 0.75 },
  { s: 'rocksHigh', left: '95.5%', top: '26%', opacity: 0.75, flip: true },
  { s: 'flowers', left: '97.5%', top: '35%', opacity: 0.72 },
  { s: 'treeRound', left: '95%', top: '44%', opacity: 0.78 },
  { s: 'fence', left: '96%', top: '58%', opacity: 0.75 },
  { s: 'crate', left: '97.5%', top: '65%', opacity: 0.75 },
  { s: 'treePine', left: '95.5%', top: '74%', opacity: 0.82, flip: true },
  { s: 'bush', left: '97.5%', top: '86%', opacity: 0.72 },
]

export default function LunaciaBackdrop() {
  // Los sprites se renderizan una vez por especie (cacheados en
  // backdropSprite3D.js: si otro <LunaciaBackdrop> monta de nuevo, o React
  // StrictMode remonta el efecto, no se vuelve a renderizar nada), pero la
  // primera vez son async -sin estado, la primera pintura saldria sin
  // imagenes hasta que el usuario forzara un re-render por otro motivo.
  const [urls, setUrls] = useState({})
  useEffect(() => {
    let cancelled = false
    for (const [key, spec] of Object.entries(SPECIES)) {
      backdropSpriteUrl(spec.url).then((url) => {
        if (cancelled || !url) return
        setUrls((prev) => (prev[key] ? prev : { ...prev, [key]: url }))
      })
    }
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="lunacia-backdrop" aria-hidden="true">
      <div className="lunacia-grass" style={{ backgroundImage: `url(${grassPlain})` }} />
      <div className="lunacia-grass lunacia-grass-detail" style={{ backgroundImage: `url(${grassFlower})` }} />
      <div className="lunacia-vignette" />
      {DECOR.map((d, i) => {
        const spec = SPECIES[d.s]
        const url = urls[d.s]
        if (!url) return null
        return (
          <img
            key={i}
            src={url}
            alt=""
            className="lunacia-decor"
            style={{
              left: d.left,
              top: d.top,
              width: spec.size,
              height: spec.size,
              opacity: d.opacity,
              transform: d.flip ? 'scaleX(-1)' : undefined,
            }}
          />
        )
      })}
    </div>
  )
}
