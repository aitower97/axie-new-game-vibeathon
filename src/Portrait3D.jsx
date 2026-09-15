// Portrait3D.jsx — retrato del Axie en las cartas del dashboard, con el MISMO
// modelo 3D que pisa el tablero (mismo mixer compartido, ver axieMixer3D.js y
// Board3D.jsx, mismo descriptor/genoma). Un mini-canvas WebGL por carta que solo
// dibuja ese Axie: escena minima (luz ambiental + direccional), camara ortografica
// con el mismo angulo del tablero, animacion idle real del mixer y un giro lento
// tipo peonza para que el coleccionable se vea vivo sin moverse el dedo.
//
// El encuadre se recalcula en cada frame desde la caja real del Axie ya escalado
// (Box3 del wrapper): asi el bicho llena el hueco pase lo que pase (Axie mas alto
// que ancho, cuerpo sumo de los Lords, giro en curso, etc.) sin margenes
// adivinados. La camara es ortografica, igual que la del tablero: sin escorzo,
// la figura nunca se deforma con el giro.
import { memo, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { getSharedAxieMixer3D } from './axieMixer3D'
import { AXIE_SAMPLE_GENES } from './Board3D'
import { registerRenderable, getSharedPixelRatio } from './sharedRenderer3D'

let portraitSeed = 0
const persistentPortraits = new Map()

function Portrait3D({ descriptor, genes, size = 44, className, cacheKey }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const persistentKey = cacheKey ? `${cacheKey}:${size}` : null
    const cached = persistentKey ? persistentPortraits.get(persistentKey) : null
    if (cached) {
      host.appendChild(cached.canvas)
      const unregister = registerRenderable(cached.id, cached.entry)
      return () => {
        unregister()
        if (cached.canvas.parentNode === host) host.removeChild(cached.canvas)
      }
    }
    let disposed = false
    let axie = null
    let wrapper = null
    const seed = ++portraitSeed

    const scene = new THREE.Scene()

    const ambient = new THREE.AmbientLight(0xffffff, 0.9)
    scene.add(ambient)
    const key = new THREE.DirectionalLight(0xffffff, 0.9)
    key.position.set(4, 10, 6)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.35)
    fill.position.set(-4, 6, -6)
    scene.add(fill)

    // Mismo angulo "de mesa" que el tablero (Board3D.jsx): 30 grados de
    // inclinacion en el eje X. El giro tipo peonza lo hace el propio Axie
    // (wrapper.rotation.y, en el bucle de render), no la camara.
    const elevRad = (30 * Math.PI) / 180
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
    camera.position.set(0, 30 * Math.sin(elevRad), 30 * Math.cos(elevRad))

    // Canvas 2D visible: el dibujo real ocurre en el WebGLRenderer COMPARTIDO
    // (sharedRenderer3D.js, un unico contexto WebGL para todas las cartas) y
    // se vuelca aqui cada frame con drawImage — asi cada carta tiene su
    // propia escena/camara/Axie pero no abre un contexto WebGL propio.
    const pr = getSharedPixelRatio()
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(size * pr))
    canvas.height = canvas.width
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    const ctx2d = canvas.getContext('2d')
    host.appendChild(canvas)

    getSharedAxieMixer3D()
      .then((mixer) => {
        if (disposed) return null
        return descriptor
          ? mixer.create({
              descriptor,
              quality: 'balanced',
              artMode: 'faithful',
              strict: true,
            })
          : mixer.createFromGenes({
              axieId: `portrait-${seed}`,
              genes: genes || AXIE_SAMPLE_GENES,
              quality: 'balanced',
              artMode: 'faithful',
              strict: true,
            })
      })
      .then((created) => {
        if (disposed || !created) return
        axie = created
        wrapper = axie.wrapper

        // Escalado para que el Axie ocupe un hueco de peana equivalente al del
        // tablero (spacing ~1) y asentado con la base en y=0, como en el juego.
        const box = new THREE.Box3().setFromObject(wrapper)
        const size3 = new THREE.Vector3()
        box.getSize(size3)
        const fit = 1.8 / Math.max(size3.x, size3.z, 0.001)
        wrapper.scale.setScalar(fit)
        wrapper.position.set(0, -box.min.y * fit, 0)
        wrapper.rotation.y = 0.6
        axie.setMoveSpeed(0)
        scene.add(wrapper)

        camera.lookAt(0, wrapper.position.y + size3.y * fit * 0.5, 0)
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Portrait3D: no se pudo cargar el Axie 3D', err)
      })

    const entry = {
      scene,
      camera,
      size,
      canvas,
      ctx: ctx2d,
      update(dt) {
        if (!wrapper) return
        wrapper.rotation.y += dt * 0.7
        axie.update(dt)
        // Encuadre adaptativo: la caja real en cada frame (el giro cambia el
        // ancho proyectado), con margen ancho para que el swap de rotacion x
        // nunca se salga del hueco.
        const live = new THREE.Box3().setFromObject(wrapper)
        const liveSize = new THREE.Vector3()
        live.getSize(liveSize)
        const center = new THREE.Vector3()
        live.getCenter(center)
        const radius = 0.5 * Math.hypot(liveSize.x, liveSize.z, liveSize.y) * 1.22
        camera.left = -radius
        camera.right = radius
        camera.top = radius
        camera.bottom = -radius
        camera.updateProjectionMatrix()
        camera.lookAt(center.x, center.y, center.z)
      },
    }
    const renderableId = `portrait-${cacheKey || seed}`
    const unregister = registerRenderable(renderableId, entry)
    if (persistentKey) persistentPortraits.set(persistentKey, { id: renderableId, entry, canvas })

    return () => {
      if (!persistentKey) disposed = true
      unregister()
      if (axie && !persistentKey) {
        scene.remove(wrapper)
        axie.dispose()
      }
      // Bug real (StrictMode remonta el efecto en dev: monta, desmonta,
      // vuelve a montar): sin quitar el canvas aqui, el segundo montaje
      // anadia OTRO canvas al mismo host y quedaban dos apilados.
      if (canvas.parentNode === host) host.removeChild(canvas)
    }
  }, [descriptor, genes, size, cacheKey])

  return (
    <span
      ref={hostRef}
      className={className}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    />
  )
}

export default memo(Portrait3D)
