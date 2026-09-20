// LordDie3D.jsx — dado fisico 3D del Lord: igual que Die3D para las unidades
// (cubo redondeado Three.js en el renderer WebGL
// compartido, mismo tumble/landing), pero sus 6 caras NO son partes del cuerpo
// sino los 6 mandos de LORD_DIE. El cubo es puramente visual: la lista plana
// de la carta (lord-die-list) se mantiene debajo como leyenda interactiva con
// sus tooltips, y el cubo solo anima la tirada (baraja en rolling, aterriza en
// commit) para que el ritual del dado sea igual en todo el dashboard.
//
// Caras (plane order +X,-X,+Y,-Y,+Z,-Z): 0 shield, 1 mark, 2 heal, 3 buff,
// 4 attack (frontal por defecto), 5 clone. Mismas reglas de giro para llevar
// cada indice a +Z que ya usa Die3D.
//
// Solo se crea al montar (de nuevo con RoundedBoxGeometry + un plano por cara),
// sin reconciliador: mismo patron imperativo vanilla que Board3D/Die3D.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { LORD_GLYPH } from './gameConstants'
import { registerRenderable, getSharedPixelRatio } from './sharedRenderer3D'

const LORD_ACCENT = '#ffc233'
const DIE_COLOR = 0xffffff

// Identidad visual por mando: tono propio (mismo idioma que los colores de
// clase de los axies) + glifo. El nombre es el mismo de LORD_DIE.
const LORD_FACES = [
  { effect: 'lord-shield', name: 'Wall', glyph: LORD_GLYPH['lord-shield'], tint: '#6fb7d7' },
  { effect: 'lord-mark', name: 'Mark', glyph: LORD_GLYPH['lord-mark'], tint: '#e58bc6' },
  { effect: 'lord-heal', name: 'Heal', glyph: LORD_GLYPH['lord-heal'], tint: '#7fbf7f' },
  { effect: 'lord-buff', name: 'Temperance', glyph: LORD_GLYPH['lord-buff'], tint: '#7fd4c1' },
  { effect: 'lord-attack', name: 'Attack', glyph: LORD_GLYPH['lord-attack'], tint: LORD_ACCENT },
  { effect: 'lord-clone', name: 'Duplicate', glyph: LORD_GLYPH['lord-clone'], tint: '#b48fe8' },
]
const EFFECT_TO_INDEX = Object.fromEntries(LORD_FACES.map((f, i) => [f.effect, i]))

function targetEulerFor(effect) {
  const idx = EFFECT_TO_INDEX[effect] ?? 4
  const e = new THREE.Euler(0, 0, 0, 'YXZ')
  switch (idx) {
    case 0: e.y = -Math.PI / 2; break // +X -> +Z
    case 1: e.y = Math.PI / 2; break // -X -> +Z
    case 2: e.x = Math.PI / 2; break // +Y -> +Z
    case 3: e.x = -Math.PI / 2; break // -Y -> +Z
    case 4: break // +Z (frontal)
    case 5: e.y = Math.PI; break // -Z -> +Z
    default: break
  }
  return e
}

const FACE_TEX = 512

