// LunaciaBackdrop.jsx — fondo ambiental 2D, puramente decorativo, detras del
// tablero (el canvas WebGL de Board3D usa alpha:true sin setClearColor, asi
// que su margen transparente deja ver esta capa por debajo -confirmado en
// vivo, ver CLAUDE.md).
//
// SEGUNDA VUELTA (2026-09-14, tras comparar contra 3 capturas reales
// guardadas en titulo/fondo-refs/: homeland-1-oasis-cristal.jpg,
// homeland-2-pantano-cristal.jpg, terrariums-1-aldea.jpg). La vuelta
// anterior (mismo dia, primera pasada) ya habia corregido el hue de cada
// familia (rock->violeta, flower->magenta, verificado por muestreo de
// pixel), pero el resultado seguia leyendo "parecido a lo que habia": el
// fondo base (.lunacia-backdrop en App.css) seguia siendo var(--panel), un
// verde casi negro, y por eso todo lo de encima perdia contraste pese a
// tener el hue correcto. Ninguna de las 3 referencias usa un suelo oscuro
// -ese es el cambio de mayor impacto de esta vuelta, esta en App.css, no
// aqui. Los cambios de ESTE archivo (composicion/posicionamiento) son:
//
// (1) Las flores YA NO tienen su propio "prado" suelto mas abajo del
//     santuario de piedra -en las 3 referencias (sobre todo los dos
//     homeland-*) el arbol de flor rosa/magenta esta SIEMPRE pegado al
//     cristal/roca, es una pareja visual. Ahora los props `flowers` viven
//     DENTRO del cluster del landmark, solapando la roca por arriba (como
//     si crecieran de ella), no en un patch aparte.
// (2) El landmark (cairn de rocas) sube de escala y gana mas piezas
//     apiladas -el brillo de color real que simula el cristal vive en CSS
//     (.lunacia-decor-landmark + .lunacia-aura, ver App.css), aqui solo se
//     agranda el aura y se acerca el cluster.
// (3) Nuevas copias `foliage-shade` (misma especie/imagen, tinte mas oscuro,
//     kind distinto) colocadas DETRAS y mas grandes que su pareja normal en
//     los clusters de arboleda mas grandes -mismo patron que
//     terrariums-1-aldea/homeland-1-oasis-cristal: una sola copa de arbol
//     tiene VARIOS tonos de verde adentro, no un verde plano repetido.
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
  treeRound: { url: '/models/mini-forest/tree.glb', size: 104 },
  treeHigh: { url: '/models/mini-forest/tree-high.glb', size: 146 },
  bush: { url: '/models/mini-forest/plant.glb', size: 60 },
  flowers: { url: '/models/flowers.glb', size: 42 },
  mushrooms: { url: '/models/mushrooms.glb', size: 36 },
  rocksBig: { url: '/models/rocks.glb', size: 82 },
  rocksHigh: { url: '/models/mini-forest/rocks-high.glb', size: 64 },
  rocksLow: { url: '/models/mini-forest/rocks-low.glb', size: 46 },
  stones: { url: '/models/mini-forest/stones.glb', size: 30 },
  fence: { url: '/models/fence-low-straight.glb', size: 62 },
  crate: { url: '/models/crate.glb', size: 44 },
}

// Familia visual de cada especie -> variante de tinte CSS (ver .lunacia-decor-*
// en App.css). Una entrada de DECOR puede sobreescribir `kind` a proposito:
// - las setas junto al monolito pasan a `glow` (musgo bioluminiscente).
// - algunas copas grandes pasan a `foliage-shade` (misma especie, capa
//   trasera mas oscura, ver nota de cabecera punto 3).
const KIND_BY_SPECIES = {
  treePine: 'foliage',
  treePineSmall: 'foliage',
  treeRound: 'foliage',
  treeHigh: 'foliage',
  bush: 'foliage',
  flowers: 'flower',
  mushrooms: 'mushroom',
  rocksBig: 'rock',
  rocksHigh: 'rock',
  rocksLow: 'rock',
  stones: 'rock',
  fence: 'village',
  crate: 'village',
}

// Auras de resplandor bajo los dos cairns/monolitos (un cairn real hecho de
// piedras del propio pack, apiladas -no un asset nuevo). Se pintan ANTES que
// los props en el DOM para quedar detras (mismo orden = misma capa de
// apilamiento, sin z-index que gestionar a mano). Tamano subido respecto a
// la vuelta anterior -en las referencias el cristal es el elemento que mas
// domina el cluster, no un detalle discreto.
const LANDMARK_GLOWS = [
  { left: '9%', top: '30%', size: 260, variant: 'left' },
  { left: '96.5%', top: '39%', size: 190, variant: 'right' },
]

