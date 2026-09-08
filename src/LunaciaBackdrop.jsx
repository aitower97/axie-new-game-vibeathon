// LunaciaBackdrop.jsx — fondo 3D ambiental, puramente decorativo, detras del tablero.
//
// Decision del usuario: quiere el tablero "en 3D, en el mundo de Lunacia". El tablero y
// las piezas siguen siendo el sistema 2D real (mixer + animaciones de Origins) que ya
// esta verificado — reescribirlo en 3D tiraria ese trabajo y dependeria del Three.js Axie
// Mixer, que el estudio de mercado del proyecto marca como beta inestable. Esto es la
// alternativa de bajo riesgo: una escena Three.js de fondo (islas flotantes, una luna,
// motas de luz a la deriva) con la paleta del juego. No hay assets de entorno de Lunacia
// publicados por Sky Mavis, asi que es deliberadamente abstracta en vez de inventar
// lugares del lore que no se han verificado.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const BG = 0x10201d
const MINT = 0x7fe7c4
const ISLAND_COLORS = [0x2d5c50, 0x336655, 0x28503f]

function buildScene(width, height) {
  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(BG, 0.045)

  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
  camera.position.set(0, 1.5, 11)

  // Luz ambiental + hemisferica: no dependen de la distancia, asi que no hace falta
  // adivinar intensidades fisicamente correctas para que algo se vea. Point lights con
  // decay real se quedan practicamente invisibles a estas distancias en Three.js
  // moderno (luces "physically correct" desde r155), por eso no se usan aqui.
  const ambient = new THREE.AmbientLight(0x9fd8c8, 1.6)
  const hemi = new THREE.HemisphereLight(MINT, BG, 1.4)
  scene.add(ambient, hemi)

  // La luna es autoluminosa: MeshBasicMaterial no depende de ninguna luz.
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xffe9b8 })
  )
  moon.position.set(5, 6, -10)
  scene.add(moon)

  const islands = []
  for (let i = 0; i < 6; i++) {
    const radius = 0.5 + Math.random() * 0.9
    const geo = new THREE.IcosahedronGeometry(radius, 0)
    const mat = new THREE.MeshStandardMaterial({
      color: ISLAND_COLORS[i % ISLAND_COLORS.length],
      emissive: MINT,
      emissiveIntensity: 0.18,
      roughness: 0.85,
      flatShading: true,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 6 - 1, -4 - Math.random() * 10)
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
    scene.add(mesh)
    islands.push({ mesh, spin: (Math.random() - 0.5) * 0.15, bobSpeed: 0.3 + Math.random() * 0.4, bobPhase: Math.random() * Math.PI * 2, baseY: mesh.position.y })
  }

  const particleCount = 260
  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12
    positions[i * 3 + 2] = (Math.random() - 0.5) * 18
  }
  const particleGeo = new THREE.BufferGeometry()
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particleMat = new THREE.PointsMaterial({
    color: MINT,
    size: 0.05,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const particles = new THREE.Points(particleGeo, particleMat)
  scene.add(particles)

  return { scene, camera, islands, particles }
}

export default function LunaciaBackdrop() {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(BG, 1)
    host.appendChild(renderer.domElement)

    const { scene, camera, islands, particles } = buildScene(window.innerWidth, window.innerHeight)
    const clock = new THREE.Clock()
    let frame = null

    function animate() {
      const t = clock.getElapsedTime()

      islands.forEach((it) => {
        it.mesh.rotation.y += it.spin * 0.01
        it.mesh.rotation.x += it.spin * 0.006
        it.mesh.position.y = it.baseY + Math.sin(t * it.bobSpeed + it.bobPhase) * 0.25
      })

      const pos = particles.geometry.attributes.position
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + 0.006
        if (y > 6) y = -6
        pos.setY(i, y)
      }
      pos.needsUpdate = true

      camera.position.x = Math.sin(t * 0.05) * 1.2
      camera.position.y = 1.5 + Math.sin(t * 0.08) * 0.3
      camera.lookAt(0, 0, -6)

      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()

    function onResize() {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material.dispose()
        }
      })
      renderer.dispose()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }, [])

  return <div className="lunacia-backdrop" ref={hostRef} aria-hidden="true" />
}
