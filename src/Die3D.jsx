// Die3D.jsx — dado fisico 3D por carta (T0). Un cubo redondeado Three.js con
// las 6 partes del cuerpo en sus caras, flotando superpuesto a la rejilla 2D
// del dado (que se mantiene debajo, "superpuesto a la rejilla actual", y
// conserva sus estados rolling/tick). Modelo imperativo vanilla igual que
// Board3D: sin reconciliador.
//
// Diseno actual (pedido usuario 2026-09-10): casco RoundedBoxGeometry como
// cuerpo solido (esquinas redondeadas) y 6 planos opacos pegados a la zona
// plana de cada cara con la cara del dice; sin reborde de color de clase ni
// marco dorado -antes las caras eran tarjetas transparentes dentro de un
// cubo dorado y parecian "partes cortadas en un cuadrado".
//
// Caras del cubo (orden de plano +X,-X,+Y,-Y,+Z,-Z):
//   -Z   tail         (cara trasera)
//   +Z   horn         (cara frontal por defecto)
//   -X   back/lomo
//   +X   mouth
//   -Y   ears
//   +Y   eyes
//
// Al hacer commit (rolledSlot cambia, o cambia rollTick con el mismo resultado)
// el cubo da un tumble y se orienta con la cara ganadora hacia la camara.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { SLOT_LABEL_MVP1 } from './axie'
import { SLOT_ICON_URL } from './slotIcons'
import { registerRenderable, getSharedPixelRatio } from './sharedRenderer3D'

// Color del dado entero (pedido explicito 2026-09-10: "el borde y las caras
// del mismo color, no verde, blanco o beis"): el cuerpo (bisel redondeado) y
// el fondo de cada cara comparten este mismo tono. Antes era verde oscuro con
// un reborde de color de clase y marco dorado; ya no hay color por clase.
// Pedido posterior del usuario: "el color del dado que brille mas, mas
// blanco, esta muy oscuro" -primero subio a 0xF7F7F7 y el usuario siguio
// viendolo igual (el salto de 8 niveles es imperceptible), asi que se va a
// blanco puro 0xFFFFFF con la luz ambiente y principal mas altas: que el
// cuerpo lea BLANCO de verdad y solo las sombras del bisel marquen el volumen.
const DIE_COLOR = 0xFFFFFF

// Orientacion final que deja cada ranura mirando +Z (hacia la camara).
function targetEulerFor(slot) {
  const e = new THREE.Euler(0, 0, 0, 'YXZ')
  switch (slot) {
    case 'horn':
      break
    case 'mouth':
      e.y = -Math.PI / 2
      break
    case 'back':
      e.y = Math.PI / 2
      break
    case 'tail':
      e.y = Math.PI
      break
    case 'eyes':
      e.x = Math.PI / 2
      break
    case 'ears':
      e.x = -Math.PI / 2
      break
    default:
      break
  }
  return e
}

const FACE_TEX = 512

// Posicion de cada ranura en el array de materiales de BoxGeometry
// (+X,-X,+Y,-Y,+Z,-Z): mouth +X, back/lomo -X, eyes +Y, ears -Y, horn +Z,
// tail -Z. Ojo: DIE_SLOTS va en otro orden, hay que colocar por indice.
const SLOT_INDEX = { eyes: 2, ears: 3, horn: 4, mouth: 0, back: 1, tail: 5 }

// BoxGeometry giraba la UV de la cara -Z (tail, ver SLOT_INDEX) al reves y
// habia que compensarla dibujando esa cara reflejada 180 grados (bug historico
// "cuando toca cola la parte queda boca abajo"). Con el dado ACTUAL de planos
// (un plano por cara, RoundedBoxGeometry no alterna las UVs) ese reflejo ya NO
// hace falta: si se aplicara, la textura de la cola apareceria girada 180 grados
// y el icono de Pigeon Post se veria al reves/descolocado (reportado por el
// usuario: "el de pigeon post esta desalineado").
const FLIP_SLOT = {}