// Posiciones fijas (no aleatorias en cada render). Progresion por franja:
// arboleda (con capas de sombra para dar volumen) -> santuario de piedra
// CON su arbol de flor pegado (el foco memorable, cristal+flor como pareja,
// nunca sueltos) -> borde de aldea. Ya no hay un "prado de flores" aparte:
// se fusiono con el santuario (ver nota de cabecera). `flip` espeja en
// horizontal, `scale` da variacion organica de tamano.
const DECOR = [
  // --- Arboleda, borde izquierdo, franja superior: masa solapada con
  //     capas de sombra (foliage-shade) detras de las copas grandes para
  //     que la masa tenga varios tonos de verde, no uno plano ---
  { s: 'treeHigh', left: '-1%', top: '0%', opacity: 0.9, scale: 1.35, kind: 'foliage-shade' },
  { s: 'treeHigh', left: '0%', top: '1%', opacity: 0.97, scale: 1.1 },
  { s: 'treeRound', left: '7%', top: '0%', opacity: 0.95, scale: 1.05 },
  { s: 'treeRound', left: '12%', top: '-1%', opacity: 0.85, scale: 1.3, kind: 'foliage-shade' },
  { s: 'treeHigh', left: '13%', top: '3%', opacity: 0.92, flip: true, scale: 0.95 },
  { s: 'treeRound', left: '4%', top: '9%', opacity: 0.92, flip: true, scale: 1.15 },
  { s: 'bush', left: '11%', top: '11%', opacity: 0.9, scale: 1.1 },
  { s: 'treePineSmall', left: '18%', top: '5%', opacity: 0.82, scale: 0.9 },
  { s: 'treeRound', left: '17%', top: '15%', opacity: 0.88, scale: 1.0 },
  { s: 'bush', left: '1%', top: '18%', opacity: 0.88, flip: true, scale: 1.2 },
  { s: 'treePine', left: '8%', top: '20%', opacity: 0.85, scale: 0.95 },

  // --- Santuario de piedra + flor pegada: el foco memorable de este lado.
  //     Cairn apilado con rocas reales del pack, el brillo de cristal vive
  //     en CSS (drop-shadow + aura); las flores SOLAPAN la roca por arriba,
  //     como el arbol rosa creciendo del cristal en las 2 referencias
  //     homeland-*. Musgo/setas luminiscentes a la sombra, mismo sitio que
  //     la vuelta anterior. ---
  { s: 'rocksBig', left: '5%', top: '27%', opacity: 0.98, scale: 1.55, kind: 'landmark' },
  { s: 'rocksHigh', left: '12%', top: '25%', opacity: 0.95, scale: 1.35, kind: 'landmark' },
  { s: 'stones', left: '14.5%', top: '35%', opacity: 0.85, kind: 'landmark' },
  { s: 'flowers', left: '8%', top: '20%', opacity: 0.95, scale: 1.6 },
  { s: 'flowers', left: '3.5%', top: '25%', opacity: 0.88, flip: true, scale: 1.15 },
  { s: 'flowers', left: '15%', top: '23%', opacity: 0.8, scale: 0.95 },
  { s: 'mushrooms', left: '6.5%', top: '38%', opacity: 0.95, scale: 1.2, kind: 'glow' },
  { s: 'mushrooms', left: '16%', top: '33%', opacity: 0.88, flip: true, kind: 'glow' },
  { s: 'rocksLow', left: '0%', top: '40%', opacity: 0.82, scale: 1.05 },
  { s: 'bush', left: '18%', top: '39%', opacity: 0.8, scale: 0.9 },

  // --- Transicion santuario -> aldea: lo que antes era un prado de flores
  //     aparte pasa a ser solo bosque/roca de relleno, sin acento magenta
  //     propio (el magenta ya se gasto entero en el santuario de arriba) ---
  { s: 'treeRound', left: '2%', top: '48%', opacity: 0.88, scale: 1.05 },
  { s: 'rocksLow', left: '12%', top: '52%', opacity: 0.78, flip: true },
  { s: 'treePineSmall', left: '18%', top: '54%', opacity: 0.82, scale: 0.9 },
  { s: 'bush', left: '6%', top: '58%', opacity: 0.8, scale: 1.0 },

  // --- Borde de aldea: valla + cajones + un ultimo bosquecillo ---
  { s: 'treePine', left: '0%', top: '65%', opacity: 0.9, scale: 1.05 },
  { s: 'treeRound', left: '6%', top: '67%', opacity: 0.86, flip: true },
  { s: 'fence', left: '10%', top: '73%', opacity: 0.88 },
  { s: 'fence', left: '16%', top: '72%', opacity: 0.85, flip: true },
  { s: 'crate', left: '5%', top: '77%', opacity: 0.88 },
  { s: 'bush', left: '19%', top: '77%', opacity: 0.82, scale: 0.9 },
  { s: 'fence', left: '12%', top: '85%', opacity: 0.82 },
  { s: 'crate', left: '18%', top: '86%', opacity: 0.82, scale: 0.9 },
  { s: 'treeRound', left: '1%', top: '89%', opacity: 0.9, scale: 1.1 },
  { s: 'mushrooms', left: '14%', top: '93%', opacity: 0.75, scale: 0.85 },

  // --- Tira superior, por encima del topbar: apenas un asomo de copas ---
  { s: 'treeRound', left: '40%', top: '0%', opacity: 0.62, scale: 0.85 },
  { s: 'bush', left: '49%', top: '0.5%', opacity: 0.55, scale: 0.9 },
  { s: 'treeHigh', left: '58%', top: '-1%', opacity: 0.6, flip: true, scale: 0.8 },

  // --- Borde derecho: version corta (menos hueco visible), misma logica de
  //     masa solapada + sombra de volumen + su propio santuario mas pequeno
  //     con flor pegada (eco, no repeticion) ---
  { s: 'treeHigh', left: '98%', top: '0%', opacity: 0.85, scale: 1.4, kind: 'foliage-shade' },
  { s: 'treeHigh', left: '97%', top: '1%', opacity: 0.92, flip: true, scale: 1.1 },
  { s: 'treeRound', left: '93.5%', top: '6%', opacity: 0.88, scale: 1.0 },
  { s: 'treePine', left: '96%', top: '13%', opacity: 0.84, scale: 0.9 },
  { s: 'bush', left: '94%', top: '19%', opacity: 0.8, flip: true },

  { s: 'rocksHigh', left: '95%', top: '37%', opacity: 0.94, scale: 1.3, kind: 'landmark' },
  { s: 'rocksLow', left: '98%', top: '43%', opacity: 0.86, scale: 1.1, kind: 'landmark' },
  { s: 'flowers', left: '94%', top: '32%', opacity: 0.92, scale: 1.3 },
  { s: 'flowers', left: '97.5%', top: '35%', opacity: 0.8, flip: true, scale: 0.9 },
  { s: 'mushrooms', left: '96.2%', top: '46%', opacity: 0.9, kind: 'glow' },

  { s: 'treeRound', left: '95.5%', top: '55%', opacity: 0.82 },
  { s: 'bush', left: '98%', top: '58%', opacity: 0.78, scale: 0.95 },
  { s: 'fence', left: '96%', top: '71%', opacity: 0.78 },
  { s: 'crate', left: '98%', top: '77%', opacity: 0.78, scale: 0.9 },
  { s: 'treePine', left: '94.5%', top: '84%', opacity: 0.86, flip: true },
  { s: 'bush', left: '97.5%', top: '91%', opacity: 0.75, scale: 0.9 },
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

      {LANDMARK_GLOWS.map((g, i) => (
        <div
          key={`glow-${i}`}
          className={`lunacia-aura lunacia-aura-${g.variant}`}
          style={{ left: g.left, top: g.top, width: g.size, height: g.size }}
        />
      ))}

      {DECOR.map((d, i) => {
        const spec = SPECIES[d.s]
        const url = urls[d.s]
        if (!url) return null
        const kind = d.kind || KIND_BY_SPECIES[d.s]
        const scale = d.scale ?? 1
        const transform = [d.flip ? 'scaleX(-1)' : '', scale !== 1 ? `scale(${scale})` : '']
          .filter(Boolean)
          .join(' ')
        return (
          <img
            key={i}
            src={url}
            alt=""
            className={`lunacia-decor lunacia-decor-${kind}`}
            style={{
              left: d.left,
              top: d.top,
              width: spec.size,
              height: spec.size,
              opacity: d.opacity,
              transform: transform || undefined,
            }}
          />
        )
      })}

      {/* Vignette (enmarca, oscurece bordes) + lavado atmosferico (unifica la
          temperatura de color de TODA la escena, suelo y props incluidos):
          las dos van DESPUES de los props en el DOM a proposito -antes la
          vignette quedaba detras de los props y nunca los tenia. */}
      <div className="lunacia-vignette" />
      <div className="lunacia-atmosphere" />
    </div>
  )
}
