// Board3D.jsx — el tablero como bloques 3D reales (GLB de Kenney) unidos en una
// plataforma, con Three.js VANILLA (no react-three-fiber): r3f monta la escena
// con su PROPIO reconciliador de React separado del arbol normal, y su
// Suspense interno (usado por useGLTF) no se puede envolver desde fuera de
// <Canvas> -aqui no hay reconciliador de React tocando la escena, es
// imperativo puro dentro de un useEffect, igual que el patron que ya
// funciono bien con Phaser antes de quitarlo.
//
// Alineacion con el overlay interactivo de React: la camara es ORTOGRAFICA (sin
// escorzo de perspectiva), asi que la proyeccion de 3D a pantalla es una
// transformacion afin (rotacion+escala+traslacion, sin curvatura). Eso significa
// que basta con proyectar 3 puntos de referencia (origen, +X, +Y del grid en
// "pixeles de overlay") para sacar una matriz CSS `matrix(a,b,c,d,e,f)` que
// alinea TODO el grid interactivo de golpe -nada de recalcular celda por celda,
// ni de derivar la proyeccion a mano.
//
// Dos useEffect separados a proposito, no uno solo:
// - El primero monta terreno/camara/renderer/loop y TAMBIEN define la
//   sincronizacion de Axies (crear/mover/quitar), pero solo la EJECUTA cuando
//   el terreno esta listo -deps estables (filas, columnas, urls de bloques),
//   no depende de `axieUnits`.
// - El segundo simplemente DISPARA esa sincronizacion (via `syncRef.current`)
//   cada vez que cambia `axieUnits`, sin volver a montar nada.
// Los dos comparten `syncRef.current`, que el primer efecto reescribe cada vez
// que se (re)monta -asi el segundo SIEMPRE dispara la sincronizacion del
// terreno/renderer VIVO actual, nunca uno viejo ya destruido. Hace falta ese
// nivel de cuidado por como remonta React en desarrollo (StrictMode): monta,
// desmonta y vuelve a montar los efectos para detectar bugs, así que en la
// practica el efecto de terreno se ejecuta varias veces al arrancar -sin este
// enganche los Axies podian terminar creandose sobre un tablero ya
// desechado (invisible, aunque las descargas de red y la creacion del
// personaje 3D terminaran bien).
//
// Ademas: pasar `axieCell={{ r, c }}` como objeto literal en el JSX de
// App.jsx creaba una referencia nueva en cada render, y como el efecto de
// terreno dependia de ese prop, cada render de App destruia y recreaba TODA
// la escena -el canvas se quedaba en blanco para siempre porque el efecto
// nunca llegaba a terminar de cargar. Por eso `axieUnits` (el array completo
// de unidades) NUNCA es dependencia del efecto de terreno.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { getSharedAxieMixer3D } from './axieMixer3D'
import { SLOT_ATTACK_ANIM, FALLBACK_ATTACK_ANIM } from './attackAnimNames'

// Corona real (OBJ+MTL, "Golden_Crown_v1_L2") elegida y descargada por el
// usuario -no procedural. En public/models/crown/ (crown.obj + crown.mtl, sin
// textura: los materiales del .mtl son colores planos).
const CROWN_OBJ_URL = '/models/crown/crown.obj'
const CROWN_MTL_URL = '/models/crown/crown.mtl'

// Genes de ejemplo REAL, sacado del propio test suite del paquete
// (test/axie-id.test.mjs, SAMPLE_GENES) -no inventado: es el mismo genes hex
// que usan sus propios tests para verificar que el mixer arma un Axie de
// verdad. Ya no es lo que usa el roster ni los Lords (App.jsx les da genomas
// reales por unidad via axieGeneCatalog.js, sacados en vivo del marketplace
// de Axie) -se queda solo como red de seguridad si algun `klass` no tuviera
// entrada en ese catalogo.
export const AXIE_SAMPLE_GENES =
  '0x3000301600001080000000100080860850400010014082084020001000018208202000300141840c0020003000010a040040001000c1040c406'

function disposeObject3D(obj) {
  obj.traverse((child) => {
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((m) => m.dispose())
    }
  })
}

// Carga la corona (OBJ+MTL) UNA vez y la normaliza: la reposiciona para que
// el origen local quede centrado en X/Z y con la base en y=0, para que
// cualquier clon puesto en (x, headY, z) y escalado quede centrado y apoyado
// sobre la cabeza sin tener que adivinar el pivote original del modelo.
function loadCrownTemplate() {
  return new MTLLoader()
    .loadAsync(CROWN_MTL_URL)
    .then((materials) => {
      materials.preload()
      const objLoader = new OBJLoader()
      objLoader.setMaterials(materials)
      return objLoader.loadAsync(CROWN_OBJ_URL)
    })
    .then((obj) => {
      // El .obj lo exporto 3ds Max (cabecera de crown.mtl: "3ds Max Wavefront
      // OBJ Exporter"), que usa Z como "arriba" -aqui (Three.js) arriba es Y.
      // Sin corregir, la corona quedaba tumbada de lado: la base (el hueco de
      // la banda, por donde deberia entrar la cabeza) miraba en horizontal
      // (plano XZ) en vez de hacia abajo, hacia la cabeza del axie, a lo
      // largo de Y. Rotar -90 grados en X pasa de "Z arriba" a "Y arriba".
      obj.rotation.x = -Math.PI / 2
      obj.updateMatrixWorld(true)
      // El .mtl trae 4 materiales pero todos con Ns 0 (brillo/especular a
      // cero -por eso salia mate, sin destacar). Se sustituyen por un unico
      // dorado mas vivo, en vez de intentar afinar los 4 originales (gemas rojas/
      // verdes/plata incluidas) por separado. metalness bajo a proposito: la
      // escena solo tiene luz ambiental + una direccional, sin environment
      // map -un material casi 100% metalico se ve OSCURO sin reflejos de
      // entorno que lo iluminen (el metal PBR depende de eso, no del color
      // base). El brillo viene sobre todo del emissive, no del metalness.
      const crownGold = new THREE.MeshStandardMaterial({
        color: 0xffd75e,
        metalness: 0.35,
        roughness: 0.22,
        emissive: 0xb87a00,
        emissiveIntensity: 0.55,
      })
      obj.traverse((child) => {
        if (child.isMesh) child.material = crownGold
      })
      const box = new THREE.Box3().setFromObject(obj)
      const size = new THREE.Vector3()
      box.getSize(size)
      const center = new THREE.Vector3()
      box.getCenter(center)
      obj.position.set(-center.x, -box.min.y, -center.z)
      const root = new THREE.Group()
      root.add(obj)
      return { root, naturalSize: Math.max(size.x, size.z) || 1 }
    })
}

