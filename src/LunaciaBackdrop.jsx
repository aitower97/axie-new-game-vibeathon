// LunaciaBackdrop.jsx — fondo ambiental 2D, puramente decorativo, detras del
// tablero (el canvas WebGL de Board3D usa alpha:true sin setClearColor, asi
// que su margen transparente deja ver esta capa por debajo -confirmado en
// vivo, ver CLAUDE.md).
//
// CUARTA VUELTA (2026-09-14, "desde cero otra vez, dibuja tus propias
// escenas en vez de reciclar sprites de Kenney"): las tres vueltas
// anteriores mejoraron color, contraste y conexion (camino+corral en SVG)
// pero seguian usando los MISMOS sprites 3D genericos de Kenney -recoloreados-
// para el cristal, la flor y (nunca hubo) una choza. Comparado contra las
// referencias reales (Homeland/Terrariums, ver titulo/fondo-refs/), un cono
// generico con un filtro de color nunca iba a leerse como un cristal
// incrustado en roca ni como un arbol de flor magenta: el problema era la
// FORMA, no el tono.
//
// Cambio de tecnica en esta vuelta: los 3 elementos PROTAGONISTAS de la
// escena (el santuario de cristal, el arbol de flor, la choza) se dibujan
// como SVG propio -mismo enfoque que ya funciono bien en public/brand/logo.svg
// (formas vectoriales originales, inspiradas en la referencia, nunca un
// calco): poligonos para la roca y los cristales (con un glow SVG real via
// feGaussianBlur+feMerge, no solo drop-shadow), circulos superpuestos para
// la copa de flor (mismo lenguaje "blob redondeado" que VineIcon), y un
// trapecio+triangulo con patron a rayas para la choza. Los arboles/arbustos
// genericos de Kenney SIGUEN usandose, pero solo como masa de bosque de
// relleno en el perimetro -ya no intentan hacer de cristal ni de flor.
// El camino de tierra y el corral de valla (SVG, geometria exacta) de la
// vuelta anterior se conservan tal cual: ya conectaban bien de verdad.
//
// Composicion por lado (izquierda = principal, derecha = eco mas corto):
// 1. Bosque de borde (Kenney, arriba) -limite exterior del claro.
// 2. Santuario de cristal (SVG propio) + arbol de flor (SVG propio) pegado,
//    igual que en las 2 referencias homeland-*.
// 3. Camino de tierra (SVG) bajando desde el santuario.
// 4. Una choza (SVG propio) junto al camino -lo que las 3 vueltas
//    anteriores no tenian ("no hay casas").
// 5. Corral de valla (SVG) con cajones reales de Kenney dentro, al final
//    del camino.
import { useEffect, useState } from 'react'
import grassPlain from './assets/backdrop/grass-plain.png'
import grassFlower from './assets/backdrop/grass-flower.png'
import { backdropSpriteUrl } from './backdropSprite3D'

// Especie Kenney -> .glb real del pack + tamano base en pantalla. Solo
// relleno de bosque y flavor de aldea (cajones/postes) -el cristal, la flor
// y la choza ya no vienen de aqui, ver SCENES mas abajo.
const SPECIES = {
  treePine: { url: '/models/tree-pine.glb', size: 108 },
  treePineSmall: { url: '/models/tree-pine-small.glb', size: 68 },
  treeRound: { url: '/models/mini-forest/tree.glb', size: 104 },
  treeHigh: { url: '/models/mini-forest/tree-high.glb', size: 146 },
  bush: { url: '/models/mini-forest/plant.glb', size: 60 },
  mushrooms: { url: '/models/mushrooms.glb', size: 36 },
  fence: { url: '/models/fence-low-straight.glb', size: 62 },
  crate: { url: '/models/crate.glb', size: 44 },
}

const KIND_BY_SPECIES = {
  treePine: 'foliage',
  treePineSmall: 'foliage',
  treeRound: 'foliage',
  treeHigh: 'foliage',
  bush: 'foliage',
  mushrooms: 'mushroom',
  fence: 'village',
  crate: 'village',
}