function makeFaceCanvas(face) {
  const canvas = document.createElement('canvas')
  canvas.width = FACE_TEX
  canvas.height = FACE_TEX
  const ctx = canvas.getContext('2d')
  const K = FACE_TEX / 100

  ctx.fillStyle = `#${DIE_COLOR.toString(16).padStart(6, '0')}`
  ctx.fillRect(0, 0, FACE_TEX, FACE_TEX)

  // Vineta suave del tono del mando para dar identidad sin pintar marcos.
  const vg = ctx.createRadialGradient(FACE_TEX / 2, K * 38, 0, FACE_TEX / 2, K * 40, K * 50)
  vg.addColorStop(0, hexToRgba(face.tint, 0.12))
  vg.addColorStop(1, hexToRgba(face.tint, 0.4))
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, FACE_TEX, FACE_TEX)

  // Glifo grande del mando: ocupa lo maximo de la cara sin salirse y destaca
  // sobre la base (K*52), centrado en la mitad superior de la cara, con una
  // sombra beis que lo despega del blanco. Linea media (middle), no
  // alphabetic: los emojis se recortan si se miden desde la linea base.
  ctx.save()
  ctx.shadowColor = 'rgba(40,28,12,0.7)'
  ctx.shadowBlur = K * 3.5
  ctx.shadowOffsetY = K * 1.8
  ctx.fillStyle = 'rgba(61,48,36,0.95)'
  ctx.font = `600 ${K * 52}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(face.glyph, FACE_TEX / 2, FACE_TEX / 2 - K * 2)
  ctx.restore()

  // Etiqueta del mando abajo, mismo idioma que la del dado de unidad.
  ctx.fillStyle = 'rgba(61,48,36,0.85)'
  ctx.font = `600 ${K * 11}px system-ui, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.fillText(face.name, FACE_TEX / 2, FACE_TEX - K * 10)

  return { canvas, ctx }
}

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

let lordDieSeed = 0

