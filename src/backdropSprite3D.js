// backdropSprite3D.js — snapshots 2D de los props de Kenney que YA trae el
// proyecto para el tablero 3D (Platformer Kit + el pack Mini Forest, ambos
// CC0, ver public/models/) congelados a PNG para poblar el fondo ambiental
// (LunaciaBackdrop.jsx) con un ecosistema real en vez de bajar un pack de
// sprites 2D nuevo -pedido 2026-09-11 ("Kenney tiene ecosistemas completos
// para fondos, el que hay ahora son 3 arboles y 2 setas mal puestas"): ya
// tenemos ese ecosistema completo instalado (arboles, arbustos, flores,
// setas, rocas, valla, cesped/tierra), solo hace falta volcarlo a 2D.
//
// A diferencia de partIcon3D.js (pictograma de catalogo: UN color solido por
// clase, para que lea como icono), aqui interesa que el prop se vea como en
// el propio tablero: se conserva SU material/textura real del .glb (el
// colormap.png compartido que GLTFLoader resuelve solo, misma ruta relativa
// que ya usa Board3D.jsx), nada de recolorear.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const ICON_SIZE = 220
// Camara a media altura (ni de perfil ni cenital): los props leen como un
// elemento de fondo de un mundo 2D con algo de profundidad, sin llegar al
// picado de 30 grados del tablero (ahi arriba se veria solo la copa/techo).
const ELEV_DEG = 42
const ICON_FILL = 1.08

let sharedRenderer = null
function getRenderer() {
  if (!sharedRenderer) {
    sharedRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    sharedRenderer.setPixelRatio(2)
    sharedRenderer.setSize(ICON_SIZE, ICON_SIZE, false)
  }
  return sharedRenderer
}

// Encaja el modelo entero (no solo su huella en planta) dentro del encuadre,
// centrado -mismo criterio que partIcon3D.js, aqui con mas aire (ICON_FILL
// mas bajo) porque estos sprites se recortan por su silueta real, no por un
// marco cuadrado de carta.
function fitAndPlace(obj) {
  const box = new THREE.Box3().setFromObject(obj)
  const size = new THREE.Vector3()
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z, 1e-6)
  const fit = ICON_FILL / maxDim
  obj.scale.setScalar(fit)
  const center = new THREE.Vector3()
  box.getCenter(center)
  obj.position.x = -center.x * fit
  obj.position.y = -center.y * fit
  obj.position.z = -center.z * fit
}

const cache = new Map()

// url: ruta del .glb bajo /models (mismo host que Board3D.jsx, colormap.png
// se resuelve solo por ruta relativa al .glb).
export function backdropSpriteUrl(url) {
  const hit = cache.get(url)
  if (hit) return hit

  const p = new Promise((resolve) => {
    let renderer = null
    try {
      renderer = getRenderer()
      const scene = new THREE.Scene()
      scene.add(new THREE.AmbientLight(0xffffff, 1.05))
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.0)
      keyLight.position.set(0.7, 1.1, 0.8)
      scene.add(keyLight)
      const fill = new THREE.DirectionalLight(0xffffff, 0.45)
      fill.position.set(-0.7, 0.4, -0.5)
      scene.add(fill)

      const elevRad = (ELEV_DEG * Math.PI) / 180
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100)
      camera.position.set(0, 40 * Math.sin(elevRad), 40 * Math.cos(elevRad))
      camera.lookAt(0, 0, 0)

      new GLTFLoader().load(
        url,
        (loaded) => {
          const world = loaded.scene
          fitAndPlace(world)
          scene.add(world)
          renderer.setSize(ICON_SIZE, ICON_SIZE, false)
          renderer.render(scene, camera)
          const dataUrl = renderer.domElement.toDataURL('image/png')
          world.traverse((child) => {
            if (child.isMesh) {
              child.geometry?.dispose()
              if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose())
              else child.material?.dispose?.()
            }
          })
          resolve(dataUrl)
        },
        undefined,
        () => resolve(null),
      )
    } catch {
      resolve(null)
    }
  })

  cache.set(url, p)
  return p
}