// Halo ambiental detras del santuario de cristal dibujado (SCENES abajo) —
// complementa el glow SVG propio del cristal (feGaussianBlur) con un bloom
// mas amplio y difuso sobre el cesped, mismo par de colores (ambar+violeta).
const LANDMARK_GLOWS = [
  { left: '8%', top: '25%', size: 250, variant: 'left' },
  { left: '93%', top: '31%', size: 190, variant: 'right' },
]

// Caminos de tierra: dos pasadas por lado (una mas ancha y oscura debajo,
// una mas estrecha y clara encima) para que se lea como un sendero pisado,
// no una linea plana. Salen del borde inferior del mundo y suben hasta el
// santuario de cada lado. Geometria sin cambios respecto a la vuelta
// anterior -ya conectaba bien de verdad.
const PATHS = [
  { side: 'left', d: 'M 11 99 Q 4 88 8 79 Q 13 70 7.5 60 Q 2.5 50 8 41' },
  { side: 'right', d: 'M 90 99 Q 96 89 92.5 80 Q 89 71 93.5 61 Q 97.5 51 93.5 42' },
]

// Corrales: rectangulo punteado (evoca postes de valla en fila) con una
// puerta -hueco en el lado inferior, donde entra el camino- flanqueada por
// 2 postes de valla reales del pack. Sin cambios respecto a la vuelta
// anterior.
const CORRALS = [
  { side: 'left', x: 1.5, y: 68, w: 15, h: 21, gateX: 6.5, gateW: 4.5 },
  { side: 'right', x: 84, y: 70, w: 13.5, h: 17, gateX: 89, gateW: 4 },
]

const FENCE_POSTS = CORRALS.flatMap((c) => [
  { s: 'fence', left: `${c.gateX - 2.5}%`, top: `${c.y + c.h - 3}%`, opacity: 0.9, scale: 0.85 },
  { s: 'fence', left: `${c.gateX + c.gateW - 1}%`, top: `${c.y + c.h - 3}%`, opacity: 0.9, scale: 0.85, flip: true },
])