// terrainBlockUrls: terreno -> GLB que REEMPLAZA el bloque base de esa celda
// (mismo hueco, mismo tamano -pensado para bloques "block-*" de Kenney, que
// comparten proporciones). decorUrls: terreno -> GLB que se ANADE ENCIMA del
// bloque base sin sustituirlo (para props que no son un bloque cuadrado, como
// una roca suelta).
//
// axieUnits: array de { id, r, c, genes, isLord, facing: {r,c}|null }. Cada
// entrada es un Axie 3D real (roster o Lord) posicionado en su celda y
// orientado hacia `facing` (por defecto, el Lord rival; si la unidad esta
// seleccionada y tiene un objetivo de ataque, hacia ese objetivo -lo decide
// App.jsx, aqui solo se aplica la rotacion).
export default function Board3D({
  rows,
  cols,
  blockUrl,
  cellSizePx,
  onTransform,
  overlayElRef,
  onReady,
  terrainAt,
  terrainBlockUrls,
  decorUrls,
  axieUnits,
  fx,
  onTween,
}) {
  const hostRef = useRef(null)
  // onTransform en un ref: si el padre pasa una funcion nueva cada render (lo
  // normal con un arrow inline), no queremos que ESO destruya y recree toda la
  // escena de Three.js -solo nos interesa la version mas reciente cuando
  // realmente hace falta llamarla (resize/carga).
  const onTransformRef = useRef(onTransform)
  useEffect(() => {
    onTransformRef.current = onTransform
  }, [onTransform])
  const terrainAtRef = useRef(terrainAt)
  useEffect(() => {
    terrainAtRef.current = terrainAt
  }, [terrainAt])
  // onReady (y su version en ref): Board3D lo dispara UNA vez cuando la escena
  // base ya esta montada y el overlay 3D->DOM tiene matriz (primer canasto de
  // carga). App lo usa para quitar la cortina de carga (T4).
  const onReadyRef = useRef(onReady)
  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])
  // onTween (y su version en ref): evento continuo, UNO por frame mientras un
  // Axie esta haciendo el tween de caminar entre casillas, con el
  // desplazamiento fraccional de su casilla destino en "pixeles de overlay".
  // BoardRegion lo aplica como translate() directo al marcador DOM (.unit)
  // para que medallon y barra de vida sigan al cuerpo 3D (T1/tween). No es un
  // render de React: es el mismo patron ref que onTransform/terrainAt.
  const onTweenRef = useRef(onTween)
  useEffect(() => {
    onTweenRef.current = onTween
  }, [onTween])

  // Siempre la lista mas reciente, para que una creacion async (mixer.
  // createFromGenes) que termina tarde compruebe contra el estado actual, no
  // contra el que habia cuando empezo a cargar.
  const desiredUnitsRef = useRef(axieUnits)
  desiredUnitsRef.current = axieUnits
  // Apunta siempre a la funcion de sincronizacion del efecto de terreno
  // ACTUALMENTE vivo (ver comentario de cabecera). El efecto de unidades solo
  // la llama, nunca guarda su propia referencia al tablero.
  const syncRef = useRef(null)
  // Canal de efectos (T1): App.jsx nos pasa un array fx de eventos de animacion
  // { id, kind, unitId, slot? }. Se despachan al tablero vivo a traves de otro
  // ref (fxRef apunta a syncFxRef.current), como con onTransform/terrainAt.
  const fxRef = useRef(fx)
  const seenFxIdRef = useRef(-1)
  // Consume los eventos fx nuevos (ids crecientes) y los manda al tablero
  // vivo via syncFxRef.current (definido dentro del efecto de terreno, que es
  // quien tiene el mapa de handles). Mismo patron que onTransform/terrainAt.
  useEffect(() => {
    fxRef.current = fx
    if (!fx || fx.length === 0) return
    const fresh = fx.filter((e) => e.id > seenFxIdRef.current)
    if (fresh.length === 0) return
    seenFxIdRef.current = fresh[fresh.length - 1].id
    syncFxRef.current?.(fresh)
  }, [fx])
  const syncFxRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false
    let frameId = null

    const scene = new THREE.Scene()
    // Fondo "hasta el horizonte": cielo opaco + niebla atmosferica del MISMO
    // color. El campo de hierba gigante se extiende hasta las ~4200 unidades y la
    // niebla la disuelve gradualmente ANTES de que se vea el borde: el horizonte
    // no se corta, se evapora. El tablero (a ~30-40 unidades de la camara) queda
    // fuera del radio de niebla, asi que no se le tiñe nada.
    const SKY_COLOR = 0xa8c4b0
    scene.background = new THREE.Color(SKY_COLOR)
    scene.fog = new THREE.Fog(SKY_COLOR, 70, 340)

    const ambient = new THREE.AmbientLight(0xffffff, 0.9)
    scene.add(ambient)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9)
    dirLight.position.set(4, 10, 6)
    scene.add(dirLight)

    // Angulo "de mesa": 30 grados de inclinacion en el
    // eje X (elevationDeg) + un giro de 10 grados tipo peonza sobre el propio
    // plano del tablero (azimuthDeg, en boardGroup, no en la camara).
    const elevationDeg = 30
    const elevRad = (elevationDeg * Math.PI) / 180
    const azimuthDeg = -10
    const dist = 30

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1200)
    // Vista movible (T5): la camara es ortografica, asi que 3D->pantalla sigue
    // siendo una transformacion afin pase lo que pase; pan/zoom/rotacion de la
    // vista solo cambian la matriz CSS que se publica (publishTransform), y el
    // overlay DOM se mantiene alineado "de gratis". Pan y zoom se hacen moviendo
    // el punto al que apunta la camara (camTarget) + un desplazamiento FIJO de
    // la camara respecto a el (camOffset); zoom = escala el frustum en resize().
    const camTarget = new THREE.Vector3(0, 0, 0)
    const camOffset = new THREE.Vector3(0, dist * Math.sin(elevRad), dist * Math.cos(elevRad))
    camera.position.copy(camTarget).add(camOffset)
    camera.lookAt(camTarget)
    let zoom = 1
    // Zoom con suavizado: la rueda fija ZOOM objetivo y el bucle lo persigue con
    // interpolacion exponencial (en vez de saltar a golpe de evento), para que la
    // vista "respire" en vez de cortarse. Se sella a zoom cuando la diferencia es
    // despreciable para dejar de animar el frustum en cada frame.
    let zoomTarget = 1
    // Ultima vista conocida para no necesitar host.clientWidth cada vez que se
    // mueve la camara (resize() mantiene estas variables al dia).
    let viewW = 0
    let viewH = 0

    function reposCamera(render = true) {
      camera.position.copy(camTarget).add(camOffset)
      camera.lookAt(camTarget)
      camera.updateMatrixWorld()
      if (render) {
        renderOnce()
        publishTransform(viewW, viewH)
      }
    }
    function applyView() {
      reposCamera(true)
    }
    // Frustum del zoom. Separado de resize() para poder animar el zoom frame a
    // frame sin tocar el tamano del canvas (renderer.setSize solo hace falta en
    // resize real, no al encuadrar).
    function applyZoom() {
      const aspect = (viewW || 800) / (viewH || 600)
      const baseFrustumH = Math.max(cols, rows * Math.sin(elevRad) + 2) * 1.9
      const frustumH = baseFrustumH / zoom
      camera.left = (-frustumH * aspect) / 2
      camera.right = (frustumH * aspect) / 2
      camera.top = frustumH / 2
      camera.bottom = -frustumH / 2
      camera.updateProjectionMatrix()
    }

    const boardGroup = new THREE.Group()
    boardGroup.rotation.y = (azimuthDeg * Math.PI) / 180
    scene.add(boardGroup)

    // La "isla" (rejilla + canto de tierra + Axies) es un grupo aparte dentro
    // de boardGroup: es lo unico que sube y baja (loop(), mas abajo) para dar
    // la sensacion de flotar -una animacion sutil de sube y baja, no un
    // trozo de geometria estatica. El fondo (campo + arboles/rocas/caminos)
    // se queda fijo en boardGroup: sin ese punto de referencia inmovil, el sube y baja de
    // la isla no se notaria.
    const islandGroup = new THREE.Group()
    boardGroup.add(islandGroup)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    host.appendChild(renderer.domElement)

    let spacing = 1
    let baseHeight = 0
    let terrainReady = false
    // Superficie por celda (la altura de la tapa real de esa casilla tras
    // apilar la decoracion de terreno encima del bloque de cesped): los Axies
    // se asientan sobre ESTA altura, no sobre baseHeight a secas, o la tierra
    // (patch-dirt) y otros props de terreno tapaban al Axie (la pieza tiene
    // grosor real y su tapa quedaba por encima de los pies del modelo).
    const cellTop = new Array(rows * cols).fill(0)
    const topAt = (r, c) => cellTop[r * cols + c] || baseHeight
    const cellSize = cellSizePx || 90

    function resize() {
      const width = host.clientWidth || 800
      const height = host.clientHeight || 600
      viewW = width
      viewH = height
      applyZoom()
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderOnce()
      publishTransform(width, height)
    }

    function renderOnce() {
      renderer.render(scene, camera)
    }

    // Overlay-pixel (u,v) -> mundo 3D local (antes de rotar boardGroup) -> mundo
    // real (con rotacion) -> NDC (camera.project) -> pixeles CSS reales.
    // Se proyecta en el plano de la CARA SUPERIOR de los bloques (y = baseHeight,
    // no y = 0): es la superficie visible donde se asienta todo (bloques, axies,
    // decoracion) y donde el jugador mira. Proyectar en el suelo (y = 0) dejaba
    // todo el grid desplazado ~40-50 px por debajo de las tapas (bug real visto).
    function overlayToScreen(u, v, width, height) {
      const x = (u - (cols * cellSize) / 2) * (spacing / cellSize)
      const z = (v - (rows * cellSize) / 2) * (spacing / cellSize)
      const world = boardGroup.localToWorld(new THREE.Vector3(x, baseHeight, z))
      const ndc = world.project(camera)
      return {
        x: (ndc.x * 0.5 + 0.5) * width,
        y: (1 - (ndc.y * 0.5 + 0.5)) * height,
      }
    }

    function publishTransform(width, height) {
      const p0 = overlayToScreen(0, 0, width, height)
      const p1 = overlayToScreen(1, 0, width, height)
      const p2 = overlayToScreen(0, 1, width, height)
      const matrix = [p1.x - p0.x, p1.y - p0.y, p2.x - p0.x, p2.y - p0.y, p0.x, p0.y]
      const matrixStr = `matrix(${matrix.join(',')})`
      // La matriz del overlay NO sube por props de React (Estado -> CSS ->
      // re-render -> Board3D -> Estado+... bucle), se escribe DIRECTO sobre
      // el nodo DOM del overlay (ref). Asi Board3D manda y el overlay obedece,
      // sin re-render alguno y sin bucle matriz->App.
      if (overlayElRef && overlayElRef.current) {
        overlayElRef.current.style.transform = matrixStr
        return
      }
      if (onTransformRef.current) onTransformRef.current(matrixStr, { width, height })
    }

    function worldXZ(r, c) {
      return {
        x: (c - (cols - 1) / 2) * spacing,
        z: (r - (rows - 1) / 2) * spacing,
      }
    }

    const loader = new GLTFLoader()
    const loadModel = (url) => loader.loadAsync(url).then((gltf) => gltf.scene)
    const sizeOf = (obj) => {
      const box = new THREE.Box3().setFromObject(obj)
      const size = new THREE.Vector3()
      box.getSize(size)
      return size
    }

    // No hay ninguna pieza de agua en los packs de Kenney descargados (Platformer
    // Kit, Mini Forest), asi que es un "laguito" dibujado a mano en vez de un
    // modelo cargado: una mancha redondeada e irregular (poligono con
    // el radio ligeramente aleatorio por vertice, semilla determinista por
    // celda para que no cambie entre renders) con un material azul brillante.
    function hash2(r, c, salt) {
      let h = (r * 374761393 + c * 668265263 + salt * 2654435761) | 0
      h = Math.imul(h ^ (h >>> 13), 1274126177)
      h = (h ^ (h >>> 16)) >>> 0
      return h / 4294967295
    }
    function makePond(r, c, radius) {
      const points = 14
      const shape = new THREE.Shape()
      for (let i = 0; i <= points; i++) {
        const a = (i / points) * Math.PI * 2
        const rad = radius * (0.82 + hash2(r, c, i * 7 + 1) * 0.22)
        const px = Math.cos(a) * rad
        const py = Math.sin(a) * rad
        if (i === 0) shape.moveTo(px, py)
        else shape.lineTo(px, py)
      }
      const geometry = new THREE.ShapeGeometry(shape, 8)
      const material = new THREE.MeshStandardMaterial({
        color: 0x2f7fa6,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.rotation.x = -Math.PI / 2
      return mesh
    }

    // Anillo de bando (aliado/rival) en el SUELO, geometria 3D real -no un
    // recuadro DOM. Un borde CSS (`.cell3d.cell-ally::after`) se pintaria
    // SIEMPRE por encima de todo el canvas, cortando el cuerpo del Axie donde
    // este sobresale del borde matematico de su celda. Al ser geometria real
    // tumbada en el suelo, el propio test de profundidad de WebGL hace que el
    // Axie de pie encima lo tape solo -sin trucos de z-index, es fisica de la
    // escena.
    const ringGeometry = new THREE.RingGeometry(1, 1.22, 24)
    const ringMaterials = {
      player: new THREE.MeshBasicMaterial({ color: 0x5fa0ff, transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
      enemy: new THREE.MeshBasicMaterial({ color: 0xe0544f, transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
    }
    function makeSideRing(side) {
      const material = ringMaterials[side]
      if (!material) return null
      const mesh = new THREE.Mesh(ringGeometry, material)
      mesh.rotation.x = -Math.PI / 2
      return mesh
    }

    // Un solo Map con TODAS las URLs distintas que hacen falta (base + bloques
    // de terreno + decoraciones), cargadas UNA vez cada una y clonadas por celda
    // -nunca se vuelve a pedir el mismo .glb dos veces.
    // Cada entrada de decorUrls puede ser un string (URL, encaja al 62% de la
    // celda por defecto -pensado para props sueltos como una roca) o un objeto
    // { url, fit } si hace falta un tamano distinto (p. ej. una capa de tierra
    // que cubra la celda casi entera, fit cerca de 1).
    const decorEntryUrl = (entry) => (typeof entry === 'string' ? entry : entry.url)
    const decorEntryFit = (entry) => (typeof entry === 'string' ? 0.62 : (entry.fit ?? 0.62))

    // Fondo: el tablero es un CAMPO (isla de cesped que flota sobre un
    // prado mas claro) y alrededor, como un coliseo, un anillo de MONTANAS
    // hechas de cubos (estilo Minecraft) que lo rodea por
    // completo, mas un bosque en el cinturon que queda entre el borde de la
    // rejilla y el muro. Piezas usadas (Platformer Kit y Mini Forest, CC0):
    //  - makeShadow(): una mancha oscura difuminada (textura radial en
    //    canvas) sobre el campo de fondo, justo debajo de la rejilla -es la
    //    sombra, no un objeto solido, así que no compite visualmente.
    //  - makeBackdrop(): el campo de fondo, MAS CLARO que el verde del
    //    tablero (para que no se confundan los dos), con textura de hierba
    //    (no un verde plano) y por debajo de la rejilla -el hueco es lo que,
    //    junto con el sube-y-baja (loop(), mas abajo), da la sensacion de
    //    flotar.
    //  - decorateSurroundings(): bosque + rocas + matas en el cinturon que
    //    rodea la rejilla (bufferCells se deja casi vacio a proposito: "en el
    //    centro sera solo cesped, protagonismo al board"). Densidad alta de
    //    arboles: es EL bosque que enmarca el campo, como el que hay detras
    //    de una zona de arena.
    //  - buildColosseumRing(): el muro de montanas, hecho con los CUBOS base
    //    del propio tablero (block-grass / block-snow) como
    //    voxels: una coronacion casi continua alrededor del board, apilados
    //    1-4 unidades con silueta irregular y picos nevados -lee como montaña
    //    Minecraft que ABRAZA el campo como las gradas de un coliseo. Un
    //    segundo anillo exterior mas alto y mas lejos da profundidad.
    const SNOW_BLOCK_URL = '/models/block-snow.glb'
    const DECOR_URLS = {
      treeA: '/models/mini-forest/tree.glb',
      treeB: '/models/mini-forest/tree-high.glb',
      rockA: '/models/mini-forest/rocks-high.glb',
      rockB: '/models/mini-forest/rocks-low.glb',
      rockC: '/models/mini-forest/stones.glb',
      plant: '/models/mini-forest/plant.glb',
      patch: '/models/mini-forest/patch-grass.glb',
      patchDirt: '/models/mini-forest/patch-dirt.glb',
    }

    // Piezas del Platformer Kit (mismo pack, mismas rutas de textura relativas
    // `Textures/colormap.png`) para el mundo abierto: la pendiente
    // para los escalones de las llanuras, los pinos unicos de las cimas, y la
    // vegetacion baja que se pega a los bordes de las llanuras.
    const WORLD_URLS = {
      slopeSteep: '/models/block-grass-large-slope-steep.glb',
      pine: '/models/tree-pine.glb',
      pineSmall: '/models/tree-pine-small.glb',
      grass: '/models/grass.glb',
      flowers: '/models/flowers.glb',
      mushrooms: '/models/mushrooms.glb',
    }
    // Campo de llanuras voxel: radio hasta donde llega la malla de cubos
    // (mas alla lo disuelve la niebla), tamano del lattice del ruido de valor
    // en celdas (llanuras de ~4-12 bloques del mismo nivel) y cuantas alturas
    // de cubo hay (0=suelo, 1..WORLD_LEVELS-1 = llanuras elevadas). El radio
    // llega HASTA la niebla (70-340): asi el campo 3D cubre todo lo que la
    // camara puede ver al moverse/zoom, y la niebla solo disuelve voxels en el
    // horizonte lejano en vez de descubrir un vacio tras un borde cortado.
    const WORLD_FIELD_R = 300
    const WORLD_LATTICE = 5
    const WORLD_LEVELS = 4

    // Textura de sombra: un ANILLO difuminado (no un circulo solido que se
    // oscurece hacia el centro) -el centro de la mancha queda siempre tapado
    // por el propio tablero desde esta camara (esta justo debajo), asi que un
    // gradiente que oscurece hacia el centro es invisible en la practica: solo
    // se ve el borde, que con ese gradiente era casi transparente. Aqui el
    // pico de oscuridad esta justo en el radio del borde del tablero (donde
    // SI se ve, alrededor de la base), y se desvanece hacia dentro (tapado,
    // da igual) y hacia fuera (para que no se note el corte).
    function makeShadowTexture() {
      const size = 256
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      grad.addColorStop(0, 'rgba(10,20,10,0)')
      grad.addColorStop(0.6, 'rgba(10,20,10,0)')
      grad.addColorStop(0.78, 'rgba(10,20,10,0.4)')
      grad.addColorStop(1, 'rgba(10,20,10,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, size, size)
      return new THREE.CanvasTexture(canvas)
    }

    let shadow = null
    function makeShadow(spacing2, cols2, rows2, y) {
      // El plano tiene que ser bastante mas grande que el tablero: el anillo
      // de sombra vive justo en su borde (radio ~0.78 del plano, ver arriba),
      // asi que el tablero (mas pequeno) tiene que caer dentro de esa zona.
      const geometry = new THREE.PlaneGeometry(cols2 * spacing2 * 1.28, rows2 * spacing2 * 1.28)
      const material = new THREE.MeshBasicMaterial({
        map: makeShadowTexture(),
        transparent: true,
        depthWrite: false,
      })
      shadow = new THREE.Mesh(geometry, material)
      shadow.rotation.x = -Math.PI / 2
      shadow.position.set(0, y, 0)
      boardGroup.add(shadow)
    }

    // Textura de hierba generada en un canvas (el pack de Kenney no trae
    // ningun "prado" tileable, solo bloques de celda individual): base clara
    // + manchitas mas oscuras/claras en forma de brizna, repetida muchas
    // veces sobre el plano para que no se note el patron.
    function makeGrassTexture(planeSize) {
      const size = 256
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#8fce6a'
      ctx.fillRect(0, 0, size, size)
      const blade = (fill, count, wMin, wMax, hMin, hMax) => {
        ctx.fillStyle = fill
        for (let i = 0; i < count; i++) {
          const x = Math.random() * size
          const y = Math.random() * size
          const w = wMin + Math.random() * (wMax - wMin)
          const h = hMin + Math.random() * (hMax - hMin)
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate(Math.random() * Math.PI)
          ctx.fillRect(-w / 2, -h / 2, w, h)
          ctx.restore()
        }
      }
      blade('#7ec158', 500, 2, 5, 4, 10)
      blade('#9dd97c', 350, 2, 4, 3, 7)
      const texture = new THREE.CanvasTexture(canvas)
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping
      // La repeticion se calcula del tamano del plano para que el tile mantenga
      // ~8 unidades junto al tablero aunque el campo sea gigantesco.
      const repeats = Math.max(1, Math.round(planeSize / 8))
      texture.repeat.set(repeats, repeats)
      return texture
    }

    let backdrop = null
    let backdropY = 0
    function makeBackdrop(spacing2) {
      // El hueco entre la rejilla (y=0) y el campo es lo que, junto con el
      // sube-y-baja de islandGroup, lee como "flotar" -relativo al tamano de
      // celda real, no un numero fijo. Pequeno a proposito: con la camara en
      // angulo, un hueco grande desplaza la sombra (mas abajo) muy lejos del
      // pie del tablero en pantalla y deja de leerse como su sombra.
      backdropY = -spacing2 * 0.22
      // Plano GIGANTE: el mundo abierto llega hasta la niebla (~340 ud), asi
      // que el campo tiene que cubrir todo eso y mas para que su borde nunca
      // asome -la niebla atmosferica lo disuelve antes de que se vea el corte.
      const SIZE = 4200
      const geometry = new THREE.PlaneGeometry(SIZE, SIZE)
      const material = new THREE.MeshStandardMaterial({ map: makeGrassTexture(SIZE), roughness: 0.95 })
      backdrop = new THREE.Mesh(geometry, material)
      backdrop.rotation.x = -Math.PI / 2
      backdrop.position.set(0, backdropY, 0)
      boardGroup.add(backdrop)
    }

    // Caminos de tierra: el pack no trae ningun modelo de sendero, asi que se
    // dibujan igual que el laguito (mancha irregular, radio con semilla
    // determinista por celda) pero ovalada y en tono tierra, encadenando
    // varias manchas para simular un camino que se aleja del tablero.
    const pathMaterial = new THREE.MeshStandardMaterial({ color: 0xc7a06a, roughness: 0.9 })
    function makePathBlob(seedR, seedC, radiusX, radiusZ) {
      const points = 10
      const shape = new THREE.Shape()
      for (let i = 0; i <= points; i++) {
        const a = (i / points) * Math.PI * 2
        const rx = radiusX * (0.75 + hash2(seedR, seedC, i * 5 + 3) * 0.3)
        const rz = radiusZ * (0.75 + hash2(seedR, seedC, i * 5 + 9) * 0.3)
        if (i === 0) shape.moveTo(Math.cos(a) * rx, Math.sin(a) * rz)
        else shape.lineTo(Math.cos(a) * rx, Math.sin(a) * rz)
      }
      const geometry = new THREE.ShapeGeometry(shape, 6)
      const mesh = new THREE.Mesh(geometry, pathMaterial)
      mesh.rotation.x = -Math.PI / 2
      return mesh
    }

    let surroundingsPlaced = []
    // Materiales de resaltado del board (gestionados aqui, en el ambito del
    // efecto, para que el cleanup pueda hacerles dispose).
    const brightBoardMaterials = []
    const colosseumMaterials = []
    // Mundo abierto: los cubos del campo de llanuras se dibujan con
    // InstancedMesh (una sola draw call por material en vez de miles de meshes
    // sueltos). Las geometrias fusionadas de instancia NO son compartidas con
    // los templates (se montan aqui), asi que se recogen en heapGeos para
    // hacerles dispose al desmontar SIN tocar los materiales del template.
    let worldPlaced = []
    let pathGates = []
    let pathPoints = []
    let heapGeos = []

    // Coloca un clon de un template con la base en (x, y, z) y reescalado para
    // que su mayor lado horizontal sea `fit`. Devuelve la altura ya escalada
    // (util para apilar objetos encima). Comparte geometrias/materiales con el
    // template, asi que solo se desmonta al limpiar, nunca se le hace dispose.
    function addWorldModel(tpl, x, z, y, fit, rotY) {
      const clone = tpl.clone(true)
      clone.rotation.y = rotY || 0
      const box = new THREE.Box3().setFromObject(clone)
      const size = new THREE.Vector3()
      box.getSize(size)
      const s = fit / Math.max(size.x, size.z, 0.001)
      clone.scale.setScalar(s)
      clone.position.set(x, y - box.min.y * s, z)
      boardGroup.add(clone)
      worldPlaced.push({ obj: clone, shared: true })
      return size.y * s
    }

    // Diferencia angular minima entre dos angulos (rad), para saber si un punto
    // del muro cae dentro de la "puerta" de un camino.
    const angDiff = (a, b) => {
      const d = Math.abs(a - b) % (Math.PI * 2)
      return Math.min(d, Math.PI * 2 - d)
    }
    function decorateSurroundings(spacing2, cols2, rows2) {
      // El cinturon entre el borde de la rejilla y las gradas queda LIMPIO a
      // proposito: solo cesped homogeneo, para que la zona junto al board no
      // tenga barullo. El resto (arboles, rocas, matas) paso al campo de
      // llanuras lejano, que
      // es donde la densidad no estorba al juego.

      // Distancia (en celdas) desde el borde de la rejilla -0 dentro, 1 en la
      // primera celda fuera, etc. bufferCells se deja siempre vacio: "en el
      // centro sera solo cesped, protagonismo al board".
      const distanceFromGrid = (r, c) =>
        Math.max(
          r < 0 ? -r : r >= rows2 ? r - rows2 + 1 : 0,
          c < 0 ? -c : c >= cols2 ? c - cols2 + 1 : 0
        )
      const bufferCells = 2

      // Caminos de tierra que salen del tablero, atraviesan la puerta de las
      // gradas (mismo angulo que su direccion, ver buildColosseumRing) y siguen
      // serpenteando por el mundo abierto hasta la niebla del horizonte:
      // manchas ovaladas encadenadas, con un pequeño vaiven en cuanto pasan del
      // anillo para que no parezcan una recta dibujada con regla.
      const pathDefs = [
        { startR: rows2, startC: Math.floor(cols2 * 0.3), stepR: 1, stepC: -0.25 },
        { startR: -1, startC: Math.floor(cols2 * 0.7), stepR: -1, stepC: 0.3 },
      ]
      // Direccion de cada camino en coords de mundo (x=(c-centerC), z=(r-centerR))
      // es (stepC, stepR) -su angulo marca donde el muro debe abrirse.
      pathGates = pathDefs.map((d) => Math.atan2(d.stepC, d.stepR))
      pathPoints = []
      pathDefs.forEach((def, pi) => {
        let rr = def.startR
        let cc = def.startC
        for (let step = 0; step < 36; step++) {
          if (distanceFromGrid(rr, cc) > bufferCells) {
            const x = (cc - (cols2 - 1) / 2) * spacing2
            const z = (rr - (rows2 - 1) / 2) * spacing2
            const blob = makePathBlob(pi, step, spacing2 * 0.42, spacing2 * 0.32)
            blob.position.set(x, backdropY + 0.01, z)
            boardGroup.add(blob)
            surroundingsPlaced.push({ obj: blob, shared: false })
            pathPoints.push({ x, z })
          }
          rr += def.stepR
          // Un poco de vaiven una vez pasado el anillo del coliseo.
          const beyond = distanceFromGrid(rr, cc) > 5
          cc += def.stepC + (beyond ? Math.sin(step * 0.55) * 0.28 : 0)
        }
      })
    }

    // Gradas del estadio: alrededor del board hay GRADAS limpias y
    // homogeneas -no un muro de montanas irregulares-: anillos concentricos
    // de cubos, cada uno a una altura fija y aumentando hacia
    // fuera, como las gradas de un estadio donde incluso podria haber
    // espectadores. El cinturon entre la rejilla y las gradas es cesped liso
    // (barullo quitado), y los caminos pasan por dos puertas alineadas en los
    // tres anillos.
    let wallMeshes = []
    function buildColosseumRing(spacing2, cols2, rows2, templates) {
      const cubeT = templates.get(blockUrl)
      if (!cubeT) return
      const hx = (cols2 / 2) * spacing2
      const hz = (rows2 / 2) * spacing2
      const ringR = Math.max(hx, hz) + spacing2 * 3.2
      const step = spacing2 * 0.8

      // Clona un cubo, lo asienta sobre baseY (que para el anillo es backdropY,
      // el nivel del campo) y devuelve su altura ya escalada para apilar encima.
      const placeCube = (x, z, baseY) => {
        const c = cubeT.clone(true)
        const box = new THREE.Box3().setFromObject(c)
        const size = new THREE.Vector3()
        box.getSize(size)
        const fit = spacing2 / Math.max(size.x, size.z, 0.001)
        c.scale.setScalar(fit)
        c.position.set(x, baseY - box.min.y * fit, z)
        boardGroup.add(c)
        wallMeshes.push(c)
        return size.y * fit
      }

      // Puertas: los tres anillos se abren en los angulos por donde salen los
      // caminos (pathGates, rellenos en decorateSurroundings) -el campo
      // respira hacia el horizonte en vez de quedarse cercado.
      const gateWidth = 0.24
      const gateOpen = (a) => pathGates.some((g) => angDiff(a, g) < gateWidth)

      // Los tres anillos de las gradas: cada uno sube dos cubos sobre el
      // anterior. Altura uniforme a proposito (homogeneo, sin silueta de
      // montana) y radio con un vaiven minimo para que no parezca dibujado
      // con compas.
      const tiers = [
        { rMul: 1.0, h: 1 },
        { rMul: 1.14, h: 3 },
        { rMul: 1.3, h: 5 },
      ]
      for (const tier of tiers) {
        const r = ringR * tier.rMul
        const count = Math.floor((Math.PI * 2 * r) / step)
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2
          if (gateOpen(a)) continue
          const rr = r + (hash2(i, tier.h * 100 + 5, 11) - 0.5) * step * 0.16
          const x = Math.sin(a) * rr
          const z = Math.cos(a) * rr
          let y = backdropY
          for (let k = 0; k < tier.h; k++) y += placeCube(x, z, y) * 0.94
        }
      }
      // Pintar gradas de gris (piedra del coliseo): un solo material compartido
      // por todas las caras, creado una vez y recogido para dispose.
      const grayMat = new THREE.MeshStandardMaterial({ color: 0x7a7570, roughness: 0.85 })
      colosseumMaterials.push(grayMat)
      for (const c of wallMeshes) {
        c.traverse((part) => {
          if (!part.isMesh || !part.material) return
          part.material = grayMat
        })
      }
    }

    // Mundo abierto: un CAMPO DE LLANURAS voxel que se extiende hasta el
    // horizonte, no scatter. En una malla fina (una celda de
    // mundo por cubo, mismo lenguaje voxel que el tablero y el muro del
    // coliseo) se calcula un heightfield de ruido de valor: el ruido es
    // correlacionado entre vecinos, asi que al cuantizar su altura cada zona
    // sale como UNA llanura plana de muchos cubos a la misma altura, y donde
    // el nivel cambia queda un ESCALON (la columnata de cubos del corte). Los
    // elementos se colocan por coherencia, no por azar:
    //  - escalones de 1 cubo: pieza de pendiente (large-slope-steep) apoyada
    //    en el lado bajo rampa hacia la llanura
    //  - escalones altos: rocas al pie (se erosionan y caen, posicion natural)
    //  - cimas de las llanuras altas: UN arbol unico, rara vez (arboles
    //    excepcionales, no un bosque)
    //  - bordes de llanura contra el suelo: matas/grama/setas pegadas al pie
    // La llanura no es un bloque uniforme: hay pisos (nivel 0) que son pasto,
    // camino por los senderos (nearPath, ver mas abajo), y el conjunto se
    // disuelve en la niebla del horizonte. Los cubos se dibujan con
    // InstancedMesh (una draw call por material) porque aqui son miles.
    function buildOpenWorld(spacing2, cols2, rows2, templates) {
      const cubeT = templates.get(blockUrl)
      if (!cubeT) return

      const hx = (cols2 / 2) * spacing2
      const hz = (rows2 / 2) * spacing2
      const ringR = Math.max(hx, hz) + spacing2 * 3.2
      const minR = ringR + spacing2 * 2.6
      const beltR = minR + spacing2 * 2.5
      const maxR = WORLD_FIELD_R
      const baseY = backdropY + spacing2 * 0.002

      // Altura de UN cubo ya escalado y paso de apilado (mismo convenio que el
      // muro del coliseo, que apila con 0.94 de "empalme").
      const cubeSize = sizeOf(cubeT)
      const cubeFit = spacing2 / Math.max(cubeSize.x, cubeSize.z, 0.001)
      const cubeH = cubeSize.y * cubeFit
      const step = cubeH * 0.94

      // No plantar llanuras justo encima del sendero (que siga siendo un valle
      // de tierra que atraviesa el campo hacia la niebla).
      const nearPath = (x, z) =>
        pathPoints.some((p) => {
          const dx = p.x - x
          const dz = p.z - z
          return dx * dx + dz * dz < spacing2 * spacing2 * 4.2
        })

      // Fusiona todos los Mesh del GLB en UNA geometria (con grupos de
      // material, por si el modelo trae mas de uno) y la deja con la base en
      // y=0, lista para instanciar con matrices de solo traslacion.
      const bakeGeo = (tpl) => {
        tpl.updateMatrixWorld(true)
        const pos = []
        const nrm = []
        const uv = []
        const idx = []
        const materials = []
        const groups = []
        let vBase = 0
        let minY = Infinity
        tpl.traverse((o) => {
          if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return
          const g = o.geometry.clone()
          g.applyMatrix4(o.matrixWorld)
          g.scale(cubeFit, cubeFit, cubeFit)
          const cp = g.attributes.position
          const cn = g.attributes.normal
          const cu = g.attributes.uv
          const gi = g.index
          const vStart = vBase
          const iStart = idx.length
          for (let i = 0; i < cp.count; i++) {
            const px = cp.getX(i)
            const py = cp.getY(i)
            const pz = cp.getZ(i)
            pos.push(px, py, pz)
            if (py < minY) minY = py
            if (cn) nrm.push(cn.getX(i), cn.getY(i), cn.getZ(i))
            if (cu) uv.push(cu.getX(i), cu.getY(i))
          }
          const count = gi ? gi.count : cp.count
          for (let i = 0; i < count; i++) idx.push((gi ? gi.getX(i) : i) + vBase)
          vBase = vStart + cp.count
          let mi = materials.indexOf(o.material)
          if (mi === -1) {
            mi = materials.length
            materials.push(o.material)
          }
          groups.push({ start: iStart, count, materialIndex: mi })
        })
        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
        if (nrm.length) geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3))
        if (uv.length) geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
        geo.setIndex(idx)
        for (const group of groups) geo.addGroup(group.start, group.count, group.materialIndex)
        if (minY !== Infinity && minY !== 0) geo.translate(0, -minY, 0)
        return { geo, materials }
      }

      const grassBaked = bakeGeo(cubeT)
      heapGeos.push(grassBaked.geo)

      // Heightfield: barrido celda a celda (celda = spacing, un cubo) dentro
      // del anillo [beltR, maxR]. El cinturon [minR, beltR) se deja como pasto
      // de transicion entre el coliseo y la primera llanura.
      const MAXH = WORLD_LEVELS
      const M = Math.ceil(maxR / spacing2)
      const W = M * 2 + 1
      const cellLv = new Uint8Array(W * W).fill(255)
      const at = (ix, iz) => cellLv[(iz + M) * W + (ix + M)]
      const set = (ix, iz, v) => {
        cellLv[(iz + M) * W + (ix + M)] = v
      }
      const cells = [] // { ix, iz, x, z, lv } - celdas con llanura elevada
      let cubeCount = 0

      // Pre-compute lake locations: zonas circulares donde el terreno se
      // hunde y se coloca un lago (makePond).
      const lakeCells = new Set()
      const lakeCenters = []
      for (let i = 0; i < 6; i++) {
        const angle = hash2(i, 0, 9500) * Math.PI * 2
        const dist = minR + spacing2 * 4 + hash2(i, 1, 9500) * (maxR - minR - spacing2 * 8) * 0.5
        const lx = Math.cos(angle) * dist
        const lz = Math.sin(angle) * dist
        if (nearPath(lx, lz)) continue
        const lix = Math.round(lx / spacing2)
        const liz = Math.round(lz / spacing2)
        const lakeR = 2 + Math.floor(hash2(i, 2, 9500) * 2)
        for (let dz = -lakeR; dz <= lakeR; dz++) {
          for (let dx = -lakeR; dx <= lakeR; dx++) {
            if (dx * dx + dz * dz > lakeR * lakeR + lakeR) continue
            lakeCells.add(`${lix + dx},${liz + dz}`)
          }
        }
        lakeCenters.push({ ix: lix, iz: liz, x: lx, z: lz, r: lakeR })
      }

      const sm = (t) => t * t * (3 - 2 * t)
      const LAT = spacing2 * WORLD_LATTICE
      const nz = (wx, wz) => {
        const lx = wx / LAT
        const lz = wz / LAT
        const i0 = Math.floor(lx)
        const j0 = Math.floor(lz)
        const sxp = sm(lx - i0)
        const szp = sm(lz - j0)
        const a = hash2(i0, j0, 4021) + (hash2(i0 + 1, j0, 4021) - hash2(i0, j0, 4021)) * sxp
        const b = hash2(i0, j0 + 1, 4021) + (hash2(i0 + 1, j0 + 1, 4021) - hash2(i0, j0 + 1, 4021)) * sxp
        return a + (b - a) * szp
      }

      for (let iz = -M; iz <= M; iz++) {
        for (let ix = -M; ix <= M; ix++) {
          const x = ix * spacing2
          const z = iz * spacing2
          const r2 = x * x + z * z
          if (r2 < beltR * beltR || r2 > maxR * maxR) continue
          if (nearPath(x, z)) continue
          if (lakeCells.has(`${ix},${iz}`)) continue
          const lv = Math.max(0, Math.min(MAXH - 1, Math.round(nz(x, z) * (MAXH - 1))))
          set(ix, iz, lv)
          if (lv <= 0) continue
          cells.push({ ix, iz, x, z, lv })
          cubeCount += lv
        }
      }

      if (cubeCount > 0 && grassBaked.geo) {
        const GREEN_TINTS = [
          new THREE.Color(0.92, 1.0, 0.88),
          new THREE.Color(1.0, 1.02, 0.95),
          new THREE.Color(0.88, 0.96, 0.92),
          new THREE.Color(1.05, 0.98, 0.88),
          new THREE.Color(0.95, 1.05, 0.90),
          new THREE.Color(0.85, 0.92, 0.82),
        ]
        const grassInst = new THREE.InstancedMesh(grassBaked.geo, grassBaked.materials, cubeCount)
        grassInst.count = cubeCount
        grassInst.matrixAutoUpdate = false
        grassInst.frustumCulled = false
        const mat = new THREE.Matrix4()
        let gi = 0
        for (const cell of cells) {
          const tint = GREEN_TINTS[Math.floor(hash2(cell.ix, cell.iz, 9100) * GREEN_TINTS.length)]
          for (let k = 0; k < cell.lv; k++) {
            mat.makeTranslation(cell.x, baseY + k * step, cell.z)
            grassInst.setMatrixAt(gi, mat)
            grassInst.setColorAt(gi, tint)
            gi++
          }
        }
        grassInst.instanceMatrix.needsUpdate = true
        grassInst.instanceColor.needsUpdate = true
        boardGroup.add(grassInst)
        worldPlaced.push({ obj: grassInst, shared: true })
      }

      // Colocar lagos en los centros pre-computados
      for (const lake of lakeCenters) {
        const pond = makePond(lake.ix, lake.iz, spacing2 * (0.8 + lake.r * 0.35))
        pond.position.set(lake.x, backdropY + 0.01, lake.z)
        boardGroup.add(pond)
        surroundingsPlaced.push({ obj: pond, shared: false })
      }

      // Decoracion COHERENTE (no scatter): cada pieza sale de una regla
      // contextual del propio terreno, no de un reparto aleatorio por "semillas".
      const slopeT = templates.get(WORLD_URLS.slopeSteep)
      const rockT = templates.get(DECOR_URLS.rockA)
      const rocksT = templates.get(DECOR_URLS.rockC)
      const pineT = templates.get(WORLD_URLS.pine)
      const pineSmallT = templates.get(WORLD_URLS.pineSmall)
      const treeT = templates.get(DECOR_URLS.treeA)
      const grassDT = templates.get(WORLD_URLS.grass)
      const flowersT = templates.get(WORLD_URLS.flowers)
      const mushroomsT = templates.get(WORLD_URLS.mushrooms)
      const N4 = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]

      // Escalones de 1 cubo: rampa apoyada en el suelo del lado bajo.
      for (const cell of cells) {
        if (cell.lv !== 1 || !slopeT) continue
        for (const [dxn, dzn] of N4) {
          const nlv = at(cell.ix + dxn, cell.iz + dzn)
          if (nlv !== 0) continue
          if (hash2(cell.ix, cell.iz, 8201) > 0.11) break
          const ux = -dxn
          const uz = -dzn
          const gx = (cell.ix + dxn) * spacing2
          const gz = (cell.iz + dzn) * spacing2
          addWorldModel(slopeT, gx + ux * spacing2 * 0.45, gz + uz * spacing2 * 0.45, baseY + 0.002, spacing2 * 1.9, Math.atan2(ux, uz))
          break
        }
      }

      // Rocas al pie de escalones altos (nivel >= 2 contra el suelo).
      for (const cell of cells) {
        if (cell.lv < 2) continue
        let ground = null
        for (const [dxn, dzn] of N4) {
          if (at(cell.ix + dxn, cell.iz + dzn) === 0) {
            ground = [dxn, dzn]
            break
          }
        }
        if (ground && (rockT || rocksT) && hash2(cell.ix, cell.iz, 8301) < 0.16) {
          const tpl = !rockT || hash2(cell.ix, cell.iz, 8303) < 0.5 ? rocksT : rockT
          if (tpl) {
            addWorldModel(
              tpl,
              (cell.ix + ground[0]) * spacing2,
              (cell.iz + ground[1]) * spacing2,
              baseY,
              spacing2 * 0.75,
              hash2(cell.ix, cell.iz, 8307) * Math.PI * 2
            )
          }
        }
      }

      // Arboles en cimas de llanuras (mas frecuentes) y dispersos en el campo.
      for (const cell of cells) {
        if (cell.lv < 2) continue
        const n0 = at(cell.ix + 1, cell.iz)
        const n1 = at(cell.ix - 1, cell.iz)
        const n2 = at(cell.ix, cell.iz + 1)
        const n3 = at(cell.ix, cell.iz - 1)
        if (n0 > cell.lv || n1 > cell.lv || n2 > cell.lv || n3 > cell.lv) continue
        const flat = n0 === cell.lv || n1 === cell.lv || n2 === cell.lv || n3 === cell.lv
        if (!flat) continue
        if (hash2(cell.ix, cell.iz, 8401) >= 0.12) continue
        const topY = baseY + cell.lv * step
        const r = hash2(cell.ix, cell.iz, 8403)
        const tpl = r < 0.4 ? pineT : r < 0.7 ? (pineSmallT || pineT) : treeT
        if (tpl) {
          addWorldModel(tpl, cell.x, cell.z, topY + 0.001, spacing2 * 1.15, hash2(cell.ix, cell.iz, 8405) * Math.PI * 2)
        }
      }

      // Arboles dispersos en el campo abierto (nivel 0), lejos del tablero.
      for (let iz = -M; iz <= M; iz++) {
        for (let ix = -M; ix <= M; ix++) {
          if (at(ix, iz) !== 0) continue
          if (hash2(ix, iz, 8420) >= 0.004) continue
          const x = ix * spacing2
          const z = iz * spacing2
          const r2 = x * x + z * z
          if (r2 < minR * minR * 1.5) continue
          const tpl = hash2(ix, iz, 8423) < 0.5 ? pineT : (pineSmallT || treeT)
          if (tpl) {
            addWorldModel(tpl, x, z, baseY + 0.001, spacing2 * 0.9, hash2(ix, iz, 8425) * Math.PI * 2)
          }
        }
      }

      // Vegetacion baja pegada a los bordes de llanura contra el suelo (nivel 0).
      const patchDirtT = templates.get(DECOR_URLS.patchDirt)
      for (let iz = -M; iz <= M; iz++) {
        for (let ix = -M; ix <= M; ix++) {
          if (at(ix, iz) !== 0) continue
          let raised = false
          for (const [dxn, dzn] of N4) {
            const nl = at(ix + dxn, iz + dzn)
            if (nl > 0 && nl !== 255) {
              raised = true
              break
            }
          }
          if (!raised) continue
          const r = hash2(ix, iz, 8501)
          if (r >= 0.16) continue
          const x = ix * spacing2
          const z = iz * spacing2
          let tpl
          if (r < 0.03) tpl = patchDirtT || (flowersT || grassDT)
          else if (r < 0.06) tpl = flowersT || grassDT
          else if (r < 0.10) tpl = grassDT
          else tpl = mushroomsT
          if (tpl) addWorldModel(tpl, x, z, baseY + 0.001, spacing2 * 0.5, hash2(ix, iz, 8503) * Math.PI * 2)
        }
      }
    }

    const urlSet = new Set([
      blockUrl,
      SNOW_BLOCK_URL,
      ...Object.values(terrainBlockUrls || {}),
      ...Object.values(decorUrls || {})
        .filter((entry) => decorEntryUrl(entry))
        .map(decorEntryUrl),
      ...Object.values(DECOR_URLS),
      ...Object.values(WORLD_URLS),
    ])
    const blocksReady = Promise.all([...urlSet].map((url) => loadModel(url).then((scene3d) => [url, scene3d]))).then((entries) => {
      if (disposed) return null
      const templates = new Map(entries)
      const baseTemplate = templates.get(blockUrl)
      spacing = Math.max(sizeOf(baseTemplate).x, sizeOf(baseTemplate).z) || 1
      baseHeight = sizeOf(baseTemplate).y

      const terrainAtFn = terrainAtRef.current || (() => 'open')
      // Destacar el BOARD: los bloques de cesped de la rejilla se pintan con
      // un material mas claro y llamativo que el campo y las gradas, usando
      // el propio map como emissiveMap para que la tapa de hierba brille mas
      // donde el texto ya es verde sin lavar las caras de
      // tierra (ahi el map es oscuro y el brillo apenas actua). Un clon por
      // material base; se recogen para hacerles dispose al desmontar.
      const BRIGHT_TINT = new THREE.Color(1.3, 1.5, 1.12)
      const BRIGHT_GLOW = new THREE.Color(0x7fce5a)
      const BRIGHT_GLOW_POWER = 0.3
      const getBrightBoardMaterial = (base) => {
        for (const existing of brightBoardMaterials) {
          if (existing.userData.base === base) return existing
        }
        const m = base.clone()
        m.color.multiply(BRIGHT_TINT)
        if (m.map) {
          m.emissiveMap = m.map
          m.emissive.copy(BRIGHT_GLOW)
          m.emissiveIntensity = BRIGHT_GLOW_POWER
        }
        m.userData.base = base
        brightBoardMaterials.push(m)
        return m
      }
      const brightenBoard = (block) => {
        block.traverse((part) => {
          if (!part.isMesh || !part.material) return
          const arr = Array.isArray(part.material) ? part.material : [part.material]
          part.material = arr.map(getBrightBoardMaterial)
          if (part.material.length === 1) part.material = part.material[0]
        })
      }
      // El fondo se monta aqui, una vez que spacing/baseHeight ya son
      // correctos: primero el campo de hierba (mas abajo de la rejilla),
      // luego la sombra suave justo encima de el, y por ultimo la decoracion
      // dispersa del anillo exterior.
      makeBackdrop(spacing)
      makeShadow(spacing, cols, rows, backdropY + 0.02)
      decorateSurroundings(spacing, cols, rows)
      buildColosseumRing(spacing, cols, rows, templates)
      buildOpenWorld(spacing, cols, rows, templates)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const terrain = terrainAtFn(r, c)
          const x = (c - (cols - 1) / 2) * spacing
          const z = (r - (rows - 1) / 2) * spacing

          // Cada pieza de Kenney puede traer su propia escala/origen (block-snow
          // no medía igual que block-grass pese a verse igual en su preview de
          // 64x64 -salia diminuto y flotando). Por eso TODA pieza -sea bloque
          // sustituto o decoracion- se reescala para encajar en el hueco de la
          // celda y se reposiciona para que su base toque y=0 (o la altura del
          // bloque, si es una decoracion encima), en vez de asumir que todas
          // comparten el mismo tamano/origen que el bloque de cesped.
          const blockUrlForTerrain = terrainBlockUrls && terrainBlockUrls[terrain]
          const blockTemplate = (blockUrlForTerrain && templates.get(blockUrlForTerrain)) || baseTemplate
          const block = blockTemplate.clone(true)
          if (blockUrlForTerrain) {
            const blockBox = new THREE.Box3().setFromObject(block)
            const blockSize = new THREE.Vector3()
            blockBox.getSize(blockSize)
            const fit = spacing / Math.max(blockSize.x, blockSize.z, 0.001)
            block.scale.setScalar(fit)
            block.position.set(x, -blockBox.min.y * fit, z)
          } else {
            block.position.set(x, 0, z)
            brightenBoard(block)
          }
          islandGroup.add(block)

          const decorEntry = decorUrls && decorUrls[terrain]
          let cellSurface = baseHeight
          if (decorEntry && decorEntry.type === 'pond') {
            const pond = makePond(r, c, spacing * (decorEntry.fit ?? 0.44))
            pond.position.set(x, baseHeight + 0.01, z)
            islandGroup.add(pond)
            cellSurface = baseHeight + 0.01
          }
          const decorUrl = decorEntry && decorEntryUrl(decorEntry)
          if (decorUrl && templates.has(decorUrl)) {
            const decorTemplate = templates.get(decorUrl)
            const decor = decorTemplate.clone(true)
            const decorBox = new THREE.Box3().setFromObject(decor)
            const decorSize = new THREE.Vector3()
            decorBox.getSize(decorSize)
            const fit = (spacing * decorEntryFit(decorEntry)) / Math.max(decorSize.x, decorSize.z, 0.001)
            decor.scale.setScalar(fit)
            // Elevado un pelin por encima de la tapa del bloque para que no
            // haya z-fight entre dos planos (la capa de tierra es una pieza
            // plana practicamente del tamano de la celda, coplanaria con la
            // cara superior del bloque): sin ese epsilon la imagen parpadea y
            // se tragaba a veces la pieza entera (T3). 0.015 de celda no se ve.
            decor.position.set(x, baseHeight + 0.015 * spacing - decorBox.min.y * fit, z)
            islandGroup.add(decor)
            // La superficie REAL de la casilla, para asentar al Axie encima (su
            // tapa = posicion base de la pieza + su altura escalada).
            cellSurface = decor.position.y + decorSize.y * fit
          }
          cellTop[r * cols + c] = cellSurface
        }
      }
      terrainReady = true
      resize()
      return true
    })

    // Axies 3D reales (genoma -> geometria), via
    // @jaatster/threejs-axie-mixer3d-public (mixer vanilla en Three.js, no r3f
    // -mismo motivo que con los bloques: sin reconciliador que sincronizar).
    // Autorizado explicitamente para Axie Vibeathon en su RIGHTS.md (verificado
    // antes de instalarlo). El mixer se crea UNA sola vez PARA TODA LA APP
    // (axieMixer3D.js, singleton compartido con los retratos de las cartas) y se
    // reutiliza para cada Axie -crear un mixer por unidad multiplicaria por
    // unidad la descarga del pack de animaciones (varios miles de ficheros).
    const mixerReady = getSharedAxieMixer3D()

    // Corona real (ver loadCrownTemplate arriba), cargada en paralelo con todo
    // lo demas. crownTemplate/crownNaturalSize quedan null hasta que resuelve;
    // positionHandle comprueba eso y, si el Lord ya existia antes de que la
    // corona terminara de cargar, la sincronizacion se repite en cuanto llega
    // (crownReady.then(() => syncRef.current && syncRef.current())) para
    // ponersela con retraso en vez de esperar a la siguiente accion del juego.
    let crownTemplate = null
    let crownNaturalSize = 1
    loadCrownTemplate().then(({ root, naturalSize }) => {
      if (disposed) return
      crownTemplate = root
      crownNaturalSize = naturalSize
      if (syncRef.current) syncRef.current()
    })

    const handles = new Map()
    const pending = new Set()

    // Textura reutilizada por los sprites de flash (dano/heal): un degradado
    // radial blanco->transparente, tintado con el color del efecto en el
    // material de cada sprite. Cero geometrias compartidas problemáticas.
    const flashTexture = (() => {
      const size = 128
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      const grad = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2)
      grad.addColorStop(0, 'rgba(255,255,255,1)')
      grad.addColorStop(0.55, 'rgba(255,255,255,0.55)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, size, size)
      return new THREE.CanvasTexture(canvas)
    })()
    function flashSpriteMaterial(color) {
      return new THREE.SpriteMaterial({
        map: flashTexture,
        color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    }
    function ensureFlashSprite(handle) {
      if (handle.flashSprite) return handle.flashSprite
      handle.flashSprite = new THREE.Sprite(flashSpriteMaterial(0xffffff))
      handle.flashSprite.position.set(0, spacing * 0.85, 0)
      handle.flashSprite.scale.setScalar(spacing * 1.6)
      handle.flashSprite.visible = false
      handle.wrapper.add(handle.flashSprite)
      return handle.flashSprite
    }
    function flashHandle(handle, color) {
      const sprite = ensureFlashSprite(handle)
      sprite.material.color.setHex(color)
      sprite.material.opacity = 1
      sprite.visible = true
      handle.flashUntil = elapsedTime + 0.45
    }
    function applyCrown(handle, unit, x, z) {
      if (unit.isLord) {
        if (!handle.crown && crownTemplate) {
          const crownScale = (spacing * 0.275) / crownNaturalSize
          handle.crown = crownTemplate.clone(true)
          handle.crown.scale.setScalar(crownScale)
          handle.floatSeed = Math.random() * Math.PI * 2
          islandGroup.add(handle.crown)
          const worldBox = new THREE.Box3().setFromObject(handle.wrapper)
          handle.headOffset = worldBox.max.y - handle.wrapper.position.y
        }
        if (handle.crown) {
          handle.crown.position.x = x
          handle.crown.position.z = z
          handle.crownBaseY = handle.wrapper.position.y + handle.headOffset + spacing * 0.05
        }
      }
    }
    function applyFacing(handle, unit, x, z) {
      if (unit.facing) {
        const target = worldXZ(unit.facing.r, unit.facing.c)
        const dx = target.x - x
        const dz = target.z - z
        if (Math.abs(dx) > 1e-6 || Math.abs(dz) > 1e-6) {
          handle.wrapper.rotation.y = Math.atan2(dx, dz)
        }
      }
    }

    // T1: movimiento con interpolacion entre casillas. positionHandle decide
    // entre tres casos:
    //  - handle nuevo (cellR/cellC null): apariciÃ³n, se coloca en seco.
    //  - misma casilla: solo cara/rotacion/corona.
    //  - casilla distinta: arranca (o reorienta) un tween de caminar, y el
    //    Axie entra en locomotion 'walk'. El loop de render avanza el tween y
    //    anima position; al llegar, vuelve a idle y aplica la cara final.
    function positionHandle(handle, unit) {
      handle.id = unit.id
      const { x, z } = worldXZ(unit.r, unit.c)
      const topY = topAt(unit.r, unit.c)
      const baseY = topY - handle.boxMinY * handle.fit + spacing * 0.025

      if (!handle.ring && unit.side) {
        handle.ring = makeSideRing(unit.side)
        if (handle.ring) {
          handle.ring.scale.setScalar(spacing * 0.36)
          islandGroup.add(handle.ring)
        }
      }

      // Flash de dano/curacion por diff de HP (el HP llega en axieUnits).
      if (handle.lastHp != null && unit.hp != null && unit.hp !== handle.lastHp) {
        flashHandle(handle, unit.hp < handle.lastHp ? 0xff5540 : 0x57e36b)
      }
      handle.lastHp = unit.hp

      const isNew = handle.cellR == null || handle.cellC == null
      if (isNew) {
        handle.cellR = unit.r
        handle.cellC = unit.c
        handle.wrapper.position.set(x, baseY, z)
        if (handle.ring) handle.ring.position.set(x, topY + 0.012, z)
        applyCrown(handle, unit, x, z)
        applyFacing(handle, unit, x, z)
        return
      }

      const changed = handle.cellR !== unit.r || handle.cellC !== unit.c
      if (!changed) {
        // Misma casilla: solo cara/corona (el tween de una casilla a si misma
        // no existe). El color de la cara puede cambiar por seleccion/objetivo.
        applyCrown(handle, unit, x, z)
        applyFacing(handle, unit, x, z)
        if (handle.ring) handle.ring.position.set(x, topY + 0.012, z)
        return
      }

      const prevTopY = topAt(handle.cellR, handle.cellC)
      handle.cellR = unit.r
      handle.cellC = unit.c
      if (handle.tween) {
        // Ya hay un tween en marcha hacia otro sitio: reorientar el destino en
        // vez de encadenar (syncUnits puede dispararse varias veces seguidas).
        handle.tween.toX = x
        handle.tween.toZ = z
        handle.tween.toY = topY - handle.boxMinY * handle.fit + spacing * 0.025
        handle.tween.toRingY = topY + 0.012
        handle.tween.pendingFacing = unit.facing
        return
      }
      const from = handle.wrapper.position
      const dur = 0.18 + 0.3 * (Math.hypot(x - from.x, z - from.z) / spacing)
      handle.tween = {
        fromX: from.x,
        fromZ: from.z,
        fromY: from.y,
        toX: x,
        toZ: z,
        toY: topY - handle.boxMinY * handle.fit + spacing * 0.025,
        fromRingY: prevTopY + 0.012,
        toRingY: topY + 0.012,
        t: 0,
        dur,
        pendingFacing: unit.facing,
      }
      handle.axie.setMoveSpeed(0.35, 0.2)
      handle.axie.setLocomotion('walk', 0.2)
      const dx = x - from.x
      const dz = z - from.z
      if (Math.abs(dx) > 1e-6 || Math.abs(dz) > 1e-6) handle.wrapper.rotation.y = Math.atan2(dx, dz)
    }

    async function createHandle(unit) {
      const mixer = await mixerReady
      // unit.descriptor (AxieDescriptor: clase pura verificada contra el
      // manifest local, ver axieGeneCatalog.js) tiene prioridad sobre
      // unit.genes: los genomas reales de marketplace probados (45 IDs, las
      // 4 clases, precio suelo y coleccion Mystic) fallan casi todos con 5 o
      // 6 de 6 partes sin asset local -el pack que trae el paquete es una
      // demo, no un espejo del universo real de partes-, asi que las
      // unidades "de verdad visibles" usan combinaciones de clase pura
      // confirmadas presentes en public/assets/axie/manifest.json.
      const axie = unit.descriptor
        ? await mixer.create({
            descriptor: unit.descriptor,
            quality: 'balanced',
            artMode: 'faithful',
            strict: true,
          })
        : await mixer.createFromGenes({
            axieId: unit.id,
            genes: unit.genes,
            quality: 'balanced',
            artMode: 'faithful',
            strict: true,
          })
      const box = new THREE.Box3().setFromObject(axie.wrapper)
      const size = new THREE.Vector3()
      box.getSize(size)
      const fit = (spacing * 0.75) / Math.max(size.x, size.z, 0.001)
      axie.wrapper.scale.setScalar(fit)
      axie.setMoveSpeed(0)
      islandGroup.add(axie.wrapper)
      return {
        axie,
        wrapper: axie.wrapper,
        fit,
        boxMinY: box.min.y,
        id: null,
        crown: null,
        headOffset: 0,
        crownBaseY: 0,
        floatSeed: 0,
        ring: null,
        cellR: null,
        cellC: null,
        tween: null,
        flashSprite: null,
        flashUntil: 0,
        lastHp: null,
      }
    }

    function syncUnits() {
      // spacing/baseHeight solo son correctos una vez que el terreno termino
      // de cargar (blocksReady) -si el efecto de unidades dispara una
      // sincronizacion antes de eso (puede pasar: se ejecuta nada mas montar,
      // en paralelo con la carga del terreno), no hacer nada todavia; en
      // cuanto termine el terreno, `blocksReady.then(syncUnits)` la vuelve a
      // llamar con los valores reales ya listos.
      if (disposed || !terrainReady) return
      const desired = desiredUnitsRef.current || []
      const desiredIds = new Set(desired.map((u) => u.id))

      for (const [id, handle] of handles) {
        if (desiredIds.has(id)) continue
        islandGroup.remove(handle.wrapper)
        // La corona clonada comparte geometria/materiales con crownTemplate
        // (Object3D.clone no los duplica) -quitarla de la escena basta, nunca
        // hay que hacerle dispose por instancia o se rompe el resto de clones.
        if (handle.crown) islandGroup.remove(handle.crown)
        // El anillo comparte ringGeometry/ringMaterials con TODOS los demas
        // -mismo motivo, solo quitar de la escena, dispose una vez al
        // desmontar el efecto (mas abajo).
        if (handle.ring) islandGroup.remove(handle.ring)
        handle.axie.dispose()
        handles.delete(id)
      }

      for (const unit of desired) {
        const handle = handles.get(unit.id)
        if (handle) {
          positionHandle(handle, unit)
          continue
        }
        if (pending.has(unit.id)) continue
        pending.add(unit.id)
        createWithRetry(unit)
          .then((newHandle) => {
            pending.delete(unit.id)
            if (disposed) {
              newHandle.axie.dispose()
              return
            }
            const latest = (desiredUnitsRef.current || []).find((u) => u.id === unit.id)
            if (!latest) {
              newHandle.axie.dispose()
              return
            }
            positionHandle(newHandle, latest)
            handles.set(unit.id, newHandle)
            checkReady()
          })
          .catch((err) => {
            pending.delete(unit.id)
            // eslint-disable-next-line no-console
            console.error('No se pudo cargar el Axie 3D:', unit.id, err)
            checkReady()
          })
      }
      firstSyncDone = true
      checkReady()
    }

    // Un fallo transitorio al cargar el Axie 3D (fetch del GLB, etc.) no debe
    // dejar la casilla del Axie vacia ni levantar la cortina antes de tiempo:
    // se reintenta un par de veces con una pequena pausa antes de rendirse del
    // todo (solo entonces se permite que la cortina suba).
    async function createWithRetry(unit, attempt = 0) {
      try {
        return await createHandle(unit)
      } catch (err) {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 600))
          return createWithRetry(unit, attempt + 1)
        }
        throw err
      }
    }

    let readyNotified = false
    let firstSyncDone = false
    function checkReady() {
      if (readyNotified || disposed || !terrainReady || !firstSyncDone) return
      if (pending.size > 0) return
      readyNotified = true
      onReadyRef.current?.()
    }

    syncRef.current = syncUnits
    blocksReady.then(syncUnits)

    // T1: efectos de animacion (channel fx de App.jsx). El Animator del mixer
    // vuelve solo a la locomotion al terminar un clip one-shot (ver tipos:
    // "one-shots release on finish"), asi que no hay que programar el regreso.
    function dispatchFx(events) {
      if (disposed) return
      for (const ev of events) {
        const handle = handles.get(ev.unitId)
        if (!handle) continue
        if (ev.kind === 'attack') {
          const clip = SLOT_ATTACK_ANIM[ev.slot] ?? FALLBACK_ATTACK_ANIM
          handle.axie.setMoveSpeed(0, 0.15)
          handle.axie.playAnimation(clip, { transition: 0.12 })
        }
      }
    }
    syncFxRef.current = dispatchFx

    const ro = new ResizeObserver(() => resize())
    ro.observe(host)
    resize()

    // ---- Vista movible y interactiva (T5) ---------------------------------
    // Pan con el raton (arrastrar), zoom con la rueda, y teclado: flechas /
    // WASD para mover, +/- para zoom, R para restablecer la vista. Como la
    // camara es ortografica, mover el target y escalar el frustum lo es todo:
    // applyView() repinta y vuelve a publicar la matriz CSS, asi el overlay DOM
    // (Board3D::publishTransform -> App) sigue alineado pase lo que pase.
    const dragState = { active: false, px: 0, py: 0 }
    let suppressClickUntil = 0
    // Umbral de arrastre en px antes de considerar que es pan (no un click sobre
    // una celda): el overlay interactivo de las celdas esta encima del canvas,
    // y hay que dejar pasar los clicks sin "panear" de medio pixel.
    const PAN_START_PX = 5
    function cameraRightAxis() {
      camera.updateMatrixWorld()
      return new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0)
    }
    function cameraUpAxis() {
      camera.updateMatrixWorld()
      return new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1)
    }
    function panWorldPixels(dx, dy, render = true) {
      // Cuantos unidades de mundo representa un pixel en cada eje de la vista
      // (camara ortografica: uniforme en todo el frustum).
      const xScale = (camera.right - camera.left) / (viewW || 1)
      const yScale = (camera.top - camera.bottom) / (viewH || 1)
      const right = cameraRightAxis()
      const up = cameraUpAxis()
      // Arrastrar el contenido hacia la derecha/abajo => el target se mueve en
      // sentido contrario por el eje local de la camara.
      camTarget.addScaledVector(right, -dx * xScale)
      camTarget.addScaledVector(up, dy * yScale)
      const limit = (cols + rows) * 1.2
      const len = camTarget.length()
      if (len > limit) camTarget.multiplyScalar(limit / len)
      if (render) applyView()
    }
    // Inercia del pan: al soltar el arrastre, la vista sigue deslizandose
    // con la velocidad que llevaba y frena poco a poco en vez de pararse en
    // seco. vx/vy en px por segundo.
    const momentum = { vx: 0, vy: 0 }
    const MOMENTUM_DECAY = 3.2
    function onPointerDown(e) {
      dragState.active = true
      dragState.px = e.clientX
      dragState.py = e.clientY
      dragState.moved = false
      dragState.pendingX = 0
      dragState.pendingY = 0
      momentum.vx = 0
      momentum.vy = 0
      host.setPointerCapture(e.pointerId)
    }
    function onPointerMove(e) {
      if (!dragState.active) return
      const dx = e.clientX - dragState.px
      const dy = e.clientY - dragState.py
      dragState.px = e.clientX
      dragState.py = e.clientY
      if (Math.abs(dx) + Math.abs(dy) < PAN_START_PX && !dragState.moved) return
      dragState.moved = true
      // Coalescer el pan del drag: el raton puede emitir cientos de eventos por
      // segundo, y aplicar cada desplazamiento con su render + reescritura de la
      // matriz CSS era justo lo que causaba el lag al mover la vista isometrica.
      // Se acumula el desplazamiento pendiente y el bucle rAF lo aplica UNA vez
      // por frame (ver loop(), abajo). El momentum marca la velocidad del gesto.
      dragState.pendingX = (dragState.pendingX ?? 0) + dx
      dragState.pendingY = (dragState.pendingY ?? 0) + dy
      momentum.vx = dx * 60
      momentum.vy = dy * 60
    }
    function onPointerUp(e) {
      if (!dragState.active) return
      dragState.active = false
      if (host.hasPointerCapture(e.pointerId)) host.releasePointerCapture(e.pointerId)
      // Si el gesto acabó siendo un arrastre (pan real), tragarse el click que
      // igualmente va a llegar a la celda que quedó bajo el cursor -si no, panear
      // volveria a provocar un onClick de celda inesperado.
      if (dragState.moved) suppressClickUntil = performance.now() + 350
      else {
        momentum.vx = 0
        momentum.vy = 0
      }
    }
    function onCaptureClick(e) {
      if (performance.now() < suppressClickUntil) {
        e.stopPropagation()
        e.preventDefault()
      }
    }
    function onWheel(e) {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 1.12 : 1 / 1.12
      zoomTarget = Math.min(4.5, Math.max(0.35, zoomTarget * factor))
      if (zoomTarget === zoom) publishTransform(viewW, viewH)
    }
    const onKeyDown = (e) => {
      const step = 18
      const zoomKeys = { '=': 1 / 1.2, '+': 1 / 1.2, '-': 1.2, _: 1.2 }
      if (e.key === 'r' || e.key === 'R') {
        camTarget.set(0, 0, 0)
        momentum.vx = 0
        momentum.vy = 0
        zoomTarget = 1
        zoom = 1
        applyZoom()
        applyView()
        return
      }
      if (e.key in zoomKeys) {
        zoomTarget = Math.min(4.5, Math.max(0.35, zoomTarget * zoomKeys[e.key]))
        return
      }
      let dx = 0
      let dy = 0
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dx = -step
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dx = step
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dy = -step
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dy = step
      if (dx || dy) panWorldPixels(dx, dy)
    }
    host.addEventListener('pointerdown', onPointerDown)
    host.addEventListener('pointermove', onPointerMove)
    host.addEventListener('pointerup', onPointerUp)
    host.addEventListener('pointercancel', onPointerUp)
    host.addEventListener('wheel', onWheel, { passive: false })
    host.addEventListener('click', onCaptureClick, true)
    window.addEventListener('keydown', onKeyDown)

    const clock = new THREE.Clock()
    let elapsedTime = 0
    // Velocidad de giro y de flotado de la corona, en radianes/seg y unidades
    // de tablero/seg respectivamente -flota y rota sobre la cabeza del Lord.
    const CROWN_SPIN_SPEED = 0.6
    const CROWN_FLOAT_SPEED = 1.6
    // Efecto de flotar: la isla entera (rejilla + canto + Axies, ver
    // islandGroup mas arriba) sube y baja muy sutil y despacio, como si
    // flotase en el aire sobre el campo de fondo -que se queda fijo, es el
    // contraste el que hace notar el movimiento.
