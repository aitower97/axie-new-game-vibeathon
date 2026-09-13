// sharedRenderer3D.js — un UNICO WebGLRenderer (un unico contexto WebGL) para
// TODAS las cartas 3D del dashboard (retratos Portrait3D y dados Die3D/LordDie3D).
//
// Por que hace falta: cada carta creaba antes su propio renderer/canvas. Con
// 2 Lords + 6 unidades esto son 8 Portrait3D + 8 Die3D/LordDie3D = 16
// contextos WebGL solo en el dashboard, mas el del tablero (Board3D) = 17 en
// total — por encima del limite tipico del navegador (~16, "WebGL: too many
// contexts, losing the oldest" visto real en consola). Board3D se queda con
// su propio contexto (escena grande, vive todo el tiempo); las cartas, en
// cambio, son muchas y pequenas, perfectas para compartir un solo contexto
// entre todas.
//
// Cada carta sigue teniendo su propia escena/camara/objetos 3D (cada una
// dibuja un Axie o un dado distintos, con su propia animacion) — lo unico
// compartido es el renderer y su canvas WebGL oculto. Un unico bucle central
// recorre las cartas registradas, dibuja cada una en el canvas compartido y
// vuelca el resultado (drawImage) sobre el <canvas 2D> visible de esa carta.
//
// ATLAS en vez de redimensionar+leer por carta (sesión 2026-09-11, "se ha
// perdido la fluidez del tablero"): la version anterior hacia, para cada
// carta, `setSize` + `render` + `drawImage` SEGUIDOS -leer (drawImage) el
// canvas WebGL justo despues de renderizar fuerza una sincronizacion
// GPU->CPU (flush) cada vez. Con 16 cartas registradas eso son 16
// sincronizaciones seguidas cada frame: medido con un trace de Performance
// real (Chrome DevTools) durante un arrastre del tablero, el bucle de este
// archivo por si solo ocupaba 70-90ms de CADA frame -aunque Board3D.jsx
// tiene su PROPIO contexto WebGL aparte, el jank se notaba igual porque
// ambos corren en el MISMO hilo de JS: 16 sincronizaciones GPU aqui le
// robaban al frame el tiempo que Board3D necesitaba para aplicar el pan.
// Ahora todas las cartas se renderizan en su propio recuadro FIJO
// (viewport+scissor) de un unico canvas-atlas, SIN leer nada todavia; solo
// cuando las 16 ya estan dibujadas se hacen las 16 lecturas seguidas -la
// GPU solo se sincroniza de verdad en la PRIMERA lectura de esa segunda
// pasada, las siguientes leen del mismo framebuffer ya resuelto (mucho mas
// baratas). Separar "renderizar todo" de "leer todo" es lo que colapsa 16
// stalls en, efectivamente, 1.
import * as THREE from 'three'

let renderer = null
let clock = null
let frameId = null
const entries = new Map()

export function getSharedPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, 2)
}

// Tamaño de cada recuadro del atlas, en pixeles de DISPOSITIVO: cubre el
// mayor `size * pixelRatio` que pide cualquier carta hoy (LordDie3D a 78px,
// 78*2=156 con pantallas de alta densidad), con margen para que ninguna
// carta salga borrosa por quedarse corta de resolucion en su recuadro.
const TILE_SIZE = 200
const ATLAS_COLS = 4

function ensureRenderer() {
  if (renderer) return renderer
  const canvas = document.createElement('canvas')
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
  // pixelRatio SIEMPRE 1 aqui: el atlas ya esta dimensionado en pixeles de
  // dispositivo a mano (TILE_SIZE), así que dejar que three.js multiplique
  // OTRA VEZ por el pixelRatio del sistema descuadraria toda la matematica
  // de viewport/scissor de abajo. getSharedPixelRatio() sigue existiendo
  // para que cada carta (Die3D/Portrait3D/LordDie3D) sepa a que resolucion
  // crear SU PROPIO canvas 2D de destino -no tiene relacion con esto.
  renderer.setPixelRatio(1)
  clock = new THREE.Clock()
  return renderer
}

function loop() {
  frameId = requestAnimationFrame(loop)
  if (entries.size === 0) return
  const dt = Math.min(clock.getDelta(), 0.05)

  const rows = Math.max(1, Math.ceil(entries.size / ATLAS_COLS))
  const atlasW = ATLAS_COLS * TILE_SIZE
  const atlasH = rows * TILE_SIZE
  if (renderer.domElement.width !== atlasW || renderer.domElement.height !== atlasH) {
    renderer.setSize(atlasW, atlasH, false)
  }
  renderer.setClearColor(0x000000, 0)
  renderer.setScissorTest(true)

  // Pase 1: actualizar + RENDERIZAR cada carta en su propio recuadro del
  // atlas (viewport+scissor), sin leer nada todavia.
  const slots = []
  let i = 0
  for (const entry of entries.values()) {
    entry.update?.(dt)
    const col = i % ATLAS_COLS
    const row = Math.floor(i / ATLAS_COLS)
    const x = col * TILE_SIZE
    const yTop = row * TILE_SIZE // origen arriba-izquierda (para drawImage, pase 2)
    const yGL = atlasH - yTop - TILE_SIZE // WebGL: viewport/scissor usan origen abajo-izquierda
    renderer.setViewport(x, yGL, TILE_SIZE, TILE_SIZE)
    renderer.setScissor(x, yGL, TILE_SIZE, TILE_SIZE)
    renderer.clear(true, true, true)
    renderer.render(entry.scene, entry.camera)
    slots.push({ entry, x, yTop })
    i++
  }
  renderer.setScissorTest(false)

  // Pase 2: leer TODAS las cartas del atlas ya renderizado (ver comentario
  // de cabecera: esto es lo que colapsa N sincronizaciones GPU en ~1).
  for (const { entry, x, yTop } of slots) {
    entry.ctx.clearRect(0, 0, entry.canvas.width, entry.canvas.height)
    entry.ctx.drawImage(renderer.domElement, x, yTop, TILE_SIZE, TILE_SIZE, 0, 0, entry.canvas.width, entry.canvas.height)
  }
}

// entry: { scene, camera, size, canvas (2D visible), ctx (2D context), update(dt) }
// Devuelve una funcion para desregistrar la carta (llamarla al desmontar).
export function registerRenderable(id, entry) {
  ensureRenderer()
  entries.set(id, entry)
  if (!frameId) loop()
  return () => {
    entries.delete(id)
  }
}
