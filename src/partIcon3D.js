// partIcon3D.js — pictogramas 3D de las 6 partes del cuerpo del Axie, para las
// caras del dado del dashboard (el usuario pidio que cada cara lleve el logo de
// la parte; la fuente son "los resources que nos da Axie en el Vibeathon", el
// mismo pack 3D oficial que ya usa el tablero: public/assets/axie).
//
// Cada parte es un .glb SOLO de geometria (sin material propio: el mixer le pone
// la textura compartida), asi que lo que se dibuja es la silueta real del modelo,
// coloreada con el color de la clase del Axie (mismo valor de colorVariants que
// axieGeneCatalog usa para teñir el roster). La geometria es la REAL de la parte
// (socket-local del pack), que es lo importante: "el logo" de Imp, de Balloon,
// de Ojos... es esa parte fisica del Axie.
//
// Se renderiza UNA vez por (clase, ranura) y se cachea como data URL (18 iconos
// en total para el MVP1), reutilizados por todas las cartas. Un renderer WebGL
// compartido minimo, oculto, que no se toca en ningun otro sitio de la app.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const SLOT_FILE = {
  eyes: 'Eye',
  ears: 'Ear',
  horn: 'Horn',
  mouth: 'Mouth',
  back: 'Back',
  tail: 'Tail',
}

const CLASS_FILE = {
  beast: 'Beast',
  bird: 'Bird',
  aqua: 'Aquatic',
  plant: 'Plant',
  bug: 'Bug',
  reptile: 'Reptile',
}

// Mismo color por clase que axieGeneCatalog.js (colorValue real de cada clase).
const CLASS_COLOR = {
  Beast: 0xf5a037,
  Aquatic: 0x00b8ff,
  Bird: 0xff99b0,
  Bug: 0xff433e,
  Reptile: 0xc569cf,
  Plant: 0xafdb1b,
}

const BASE = '/assets/axie/socket-local-parts/final-unity/standard-parts'
const ICON_SIZE = 72
// La camara ortografica ve +/-1 unidad en cada eje (2 unidades de alto): el
// modelo se escala a ~1.2 de su dimension mayor para que llene ~60% del icono
// con margenes de aire alrededor, como un pictograma de catalogo.
const ICON_FILL = 1.2

let sharedRenderer = null
function getRenderer() {
  if (!sharedRenderer) {
    sharedRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    sharedRenderer.setPixelRatio(1)
    sharedRenderer.setSize(ICON_SIZE, ICON_SIZE, false)
  }
  return sharedRenderer
}

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

export function partIconUrl(classKey, slotKey) {
  const fileClass = CLASS_FILE[classKey]
  const fileSlot = SLOT_FILE[slotKey]
  if (!fileClass || !fileSlot) return Promise.resolve(null)
  const key = `${classKey}-${slotKey}`
  const hit = cache.get(key)
  if (hit) return hit

  const url = `${BASE}/S00_${fileClass}02_L1_${fileSlot}.glb`
  const p = new Promise((resolve) => {
    let renderer = null
    let scene = null
    try {
      renderer = getRenderer()
      scene = new THREE.Scene()
      scene.add(new THREE.AmbientLight(0xffffff, 1.0))
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.1)
      keyLight.position.set(0.6, 1, 0.9)
      scene.add(keyLight)
      const fill = new THREE.DirectionalLight(0xffffff, 0.4)
      fill.position.set(-0.8, 0.3, -0.6)
      scene.add(fill)

      const elevRad = (30 * Math.PI) / 180
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100)
      camera.position.set(0, 40 * Math.sin(elevRad), 40 * Math.cos(elevRad))
      camera.lookAt(0, 0, 0)

      const color = CLASS_COLOR[fileClass] ?? 0xeaf3ef
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.72,
        metalness: 0.08,
        flatShading: false,
      })

      new GLTFLoader().load(
        url,
        (loaded) => {
          const world = loaded.scene
          world.traverse((child) => {
            if (child.isMesh) {
              child.material = material
            }
          })
          fitAndPlace(world)
          scene.add(world)
          renderer.render(scene, camera)
          const dataUrl = renderer.domElement.toDataURL('image/png')
          // La geometria de este icono ya no se necesita: se tira tras capturar.
          world.traverse((child) => {
            if (child.isMesh) {
              child.geometry?.dispose()
              child.material?.dispose?.()
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

  cache.set(key, p)
  return p
}