// Bosque de relleno (Kenney real, recoloreado por familia) + flavor de
// aldea (cajones dentro del corral). Ya NO incluye rocas/flores sueltas: esas
// zonas las cubren ahora los SVG propios de SCENES.
const DECOR = [
  // --- Bosque de borde, izquierda: el limite exterior del claro ---
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

  // --- Detras del santuario dibujado: una copa asomando + un par de setas
  //     luminiscentes como polvo magico junto al cristal ---
  { s: 'treeRound', left: '1%', top: '23%', opacity: 0.7, scale: 0.9, kind: 'foliage-shade' },
  { s: 'mushrooms', left: '6.5%', top: '38%', opacity: 0.92, scale: 1.05, kind: 'glow' },
  { s: 'mushrooms', left: '16%', top: '34%', opacity: 0.85, flip: true, kind: 'glow' },

  // --- Arboles flanqueando el camino, entre el santuario y la choza ---
  { s: 'treeRound', left: '13%', top: '44%', opacity: 0.85, scale: 1.0 },
  { s: 'bush', left: '0%', top: '48%', opacity: 0.82, scale: 1.0 },

  // --- Junto a la choza y camino abajo, hacia el corral ---
  { s: 'treePineSmall', left: '15%', top: '68%', opacity: 0.8, scale: 0.9 },
  { s: 'bush', left: '19%', top: '75%', opacity: 0.78, scale: 0.9, flip: true },

  // --- Corral: cajones DENTRO del rectangulo que dibuja CORRALS ---
  { s: 'crate', left: '4%', top: '76%', opacity: 0.92, scale: 1.05 },
  { s: 'crate', left: '9%', top: '80%', opacity: 0.9, scale: 0.9 },
  { s: 'crate', left: '12.5%', top: '75%', opacity: 0.88, scale: 0.95, flip: true },

  // --- Bosque tras el corral: cierra la villa por detras ---
  { s: 'treePine', left: '0%', top: '90%', opacity: 0.9, scale: 1.05 },
  { s: 'treeRound', left: '17%', top: '91%', opacity: 0.86, flip: true, scale: 1.05 },
  { s: 'mushrooms', left: '9%', top: '94%', opacity: 0.7, scale: 0.8 },

  // --- Tira superior, por encima del topbar: apenas un asomo de copas ---
  { s: 'treeRound', left: '40%', top: '0%', opacity: 0.62, scale: 0.85 },
  { s: 'bush', left: '49%', top: '0.5%', opacity: 0.55, scale: 0.9 },
  { s: 'treeHigh', left: '58%', top: '-1%', opacity: 0.6, flip: true, scale: 0.8 },

  // --- Borde derecho: eco mas corto de la misma logica ---
  { s: 'treeHigh', left: '98%', top: '0%', opacity: 0.85, scale: 1.4, kind: 'foliage-shade' },
  { s: 'treeHigh', left: '97%', top: '1%', opacity: 0.92, flip: true, scale: 1.1 },
  { s: 'treeRound', left: '93.5%', top: '6%', opacity: 0.88, scale: 1.0 },
  { s: 'treePine', left: '96%', top: '13%', opacity: 0.84, scale: 0.9 },
  { s: 'bush', left: '94%', top: '19%', opacity: 0.8, flip: true },

  { s: 'mushrooms', left: '96.5%', top: '41%', opacity: 0.9, kind: 'glow' },
  { s: 'mushrooms', left: '87.5%', top: '36%', opacity: 0.8, flip: true, kind: 'glow' },

  { s: 'treeRound', left: '85%', top: '47%', opacity: 0.84, scale: 0.95 },
  { s: 'bush', left: '99%', top: '55%', opacity: 0.78, scale: 0.9 },
  { s: 'treePineSmall', left: '87%', top: '68%', opacity: 0.78, flip: true, scale: 0.85 },

  { s: 'crate', left: '87%', top: '76%', opacity: 0.88, scale: 0.95 },
  { s: 'crate', left: '92%', top: '79%', opacity: 0.85, scale: 0.8, flip: true },
  { s: 'treePine', left: '94.5%', top: '90%', opacity: 0.86, flip: true, scale: 1.0 },
  { s: 'treeRound', left: '82%', top: '89%', opacity: 0.8, scale: 0.95 },
]

// Escenas dibujadas a mano (SVG propio, autocontenido): el santuario de
// cristal, el arbol de flor y la choza. left/top son el punto de anclaje
// (esquina superior izquierda, mismo criterio que DECOR) y width/height van
// en px, guardando la MISMA proporcion que el viewBox de cada motivo -asi
// nunca se estiran ni deforman.
const SCENES = [
  { id: 'crystal-left', type: 'crystal', left: '3%', top: '19%', width: 200, height: 186 },
  { id: 'flower-left', type: 'flowerTree', left: '12.5%', top: '13%', width: 150, height: 188 },
  { id: 'hut-left', type: 'hut', left: '18.5%', top: '52%', width: 148, height: 133 },

  { id: 'crystal-right', type: 'crystal', left: '88%', top: '25%', width: 165, height: 153, flip: true },
  { id: 'flower-right', type: 'flowerTree', left: '94.5%', top: '20%', width: 118, height: 148, flip: true },
  { id: 'hut-right', type: 'hut', left: '79%', top: '54%', width: 116, height: 104, flip: true },
]