const ISLAND_BOB_SPEED = 0.5
    // espaciang todavia no es el real (blocksReady no ha resuelto) la primera
    // vez que se define loop() -se relee en cada frame, no se fija aqui, para
    // que la amplitud sea siempre relativa al tamano real de celda.

    // Tween de movimiento: el marcador DOM del overlay (.unit) vive en el
    // espacio local de CELDAS que hereda el .board-overlay-3d (alineado por la
    // misma matriz CSS), asi que el desplazamiento que el cuerpo 3D lleva frame
    // a frame se traduce a "px de overlay" con la fraccion de celda * cellSize,
    // relativo a la casilla destino (donde React ya coloco el marcador). Se le
    // aplica como translate() directo, sin re-render, y se limpia al llegar.
    function publishUnitMove(handle, x, z) {
      if (!onTweenRef.current || handle.id == null) return
      const fracC = x / spacing + (cols - 1) / 2
      const fracR = z / spacing + (rows - 1) / 2
      onTweenRef.current({
        id: handle.id,
        dx: (fracC - handle.cellC) * cellSize,
        dy: (fracR - handle.cellR) * cellSize,
      })
    }
    function clearUnitMove(handle) {
      if (!onTweenRef.current || handle.id == null) return
      onTweenRef.current({ id: handle.id, dx: 0, dy: 0, done: true })
    }
    function loop() {
      if (disposed) return
      const dt = clock.getDelta()
      elapsedTime += dt
      islandGroup.position.y = Math.sin(elapsedTime * ISLAND_BOB_SPEED) * (spacing * 0.06)
      // Vista fluida: perseguir el zoom objetivo y dejar que la inercia del pan
      // se desvanezca. Si algo de la camara ha cambiado este frame, hay que
      // volver a publicar la matriz CSS del overlay (antes del render de abajo).
      let camAnimated = false
      if (zoomTarget !== zoom) {
        const diff = zoomTarget - zoom
        zoom += diff * (1 - Math.exp(-10 * dt))
        if (Math.abs(zoomTarget - zoom) < 0.002) zoom = zoomTarget
        applyZoom()
        camAnimated = true
      }
      const speed = Math.hypot(momentum.vx, momentum.vy)
      // Pan pendiente del drag (coalescido en onPointerMove): aplicar una vez
      // por frame, no a la velocidad de eventos del raton.
      if (dragState.active && (dragState.pendingX || dragState.pendingY)) {
        panWorldPixels(dragState.pendingX, dragState.pendingY, false)
        dragState.pendingX = 0
        dragState.pendingY = 0
        camAnimated = true
      }
      if (!dragState.active && speed > 0.01) {
        const factor = Math.exp(-MOMENTUM_DECAY * dt)
        panWorldPixels(momentum.vx * dt, momentum.vy * dt, false)
        momentum.vx *= factor
        momentum.vy *= factor
        camAnimated = true
      } else if (!dragState.active) {
        momentum.vx = 0
        momentum.vy = 0
      }
      if (camAnimated) reposCamera(false)
      for (const handle of handles.values()) {
        handle.axie.update(dt)
        if (handle.crown) {
          handle.crown.rotation.y += dt * CROWN_SPIN_SPEED
          handle.crown.position.y =
            handle.crownBaseY + Math.sin(elapsedTime * CROWN_FLOAT_SPEED + handle.floatSeed) * spacing * 0.05
        }
        // T1: avanzar el tween de movimiento (interpolacion de casilla a
        // casilla). Al llegar, vuelve a idle y aplica la cara final (que
        // positionHandle guardo en pendingFacing al arrancar el tween).
        if (handle.tween) {
          handle.tween.t += dt
          const k = Math.min(1, handle.tween.t / handle.tween.dur)
          const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
          const x = handle.tween.fromX + (handle.tween.toX - handle.tween.fromX) * ease
          const z = handle.tween.fromZ + (handle.tween.toZ - handle.tween.fromZ) * ease
          const y = handle.tween.fromY + (handle.tween.toY - handle.tween.fromY) * ease
          handle.wrapper.position.x = x
          handle.wrapper.position.z = z
          handle.wrapper.position.y = y
          publishUnitMove(handle, x, z)
          if (handle.ring) {
            handle.ring.position.x = x
            handle.ring.position.z = z
            handle.ring.position.y =
              handle.tween.fromRingY + (handle.tween.toRingY - handle.tween.fromRingY) * ease
          }
          if (handle.crown) {
            handle.crown.position.x = x
            handle.crown.position.z = z
          }
          if (k >= 1) {
            const facing = handle.tween.pendingFacing
            const toX = handle.tween.toX
            const toZ = handle.tween.toZ
            handle.tween = null
            clearUnitMove(handle)
            handle.axie.setMoveSpeed(0, 0.25)
            handle.axie.setLocomotion('idle', 0.25)
            if (facing) applyFacing(handle, facing, toX, toZ)
          }
        }
        // Flash de dano/curacion: fade-out del sprite (material compartido no
        // toca la paleta del axie).
        if (handle.flashSprite && handle.flashSprite.visible) {
          const remain = handle.flashUntil - elapsedTime
          if (remain <= 0) {
            handle.flashSprite.visible = false
            handle.flashSprite.material.opacity = 0
          } else {
            handle.flashSprite.material.opacity = Math.min(1, remain / 0.45)
          }
        }
      }
      if (camAnimated) publishTransform(viewW, viewH)
      renderOnce()
      frameId = requestAnimationFrame(loop)
    }
    loop()

    // Hook de debug minimo: expone la superficie real de cada casilla y las
    // posiciones mundo de las unidad/hess para
    // comprobar que al asentarse sobre terreno (tierra/roca/agua) el Axie queda
    // por ENCIMA de la tapa de la decoracion, no tapado por ella.
    window.__boardDebug = {
      rows,
      cols,
      baseHeight,
      topAt,
      handles: () => {
        const out = {}
        for (const [id, h] of handles) {
          out[id] = {
            r: h.cellR,
            c: h.cellC,
            y: h.wrapper.position.y,
            topY: h.cellR != null && h.cellC != null ? topAt(h.cellR, h.cellC) : null,
          }
        }
        return out
      },
    }

    return () => {
      disposed = true
      if (syncRef.current === syncUnits) syncRef.current = null
      if (syncFxRef.current === dispatchFx) syncFxRef.current = null
      ro.disconnect()
      host.removeEventListener('pointerdown', onPointerDown)
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerup', onPointerUp)
      host.removeEventListener('pointercancel', onPointerUp)
      host.removeEventListener('wheel', onWheel)
      host.removeEventListener('click', onCaptureClick, true)
      window.removeEventListener('keydown', onKeyDown)
      if (frameId) cancelAnimationFrame(frameId)
      if (shadow) {
        boardGroup.remove(shadow)
        shadow.material.map?.dispose()
        disposeObject3D(shadow)
      }
      if (backdrop) {
        boardGroup.remove(backdrop)
        backdrop.material.map?.dispose()
        disposeObject3D(backdrop)
      }
      // Cubos del muro de montañas: clones compartidos de los templates, solo
      // se desmontan (la geometria es la misma que la de los bloques del tablero).
      for (const c of wallMeshes) boardGroup.remove(c)
      wallMeshes = []
      for (const { obj, shared } of surroundingsPlaced) {
        boardGroup.remove(obj)
        if (!shared) disposeObject3D(obj)
      }
      surroundingsPlaced = []
      for (const { obj, shared } of worldPlaced) {
        boardGroup.remove(obj)
        if (!shared) disposeObject3D(obj)
      }
      worldPlaced = []
      // Geometrias instanciadas del campo de llanuras: se montan aqui y NO se
      // comparten con los templates (los materiales siguen vivos en ellos),
      // asi que solo se hace dispose de la geometria fusionada, nunca del resto.
      for (const g of heapGeos) g.dispose()
      heapGeos = []
      pathGates = []
      pathPoints = []
      pathMaterial.dispose()
      for (const handle of handles.values()) {
        islandGroup.remove(handle.wrapper)
        if (handle.crown) islandGroup.remove(handle.crown)
        if (handle.ring) islandGroup.remove(handle.ring)
        handle.axie.dispose()
      }
      handles.clear()
      // crownTemplate es la copia "maestra" -sus geometrias/materiales son
      // los que comparten todos los clones, asi que solo se hace dispose aqui,
      // una vez, nunca por clon (ver comentario en la limpieza de syncUnits).
      if (crownTemplate) disposeObject3D(crownTemplate)
      // Materiales brillantes del board: clones creados para el resaltado, no
      // compartidos con ningun template -se desmontan con la escena.
      for (const m of brightBoardMaterials) m.dispose()
      brightBoardMaterials.length = 0
      for (const m of colosseumMaterials) m.dispose()
      colosseumMaterials.length = 0
      ringGeometry.dispose()
      ringMaterials.player.dispose()
      ringMaterials.enemy.dispose()
      // El mixer NO se hace dispose aqui: es compartido con los retratos de las
      // cartas (axieMixer3D.js) y vive lo que la pagina.
      renderer.dispose()
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, cols, blockUrl, cellSizePx, terrainBlockUrls, decorUrls])

  // Efecto de sincronizacion de unidades: NUNCA tira toda la escena, solo
  // dispara la funcion de sincronizacion del tablero VIVO actual (syncRef,
  // ver comentario de cabecera) -asi App.jsx puede volver a renderizar (por
  // cualquier motivo: seleccion, turno, animacion) sin que el tablero 3D
  // parpadee o se reconstruya.
  useEffect(() => {
    if (syncRef.current) syncRef.current()
  }, [axieUnits])

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />
}