export default function LordDie3D({ rolling, rolledEffect, size = 78 }) {
  const hostRef = useRef(null)
  const controlRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const seed = ++lordDieSeed

    const scene = new THREE.Scene()
    scene.add(new THREE.AmbientLight(0xffffff, 0.9))
    const key = new THREE.DirectionalLight(0xffffff, 0.6)
    key.position.set(1.8, 2.2, 3.2)
    scene.add(key)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.15)
    rimLight.position.set(-3, -1, -2)
    scene.add(rimLight)

    const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 100)
    camera.position.set(0, 0, 3.4)
    camera.lookAt(0, 0, 0)

    const pr = getSharedPixelRatio()
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(size * pr))
    canvas.height = canvas.width
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    const ctx2d = canvas.getContext('2d')
    host.appendChild(canvas)

    const sceneRoot = new THREE.Group()
    scene.add(sceneRoot)

    const materials = new Array(6)
    for (let i = 0; i < LORD_FACES.length; i++) {
      const { canvas: faceCanvas } = makeFaceCanvas(LORD_FACES[i])
      const tex = new THREE.CanvasTexture(faceCanvas)
      tex.colorSpace = THREE.SRGBColorSpace
      materials[i] = new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 0.85, emissive: 0xffffff, emissiveIntensity: 0.18 })
    }

    const DIE_SIZE = 1.5
    const DIE_RADIUS = 0.24
    const FLAT = DIE_SIZE - DIE_RADIUS * 2
    const hullGeo = new RoundedBoxGeometry(DIE_SIZE, DIE_SIZE, DIE_SIZE, 3, DIE_RADIUS)
    const hullMat = new THREE.MeshStandardMaterial({ color: DIE_COLOR, roughness: 0.85, emissive: 0xffffff, emissiveIntensity: 0.18 })
    const hull = new THREE.Mesh(hullGeo, hullMat)
    sceneRoot.add(hull)

    const faceGeo = new THREE.PlaneGeometry(FLAT, FLAT)
    const off = DIE_SIZE / 2 + 0.006
    for (let m = 0; m < 6; m++) {
      const p = new THREE.Mesh(faceGeo, materials[m])
      p.rotation.order = 'YXZ'
      if (m === 0) { p.position.set(off, 0, 0); p.rotation.y = Math.PI / 2 }
      else if (m === 1) { p.position.set(-off, 0, 0); p.rotation.y = -Math.PI / 2 }
      else if (m === 2) { p.position.set(0, off, 0); p.rotation.x = -Math.PI / 2 }
      else if (m === 3) { p.position.set(0, -off, 0); p.rotation.x = Math.PI / 2 }
      else if (m === 4) { p.position.set(0, 0, off) }
      else { p.position.set(0, 0, -off); p.rotation.y = Math.PI }
      sceneRoot.add(p)
    }

    const group = sceneRoot
    group.rotation.set(0, 0.6, 0)

    let elapsed = 0
    let tumble = false
    let landing = null
    let idlePhase = Math.random() * Math.PI * 2
    let landedEuler = null

    function startLanding(effect) {
      tumble = false
      const target = new THREE.Quaternion().setFromEuler(targetEulerFor(effect))
      landing = { phase: 'spin', t: 0, target, snapped: null }
    }
    function toggleTumble(on) {
      tumble = on
      if (on) landing = null
    }
    controlRef.current = { startLanding, toggleTumble }

    function update(dt) {
      elapsed += dt
      if (tumble) {
        group.rotation.x += dt * 6
        group.rotation.y += dt * 6
        group.position.x = Math.sin(elapsed * 30) * 0.14
        group.position.y = Math.sin(elapsed * 42) * 0.12
      } else if (landing) {
        landing.t += dt
        if (landing.phase === 'spin') {
          group.rotation.x += dt * 16
          group.rotation.y += dt * 12
          group.position.y = Math.sin(elapsed * 22) * 0.05
          if (landing.t >= 0.55) {
            landing.phase = 'settle'
            landing.snapped = group.quaternion.clone()
            landing.t = 0
          }
        } else {
          const k = Math.min(1, landing.t / 0.55)
          const ease = k * k * (3 - 2 * k)
          group.quaternion.slerpQuaternions(landing.snapped, landing.target, ease)
          group.position.y = Math.sin(elapsed * 22) * 0.05 * (1 - ease)
          if (k >= 1) {
            group.quaternion.copy(landing.target)
            landedEuler = new THREE.Euler().setFromQuaternion(landing.target, 'YXZ')
            landing = null
          }
        }
      } else if (landedEuler) {
        idlePhase += dt
        group.rotation.y = landedEuler.y + Math.sin(idlePhase * 0.45) * 0.06
        group.rotation.x = landedEuler.x + Math.cos(idlePhase * 0.3) * 0.04
        group.position.y = Math.sin(idlePhase * 1.8) * 0.04
        group.position.x = 0
      } else {
        idlePhase += dt
        group.rotation.y = Math.sin(idlePhase * 0.45) * 0.8
        group.rotation.x = Math.cos(idlePhase * 0.3) * 0.35
        group.position.y = Math.sin(idlePhase * 1.8) * 0.06
        group.position.x = 0
      }
    }

    const unregister = registerRenderable(`lord-die-${seed}`, {
      scene,
      camera,
      size,
      canvas,
      ctx: ctx2d,
      update,
    })

    return () => {
      unregister()
      hullGeo.dispose()
      hullMat.dispose()
      faceGeo.dispose()
      for (const m of materials) {
        m.map?.dispose()
        m.dispose()
      }
      if (canvas.parentNode === host) host.removeChild(canvas)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  // Mismo fix que en Die3D: rollTick es un contador global que sube cuando
  // CUALQUIER bando tira; fuera de la lista de deps el
  // dado del Lord no vuelve a girar sobre la cara ya aterrizada cuando el otro
  // bando lanza. Aterriza solo en su propio commit (ventana de tumble previa o
  // cambio real de efecto).
  const lastLandRef = useRef({ wasRolling: false, effect: null })
  useEffect(() => {
    const ctrl = controlRef.current
    if (!ctrl) return
    const st = lastLandRef.current
    if (rolling) {
      st.wasRolling = true
      ctrl.toggleTumble(true)
    } else if (rolledEffect && (st.wasRolling || rolledEffect !== st.effect)) {
      st.wasRolling = false
      st.effect = rolledEffect
      ctrl.startLanding(rolledEffect)
    } else {
      st.wasRolling = false
    }
  }, [rolling, rolledEffect])

  return (
    <div
      className="die-3d lord-die-3d"
      ref={hostRef}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}