// Gradientes/patrones/filtro compartidos por TODAS las escenas (izq+der) -un
// solo bloque de <defs>, referenciado por url(#id) desde cualquier <svg> de
// la pagina (los ids de SVG inline se resuelven a nivel de documento).
function SceneDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lunCrystalAmber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2bc" />
          <stop offset="1" stopColor="#ffab2e" />
        </linearGradient>
        <linearGradient id="lunCrystalViolet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6c8ff" />
          <stop offset="1" stopColor="#8b4fe0" />
        </linearGradient>
        <radialGradient id="lunPetal" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ffd7ef" />
          <stop offset="55%" stopColor="#ff86ce" />
          <stop offset="100%" stopColor="#d63fa8" />
        </radialGradient>
        <pattern id="lunThatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="10" height="10" fill="#e0a758" />
          <rect width="5" height="10" fill="#c07f34" />
        </pattern>
        <filter id="lunCrystalGlow" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="4.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}

// El santuario de cristal: roca gris-violeta (varios poligonos superpuestos
// para dar facetas, como el volumen de roca de homeland-1-oasis-cristal y
// homeland-2-pantano-cristal) con un cristal ambar central + dos esquirlas
// violeta a un lado, con glow SVG real (feGaussianBlur+feMerge) en vez de
// solo drop-shadow -asi el brillo tiene borde propio, no solo un halo.
function CrystalMotif({ flip }) {
  return (
    <svg
      viewBox="0 0 140 130"
      className="lunacia-scene-svg lunacia-crystal-svg"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <polygon
        points="8,120 14,86 34,66 55,60 62,66 80,54 104,64 122,100 128,120 118,128 20,128"
        fill="#8b7fa3"
        stroke="#4f4463"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <polygon points="34,66 55,60 50,96 30,98" fill="#a79bc0" opacity="0.65" />
      <polygon points="62,66 80,54 92,100 68,104" fill="#6d5689" opacity="0.55" />
      <polygon points="90,60 104,64 116,98 96,102" fill="#7a6d94" opacity="0.5" />
      <g filter="url(#lunCrystalGlow)">
        <polygon
          points="55,58 63,8 71,58 66,64 60,64"
          fill="url(#lunCrystalAmber)"
          stroke="#c67a12"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <polygon
          points="78,54 84,22 90,54"
          fill="url(#lunCrystalViolet)"
          stroke="#6a35a8"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <polygon
          points="90,58 95,32 100,58"
          fill="url(#lunCrystalViolet)"
          opacity="0.85"
          stroke="#6a35a8"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <circle cx="63" cy="42" r="5.5" fill="#fff4cf" opacity="0.85" />
      </g>
    </svg>
  )
}

// El arbol de flor: tronco+ramas (trazo curvo simple) y una copa hecha de
// varios circulos superpuestos en magenta/rosa (mismo lenguaje "blob
// redondeado" que VineIcon) -pegado al cristal, igual que en las dos
// referencias homeland-*, nunca suelto en su propio prado.
function FlowerTreeMotif() {
  return (
    <svg viewBox="0 0 120 150" className="lunacia-scene-svg lunacia-flower-svg" aria-hidden="true" focusable="false">
      <path
        d="M62,148 C60,120 66,104 58,88 M60,104 C64,92 74,84 84,80 M58,88 C50,78 42,68 44,54"
        fill="none"
        stroke="#6b4a2a"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="46" cy="48" r="26" fill="url(#lunPetal)" />
      <circle cx="74" cy="40" r="30" fill="url(#lunPetal)" />
      <circle cx="60" cy="66" r="24" fill="url(#lunPetal)" opacity="0.94" />
      <circle cx="90" cy="62" r="18" fill="url(#lunPetal)" opacity="0.86" />
      <circle cx="30" cy="64" r="17" fill="url(#lunPetal)" opacity="0.86" />
      <circle cx="52" cy="38" r="8" fill="#ffe9f8" opacity="0.55" />
      <circle cx="80" cy="32" r="9" fill="#ffe9f8" opacity="0.5" />
    </svg>
  )
}

