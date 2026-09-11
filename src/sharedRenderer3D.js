// sharedRenderer3D.js — un UNICO WebGLRenderer (un unico contexto WebGL) para
// TODAS las cartas 3D del dashboard (retratos Portrait3D y dados Die3D).
//
// Por que hace falta: cada carta creaba antes su propio renderer/canvas. Con
// 2 Lords + 6 unidades esto son 8 Portrait3D + 6 Die3D = 14 contextos WebGL
// solo en el dashboard, mas el del tablero (Board3D) = 15 en total — al
// limite tipico del navegador (~16, "WebGL: too many contexts, losing the
// oldest" visto real en consola). Board3D se queda con su propio contexto
// (escena grande, vive todo el tiempo); las cartas, en cambio, son muchas y
// pequenas, perfectas para compartir un solo contexto entre todas.
//
// Cada carta sigue teniendo su propia escena/camara/objetos 3D (cada una
// dibuja un Axie o un dado distintos, con su propia animacion) — lo unico
// compartido es el renderer y su canvas WebGL oculto. Un unico bucle central
// recorre las cartas registradas, dibuja cada una en el canvas compartido y
// vuelca el resultado (drawImage) sobre el <canvas 2D> visible de esa carta.
import * as THREE from 'three'

let renderer = null
let clock = null
let frameId = null
const entries = new Map()

export function getSharedPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, 2)
}

function ensureRenderer() {
  if (renderer) return renderer
  const canvas = document.createElement('canvas')
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(getSharedPixelRatio())
  clock = new THREE.Clock()
  return renderer
}

function loop() {
  frameId = requestAnimationFrame(loop)
  if (entries.size === 0) return
  const dt = Math.min(clock.getDelta(), 0.05)
  const pr = renderer.getPixelRatio()
  for (const entry of entries.values()) {
    entry.update?.(dt)
    const px = Math.max(1, Math.round(entry.size * pr))
    renderer.setSize(entry.size, entry.size, false)
    renderer.setClearColor(0x000000, 0)
    renderer.clear(true, true, true)
    renderer.render(entry.scene, entry.camera)
    entry.ctx.clearRect(0, 0, entry.canvas.width, entry.canvas.height)
    entry.ctx.drawImage(renderer.domElement, 0, 0, px, px, 0, 0, entry.canvas.width, entry.canvas.height)
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