function makeFaceCanvas(slot) {
  const canvas = document.createElement('canvas')
  canvas.width = FACE_TEX
  canvas.height = FACE_TEX
  const ctx = canvas.getContext('2d')
  const empty = slot === 'eyes' || slot === 'ears'
  const K = FACE_TEX / 100

  if (FLIP_SLOT[slot]) {
    // Se queda activo para TODO lo que se dibuje despues en este contexto,
    // incluido el icono que stampIcon añade mas tarde de forma asincrona.
    ctx.translate(FACE_TEX, FACE_TEX)
    ctx.rotate(Math.PI)
  }

  // Cara solida del dado: mismo beis que el bisel, nada de tarjeta flotante.
  ctx.fillStyle = `#${DIE_COLOR.toString(16).padStart(6, '0')}`
  ctx.fillRect(0, 0, FACE_TEX, FACE_TEX)

  // Vinetas suave beis obscuro detras del icono (solo las ranuras de combate)
  // para que la parte gane presencia sin pintar ningun marco de color.
  if (!empty) {
    const vg = ctx.createRadialGradient(FACE_TEX / 2, K * 40, 0, FACE_TEX / 2, K * 40, K * 48)
    vg.addColorStop(0, 'rgba(78,60,40,0.20)')
    vg.addColorStop(1, 'rgba(78,60,40,0)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, FACE_TEX, FACE_TEX)
  }

  // Ojos/orejas: cavidad vacia, solo un marco punteado oscuro y tenue.
  if (empty) {
    ctx.beginPath()
    ctx.roundRect(K * 12, K * 14, K * 76, K * 60, K * 10)
    ctx.lineWidth = K * 2
    ctx.strokeStyle = 'rgba(61,48,36,0.45)'
    ctx.setLineDash([K * 5, K * 4])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Etiqueta de la ranura abajo, marron oscuro para leerse sobre el beis.
  ctx.fillStyle = empty ? 'rgba(61,48,36,0.55)' : 'rgba(61,48,36,0.85)'
  ctx.font = `600 ${K * 11}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(SLOT_LABEL_MVP1[slot] ?? slot, FACE_TEX / 2, FACE_TEX - K * 10)

  return { canvas, ctx, empty }
}

// YA NO es el mismo filtro que --icon-filter en App.css: alli el icono va
// sobre un panel OSCURO (buen contraste con brightness casi 1), pero aqui el
// dado es BLANCO PURO (DIE_COLOR) y ese mismo tono palido se volvia casi
// invisible -bug real visto con el navegador headless: el icono estaba ahi
// (no en blanco, se confirmo con un zoom real) pero demasiado claro para
// leerse. brightness mucho mas bajo -> un bronce oscuro solido, buen
// contraste sobre blanco, misma forma/relieve real del PNG (solo cambia el
// tono, igual que antes).
const ICON_FILTER = 'sepia(1) saturate(2.8) hue-rotate(-8deg) brightness(0.55)'

function stampIcon(ctx, canvas, url, dim) {
  const img = new Image()
  img.onload = () => {
    // Hueco donde debe caer el icono (mismo rectangulo que dibuja
    // makeFaceCanvas): se encaja DENTRO de el respetando su proporcion real
    // (los PNG no son todos cuadrados: mouth 114x96, back 108x89...), no
    // estirado a un cuadrado mas grande que el propio hueco -bug real
    // reportado: "las partes en las caras del dado se salen y no estan
    // centradas".
    const K = FACE_TEX / 100
    const holeX = K * 6
    const holeY = K * 11
    const holeW = K * 88
    const holeH = K * 64
    const inset = 0.9
    const scale = Math.min((holeW * inset) / img.naturalWidth, (holeH * inset) / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    const dx = holeX + (holeW - dw) / 2
    const dy = holeY + (holeH - dh) / 2

    ctx.save()
    if (dim) ctx.globalAlpha = 0.4
    // Sombra suave justo detras de la parte (pedido: "que la imagen gane
    // protagonismo"): un halo oscuro beis que la despega del fondo sin marco.
    ctx.shadowColor = 'rgba(52,40,24,0.65)'
    ctx.shadowBlur = K * 3
    ctx.shadowOffsetY = K * 1.6
    ctx.filter = ICON_FILTER
    ctx.drawImage(img, dx, dy, dw, dh)
    ctx.restore()
    const tex = canvas._texture
    if (tex) tex.needsUpdate = true
  }
  img.src = url
}

let dieSeed = 0

export default function Die3D({ slots, rolling, rollTick, rolledSlot, size = 120 }) {
  const hostRef = useRef(null)
  // Handles del bucle de render (que vive en el efecto principal): el efecto de
  // control de estado (abajo) los llama para tumble/landing según las props.
  const controlRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const seed = ++dieSeed

    const scene = new THREE.Scene()
    // Luz suave (pedido: "que no se note tanto el cambio de color... queda
    // cutra"): con las caras en el mismo material que el casco el bisel solo
    // se marca con una pequena caida de luz en la curva redondeada, sutil.
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

    // Canvas 2D visible: el dibujo real ocurre en el WebGLRenderer COMPARTIDO
    // (sharedRenderer3D.js, un unico contexto WebGL para todas las cartas del
    // dashboard) y se vuelca aqui cada frame con drawImage.
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

    // Un material por cara: fondo(etiqueta) inmediato + icono 3D al resolver.
    // Se colocan en el indice del material segun la geometria del cubo.
    // Materiales de las 6 caras (fondo solido + icono 3D al resolver).
    // Se colocan por indice igual que antes, pero ahora cada material va en
    // un plano pegado a la cara plana del casco (RoundedBoxGeometry no trae
    // groups de material, con un solo material va el casco entero).
    const materials = new Array(6)
    for (const s of slots) {
      const idx = SLOT_INDEX[s.slot]
      const { canvas, ctx, empty } = makeFaceCanvas(s.slot)
      const tex = new THREE.CanvasTexture(canvas)
      tex.colorSpace = THREE.SRGBColorSpace
      canvas._texture = tex
      // Opaco y CON la misma luz que el casco (MeshStandardMaterial): si la cara
      // fuera plana sin luz (Basic) sobre un bisel iluminado (Standard), la zona
      // plana vuela como un cuadrado beis pegado encima (rechazado: "la cara un
      // cuadrado ahi..."). Mismo material que el casco = el claroscuro corre
      // continuo del borde redondeado a la cara y el cuadrado desaparece. Con el
      // mismo emisivo que el bisel (pedido: "vale pero a la cara tambien, es que
      // sino queda fatal") para que el brillo sea UNIFORME en todo el dado.
      materials[idx] = new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 0.85, emissive: 0xffffff, emissiveIntensity: 0.18 })
      const iconUrl = SLOT_ICON_URL[s.slot]
      if (iconUrl) stampIcon(ctx, canvas, iconUrl, empty)
    }

// Casco redondeado (pedido explicito: "redondear las puntas") en el MISMO
    // beis que las caras e iluminado (MeshStandardMaterial). Con las caras en el
    // mismo material, el claroscuro del bisel cae suave y continuo hasta la cara
    // -sin el corte plano/sombreado que hacia de la cara un parche cuadrado.
    const DIE_SIZE = 1.5
    const DIE_RADIUS = 0.24
    const FLAT = DIE_SIZE - DIE_RADIUS * 2
    const hullGeo = new RoundedBoxGeometry(DIE_SIZE, DIE_SIZE, DIE_SIZE, 3, DIE_RADIUS)
    // Emisivo blanco tenue en el bisel: con el color ya en blanco puro, es la
    // forma de que el dado "brille" un punto mas sin tocar las caras (pedido:
    // "un poco mas"). Solo el casco; las caras usan textura y no lo necesitan.
    const hullMat = new THREE.MeshStandardMaterial({ color: DIE_COLOR, roughness: 0.85, emissive: 0xffffff, emissiveIntensity: 0.18 })
    const hull = new THREE.Mesh(hullGeo, hullMat)
    sceneRoot.add(hull)

    // Un plano por cara (misma geometria compartida), pegado justo encima de
    // la zona plana del casco. Orden de plano: +X,-X,+Y,-Y,+Z,-Z.
    const faceGeo = new THREE.PlaneGeometry(FLAT, FLAT)
    const off = DIE_SIZE / 2 + 0.006
    const faceMeshes = []
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
      faceMeshes.push(p)
    }

    const group = sceneRoot
    group.rotation.set(0, 0.6, 0)

    let elapsed = 0
    let tumble = false
    let landing = null
    let idlePhase = Math.random() * Math.PI * 2
    // Orientacion en la que quedo la ULTIMA cara aterrizada (null hasta el
    // primer commit): el idle de despues tiene que orbitar alrededor de ESTA,
    // no del origen -si no, en cuanto landing termina (landing=null) el frame
    // siguiente cae en la rama idle de abajo y la reescribe con una rotacion
    // absoluta, tapando la cara que se acaba de tirar (bug real: "gira y
    // gira, nunca cae y muestra la cara que ha tocado").
    let landedEuler = null

    function startLanding(slot) {
      // Bug real (reportado dos veces por el usuario, "gira y gira, nunca
      // cae"): tumble se ponia a true al empezar la tirada (toggleTumble) y
      // NUNCA volvia a false -loop() mira `if (tumble)` antes que `landing`,
      // asi que aunque aqui se armara el aterrizaje, tumble seguia ganando y
      // el cubo tumbaba para siempre. Hay que apagarlo aqui explicitamente.
      tumble = false
      const target = new THREE.Quaternion().setFromEuler(targetEulerFor(slot))
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
        // Ya hay una cara aterrizada: solo un balanceo MUY leve alrededor de
        // esa orientacion (que se siga viendo la cara con claridad), no un
        // giro libre.
        idlePhase += dt
        group.rotation.y = landedEuler.y + Math.sin(idlePhase * 0.45) * 0.06
        group.rotation.x = landedEuler.x + Math.cos(idlePhase * 0.3) * 0.04
        group.position.y = Math.sin(idlePhase * 1.8) * 0.04
        group.position.x = 0
      } else {
        // Antes de la primera tirada: sin cara que proteger, el giro de
        // "esperando" puede ser mas vistoso.
        idlePhase += dt
        group.rotation.y = Math.sin(idlePhase * 0.45) * 0.8
        group.rotation.x = Math.cos(idlePhase * 0.3) * 0.35
        group.position.y = Math.sin(idlePhase * 1.8) * 0.06
        group.position.x = 0
      }
    }

    const unregister = registerRenderable(`die-${seed}`, {
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
      // Bug real (StrictMode remonta el efecto en dev): sin quitar el canvas
      // aqui, el remontaje anadia OTRO canvas al mismo host y quedaban dos
      // apilados -pedido explicito 2026-09-10 al depurar el rediseno de las
      // cartas compactas.
      if (canvas.parentNode === host) host.removeChild(canvas)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size])

  // Control de estado: tumble mientras rolling, landing al commit (rolledSlot).
  // rollTick esta en la lista de deps para re-lanzar el aterrizaje aunque el
  // mismo slot gane dos turnos seguidos.
  useEffect(() => {
    const ctrl = controlRef.current
    if (!ctrl) return
    if (rolling) ctrl.toggleTumble(true)
    else if (rolledSlot) ctrl.startLanding(rolledSlot)
  }, [rolling, rollTick, rolledSlot])

  return (
    <div
      className="die-3d"
      ref={hostRef}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}