// Una choza simple: pared trapezoidal calida + techo triangular de paja con
// un patron de rayas diagonales (lunThatch), puerta, dos ventanas redondas y
// un banderin en la punta del techo -lo que las 3 vueltas anteriores no
// tenian ("no hay casas"), inspirado en las chozas de terrariums-1-aldea y
// los techos de paja de homeland-1-oasis-cristal.
function HutMotif({ flip }) {
  return (
    <svg
      viewBox="0 0 100 90"
      className="lunacia-scene-svg lunacia-hut-svg"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20,88 L20,56 L50,47 L80,56 L80,88 Z" fill="#e7c88a" stroke="#a9762f" strokeWidth="2.4" strokeLinejoin="round" />
      <rect x="41" y="66" width="18" height="22" rx="2" fill="#7a4a24" stroke="#5a3517" strokeWidth="1.2" />
      <path d="M10,56 L50,22 L90,56 Z" fill="url(#lunThatch)" stroke="#7a4a1f" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M50,22 L50,8" stroke="#5a3517" strokeWidth="2" strokeLinecap="round" />
      <path d="M50,8 L63,12.5 L50,17 Z" fill="#7fe7c4" />
      <circle cx="30" cy="64" r="5" fill="#6fc6e0" stroke="#3a5f73" strokeWidth="1.6" />
      <circle cx="70" cy="64" r="5" fill="#6fc6e0" stroke="#3a5f73" strokeWidth="1.6" />
    </svg>
  )
}

const MOTIF_BY_TYPE = { crystal: CrystalMotif, flowerTree: FlowerTreeMotif, hut: HutMotif }

export default function LunaciaBackdrop() {
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

  const decorAndPosts = [...DECOR, ...FENCE_POSTS]

  return (
    <div className="lunacia-backdrop" aria-hidden="true">
      <div className="lunacia-grass" style={{ backgroundImage: `url(${grassPlain})` }} />
      <div className="lunacia-grass lunacia-grass-detail" style={{ backgroundImage: `url(${grassFlower})` }} />

      <SceneDefs />

      {LANDMARK_GLOWS.map((g, i) => (
        <div
          key={`glow-${i}`}
          className={`lunacia-aura lunacia-aura-${g.variant}`}
          style={{ left: g.left, top: g.top, width: g.size, height: g.size }}
        />
      ))}

      {/* Camino + corral: geometria SVG exacta (0-100 = %), pintada sobre el
          cesped y bajo los props reales (arboles/cajones les tapan los
          bordes al solaparse, como pisadas reales sobre tierra). */}
      <svg className="lunacia-paths" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {PATHS.map((p) => (
          <g key={p.side}>
            <path d={p.d} className="lunacia-path-wide" />
            <path d={p.d} className="lunacia-path-narrow" />
          </g>
        ))}
        {CORRALS.map((c) => {
          const gateEnd = c.gateX + c.gateW
          const bottom = c.y + c.h
          const d = `M ${c.x} ${c.y} H ${c.x + c.w} V ${bottom} H ${gateEnd} M ${c.x} ${bottom} H ${c.x} V ${c.y}`
          const dGateSide = `M ${c.x} ${bottom} H ${c.gateX}`
          return (
            <g key={c.side}>
              <path d={d} className="lunacia-corral-fence" />
              <path d={dGateSide} className="lunacia-corral-fence" />
            </g>
          )
        })}
      </svg>

      {/* Escenas dibujadas a mano: cristal, flor y choza. Van despues del
          camino/corral y antes del bosque de relleno, para que algunos
          arboles puedan solaparse por delante y dar profundidad. */}
      {SCENES.map((sc) => {
        const Motif = MOTIF_BY_TYPE[sc.type]
        return (
          <div
            key={sc.id}
            className="lunacia-scene-wrap"
            style={{ left: sc.left, top: sc.top, width: sc.width, height: sc.height }}
          >
            <Motif flip={sc.flip} />
          </div>
        )
      })}

      {decorAndPosts.map((d, i) => {
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

      <div className="lunacia-vignette" />
      <div className="lunacia-atmosphere" />
    </div>
  )
}
