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

// La cara -Z (tail, ver SLOT_INDEX) queda boca abajo al aterrizar: su plano
// tiene rotation.y=PI DENTRO del grupo (para mirar hacia -Z, ver el loop de
// faceMeshes mas abajo) y el grupo ENTERO vuelve a rotar y=PI para traerla a
// camara (targetEulerFor('tail')) -dos giros de 180 grados alrededor del
// mismo eje Y deberian cancelarse, pero en la practica la cara sale invertida
// (bug reportado 2026-09-11, "la cara de la cola cae boca abajo", confirmado
// con una captura real: la etiqueta de texto aparecia arriba en vez de abajo
// de la cara). Se compensa dibujando ESA cara reflejada 180 grados en el
// propio canvas 2D -mismo mecanismo que existia antes de pasar a planos
// individuales por cara, que un comentario anterior daba por innecesario sin
// haberlo verificado en vivo.
const FLIP_SLOT = { tail: true }

function makeFaceCanvas(slot) {
  const canvas = document.createElement('canvas')
  canvas.width = FACE_TEX
  canvas.height = FACE_TEX
  const ctx = canvas.getContext('2d')
  const empty = slot === 'eyes' || slot === 'ears'
  const K = FACE_TEX / 100

  if (FLIP_SLOT[slot]) {
    // Se queda activo para TODO lo que se dibuje despues en este contexto.
    ctx.translate(FACE_TEX, FACE_TEX)
    ctx.rotate(Math.PI)
  }

  // Cara solida del dado: mismo beis que el bisel, nada de tarjeta flotante.
  ctx.fillStyle = `#${DIE_COLOR.toString(16).padStart(6, '0')}`
  ctx.fillRect(0, 0, FACE_TEX, FACE_TEX)

  // Vineta suave beis oscuro (solo ranuras de combate) detras del icono
  // (stampIcon, mas abajo, la estampa encima despues de forma asincrona):
  // le da a la cara algo de profundidad y ayuda a que el icono destaque un
  // poco mas sobre el blanco del dado.
  if (!empty) {
    const vg = ctx.createRadialGradient(FACE_TEX / 2, K * 42, 0, FACE_TEX / 2, K * 42, K * 54)
    vg.addColorStop(0, 'rgba(78,60,40,0.42)')
    vg.addColorStop(1, 'rgba(78,60,40,0)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, FACE_TEX, FACE_TEX)
  }

  // Ojos/orejas: cavidad vacia, solo un marco punteado oscuro y tenue (mismo
  // rectangulo ampliado que el hueco del icono de las ranuras de combate).
  if (empty) {
    ctx.beginPath()
    ctx.roundRect(K * 8, K * 8, K * 84, K * 64, K * 10)
    ctx.lineWidth = K * 2.2
    ctx.strokeStyle = 'rgba(61,48,36,0.5)'
    ctx.setLineDash([K * 6, K * 4])
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

// El icono vuelve a hornearse en la textura 3D del cubo, EN LAS 6 CARAS (no
// solo la ganadora) -pedido 2026-09-11 ("como no se va a poder si lo
// tenemos hecho arriba en el Lord, inserta tal cual las partes en el
// modelo 3D del dado"): LordDie3D.jsx hace justo esto (`ctx.fillText` del
// glifo, horneado en la propia textura, gira con el cubo de verdad sin
// ningun apaño) y aqui es el mismo principio con una imagen en vez de un
// caracter. El intento anterior (un <img> plano SUPERPUESTO al canvas 3D)
// evitaba el lavado de contraste del pipeline 3D, pero a cambio el icono no
// giraba con el cubo (un <img> no puede seguir una rotacion 3D arbitraria)
// -approximarlo con CSS durante el balanceo funcionaba, pero seguia sin
// estar REALMENTE pegado, y el usuario lo noto. Mismo color "tal cual" que
// el panel de detalle (`ICON_FILTER`, igual que `--icon-filter` en
// App.css), pero con un TRAZO real por debajo (silueta estampada en anillo,
// recoloreada a negro solido via `source-atop`) para que el contorno
// sobreviva al brillo emisivo plano del material de la cara (ver mas abajo,
// `emissiveIntensity`) -sin el trazo, la imagen se lavaba demasiado contra
// el blanco del dado (motivo real del primer intento de superponerla).
const ICON_FILTER = 'sepia(1) saturate(2.6) hue-rotate(-8deg) brightness(0.92)'
const ICON_OUTLINE_COLOR = '#000000'

function stampIcon(ctx, canvas, url, dim) {
  const img = new Image()
  img.onload = () => {
    // Hueco donde debe caer el icono (mismo rectangulo que dibuja
    // makeFaceCanvas): se encaja DENTRO de el respetando su proporcion real
    // (los PNG no son todos cuadrados: mouth 114x96, back 108x89...).
    const K = FACE_TEX / 100
    const holeX = K * 4
    const holeY = K * 8
    const holeW = K * 92
    const holeH = K * 66
    const inset = 0.97
    const scale = Math.min((holeW * inset) / img.naturalWidth, (holeH * inset) / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    const dx = holeX + (holeW - dw) / 2
    const dy = holeY + (holeH - dh) / 2

    // Trazo: la MISMA silueta estampada 12 veces en anillo, desplazada unos
    // pixeles en cada direccion, en un lienzo aparte con margen -esa mancha
    // dilatada, recoloreada a negro solido (source-atop), es el contorno.
    const OUTLINE_PX = Math.max(2, K * 2.4)
    const pad = Math.ceil(OUTLINE_PX) + 1
    const iw = Math.max(1, Math.round(dw)) + pad * 2
    const ih = Math.max(1, Math.round(dh)) + pad * 2
    const outlineCanvas = document.createElement('canvas')
    outlineCanvas.width = iw
    outlineCanvas.height = ih
    const octx = outlineCanvas.getContext('2d')
    const RING_DIRS = 12
    for (let i = 0; i < RING_DIRS; i++) {
      const a = (i / RING_DIRS) * Math.PI * 2
      octx.drawImage(img, pad + Math.cos(a) * OUTLINE_PX, pad + Math.sin(a) * OUTLINE_PX, dw, dh)
    }
    octx.globalCompositeOperation = 'source-atop'
    octx.fillStyle = ICON_OUTLINE_COLOR
    octx.fillRect(0, 0, iw, ih)

    ctx.save()
    if (dim) ctx.globalAlpha = 0.4
    // Trazo primero (sin filtro, negro solido), la imagen real encima con
    // el mismo color "tal cual" que el panel de detalle.
    ctx.drawImage(outlineCanvas, dx - pad, dy - pad, iw, ih)
    ctx.filter = ICON_FILTER
    ctx.drawImage(img, dx, dy, dw, dh)
    ctx.filter = 'none'
    ctx.restore()
    const tex = canvas._texture
    if (tex) tex.needsUpdate = true
  }
  img.src = url
}

let dieSeed = 0

export default function Die3D({ slots, rolling, rolledSlot, size = 120 }) {
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
      // Icono horneado en la propia textura de la cara (ver comentario largo
      // de stampIcon, arriba): TODAS las caras lo llevan, no solo la
      // ganadora -asi el dado ya se ve "vestido" con sus partes incluso
      // antes de la primera tirada e idle mostrando cualquier cara.
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
  // rollTick YA NO esta en las deps (bug real 2026-09-11): es un contador
  // GLOBAL que sube cada vez que CUALQUIER bando tira, asi que un dado con la
  // cara aterrizada volvia a girar cuando el OTRO bando lanzaba sus dados.
  // Ahora el aterrizaje solo ocurre en el commit de ESTE dado: justo despues
  // de su ventana de tumble (rolling pasa de true a false), o si su ranura
  // ganadora cambia de verdad. Dos turnos seguidos con la misma cara siguen
  // aterrizando bien (hay una ventana de tumble antes de cada commit).
  const lastLandRef = useRef({ wasRolling: false, slot: null })
  useEffect(() => {
    const ctrl = controlRef.current
    if (!ctrl) return
    const st = lastLandRef.current
    if (rolling) {
      st.wasRolling = true
      ctrl.toggleTumble(true)
    } else if (rolledSlot && (st.wasRolling || rolledSlot !== st.slot)) {
      st.wasRolling = false
      st.slot = rolledSlot
      ctrl.startLanding(rolledSlot)
    } else {
      st.wasRolling = false
    }
  }, [rolling, rolledSlot])

  return (
    <div
      className="die-3d"
      ref={hostRef}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}