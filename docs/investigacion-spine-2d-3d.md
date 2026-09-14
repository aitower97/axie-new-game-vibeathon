# Investigacion: Spine 2D -> 3D y el nuevo port Godot del mixer

## Documento de investigacion · rama `investigacion/spine-2d-a-3d` · 13 sep 2026

**Objeto:** estudiar el recurso nuevo para el render 3D
[`jaatster/godot-axie-mixer-3d`](https://github.com/jaatster/godot-axie-mixer-3d),
entender que aporta respecto a lo que ya usamos en el repo (el paquete Three.js
vendido en `vendor/` + el pack local), y decidir si tiene valor para el proyecto
web (`React + Vite + Three.js`).

---

## 1. Que es el recurso nuevo

- **Port a Godot 4.7 (Forward+)** del `Axie Mixer 3D` oficial de Sky Mavis
  (`com.skymavis.axiemixer3d` 1.1.0 + el paquete opcional `weaponanims`).
- Mismo autor (jaatster) que el paquete Three.js que ya tenemos vendido
  (`vendor/jaatster-threejs-axie-mixer3d-public`).
- **No es un release oficial de Sky Mavis**: es un port del paquete Unity
  upstream (`axieinfinity/unity-axie-mixer3d`); el codigo, el pack de assets y
  los oraculos derivan de el y se distribuyen bajo la **misma licencia** (el
  `LICENSE.md` es el del paquete upstream, verbatim). Su uso "requires an
  agreement with Sky Mavis, exactly as for the Unity package" — el mismo marco
  que nuestro RIGHTS.md del vendor.
- **Novedad frente a nuestro paquete: verificacion por oraculos contra la salida
  de Unity**, todo commiteado en `tests/` (no hace falta Unity para ejecutar):
  - `oracle_compare.gd`: TRS del mundo, bounds de renderers y vertices skinned
    de 30 fixtures (8 cuerpos × combine on/off, 6 clases, mystic, fallbacks,
    10 IDs reales) en reposo y en Idle/Walk/Run/AttackCombo — **1615 checks**.
  - `playable_oracle_compare.gd`: el `AxiePlayable` real de Unity conducido
    frame a frame por 10 escenarios (one-shots, crossfades, colas, blends 1D
    con phase-lock, pausa/time scale, interrupción, seek, `complete()`) —
    **552 checks**.
  - `render_compare.sh`: los mismos fixtures renderizados a 8 yaws + 3 poses
    contra renders de Unity con la misma camara/light — **error medio <= 0.02
    por imagen** (todos <= 0.007, mystic <= 0.003).
  - `run_tests.gd`: gene codec, fallback de partes, pesos de blend, todos los
    clips `AnimNames`/`WeaponAnimNames` en cada cuerpo, outline, avatar,
    weapon attach, integridad de catalogo — "ALL TESTS PASSED".

## 2. Arquitectura del port (como esta organizado)

```
Unity package ──AxieGltfExporter.cs──► addons/axie_mixer_3d_assets/   pack glTF formato 2
                                     ├─► tests/oracle/                 oraculo numerico
                                     └─► tests/render_oracle/          oraculo de pixeles
Godot addon ──AxieCatalog -> AxieFactory -> AxieMeshCombiner -> AxiePlayable -> AxieCharacter3D
```

- **Pack de assets glTF "formato 2"** en `addons/axie_mixer_3d_assets/` (~250 MB):
  - `catalog.json`: `format_version: 2`, `package_version: "1.1.0"`,
    `animation_fps: 120`, cuerpos ordenados como `AxieBodyType` (Normal, Spiky,
    Fuzzy, Curly, Sumo, Wetdog, Bigyak, Frosty), partes con sus rigs, addons
    (mystic glow), y la tabla de colores con `primary1`/`primary2` hex sRGB +
    `color_value` (nibble de gen) + `index` (color_variant del descriptor).
  - `bodies/<Body>.glb`: skeleton, malla skinned del cuerpo y todos los clips
    del cuerpo como animaciones glTF.
  - `parts/<Part>_<Rig>.glb`: una prefab de rig de parte con su cadena de
    joints (`*_Offsets`, `*_Scale`, `*_JNT`), skin con inverse bind matrices,
    y malla skinned.
  - `materials/<id>.json`: propiedades serializadas de cada material Unity.
  - `textures/<id>.png` + `textures.json`: la textura tal como Unity la
    muestrea (tamaño importado, texels comprimidos decodificados).
  - `weapon_anims/<Body>.glb`: solo animaciones (clips de armas).
- **Coordenadas**: Unity left-handed Y-up -> glTF right-handed Y-up. El
  exportador hace un solo espejo en X una vez (`(x,y,z) -> (-x,y,z)`,
  cuaterniones `(x,y,z,w) -> (x,-y,-z,w)`); el runtime no convierte nada. Front
  = +Z. Un yaw de Unity θ sobre Y es `rotation.y = -θ` en Godot.
- **Solo carga en runtime**: `AxieCatalog` parsea los glbs con `GLTFDocument` y
  los PNG con `Image.load_from_file`; el directorio lleva `.gdignore` para que
  el importer del editor nunca meta sus track optimisations entre medias.
- **Animacion**: los clips se hornean con Mecanim a **120 samples/s**
  (4 × el arte de 30 fps) porque el importer de Godot rebakea a 30 fps; el
  `AxiePlayable` refleja el `PlayableGraph` de Unity frame a frame (loop wrap,
  completado, blends 1D con phase-lock Idle 0 / Walk 1 / Run 3.5).
- **Combine**: `AxieMeshCombiner` une los binds de todos los skinned renderers
  en un solo Skin, remapea `ARRAY_BONES`, invierte winding/`tangent.w` donde la
  base del renderer tiene determinante negativo. Combine on/off son
  pixel-identical (mismo resultado que el combiner de Unity).
- **Materiales y espacio de color**: el proyecto de referencia de Unity es
  **Gamma**. `s_axie_mixer_v5.gdshader` muestrea texturas como bytes sRGB
  crudos, convierte uniforms `source_color` de vuelta a sRGB, hace la cuenta en
  ese espacio y convierte una vez a linear en la salida. Colores HDR
  (`_RimColor`, `_Color0`, `_Top`, `_Mid`, `_Color3`, `_Color_UV2`) son vec4
  lineales.
- **Outline**: dos modos igual que Unity — hermanas `AxieOutlineHull`
  (`cull_front`, misma mesh/skin/skeleton) y `AxieOutlinePostProcess` (un
  `CompositorEffect` con los uniforms Sobel de Unity).
- **Mystic**: `mystic_final.gdshader` (opaque + clip con `uv2.r`, gold mask) +
  VFX de particulas de los prefabs del addon convertidos a `GPUParticles3D`
  (fuera del gate de pixeles, se comparan a ojo).

## 3. Comparacion con lo que ya tenemos

| | **Port Godot (nuevo)** | **Paquete Three.js vendido** |
|---|---|---|
| Autor | jaatster | jaatster |
| Linaje | port de `com.skymavis.axiemixer3d` 1.1.0 | port del mismo mixer upstream |
| Pack | `catalog.json` formato 2, **re-exportado con Unity 6000.0** | `manifest.json` schemaVersion 2, **unityVersion 2021.3.45f2**, commit `public-content-v1` |
| Carga | solo runtime (`.gdignore`) | `createAxieMixer3D({ assetBaseUrl: '/assets/axie/' })` (nuestra `axieMixer3D.js`) |
| Coordenadas | espejo X en el exportador, front +Z | `coordinateSystem: { forwardAxis: -Z }` |
| Verificacion | **Oraculos commiteados** (1615+552 checks, pixeles <=0.007) | README: "Exact visual parity still depends on the target renderer, lighting, color space" — **sin oraculos** |
| Runtime | Godot (GDScript) | Three.js (JS) |
| Licencia | `LICENSE.md` = licencia del paquete Unity upstream verbatim | `RIGHTS.md` = limited-use for Axie Vibeathon / programas aprobados por Sky Mavis |

**Hallazgo clave:** aunque comparten autor y linaje, los dos packs son **exports
distintos** de la misma fuente Unity. El de Godot se reexportó con la toolchain
nueva (Unity 6000 + paquete 1.1.0) y trae su catalogo/documentacion como
especificacion publica del formato (importante: hoy el pack que servimos desde
`/assets/axie/` no tiene doc equivalente en el repo). El nombre de las partes
($S00_Aquatic02_L1_Back$...) coincide, asi que no hay descubrimiento de naming;
las diferencias estan en la precision visual y la verificacion.

## 4. Relevancia para Vínculo de Lunacia (web)

**Veredicto preliminar: recurso de REFERENCIA, no integrable tal cual.**

1. **No es integrable en nuestra traza**: nuestro juego es React + Vite +
   Three.js en navegador. El port es Godot (GDScript); meterlo exigiria reescribir
   el render 3D en Godot (con su export Web, no lo que tenemos hoy con
   `Board3D.jsx`/`Portrait3D.jsx` + `sharedRenderer3D.js`). No aporta a la
   decision spine-2D->3D porque **esa decision ya esta tomada** (en el repo el
   puente 2D `axieMixer.js`/`AxieSprite.jsx` esta sin uso desde la sesion en que
   las cartas pasaron a `Portrait3D.jsx` con el mixer 3D compartido).
2. **Si aporta como especificacion publica del formato del pack**: es el unico
   documento publico que explica el esquema completo de `catalog.json`/glb
   (materiales, coordenadas, bake de clips a 120 samples/s, tabla de colores,
   fallback de partes S{skin}L{level} -> S{skin}L1 -> S00L{level} -> S00L1). Sirve
   para depurar nuestro propio pack local y para cuando queramos re-exportar o
   regenerar contenido.
3. **Su metodologia de oraculos es el estandar deseable**: nuestro render 3D no
   tiene verificacion de paridad contra Unity. Si algun dia la queremos
   (p. ej. para arreglar colores del mixer que hoy verificamos por screenshot/
   lectura de píxeles del canvas), el esquema numeric/playable/render del port
   Godot es la plantilla a seguir.
4. **Refuerza la lectura legal**: confirma que el pack de Sky Mavis se usa bajo
   acuerdo con Sky Mavis y para programas aprobados (Vibeathon cuenta). Ya lo
   reflejabamos en RIGHTS.md; el nuevo repo no cambia ese marco.

**Puntos que quedarian como futura investigacion (no iniciada aqui):**
- Portar la lectura del esquema de Godot (o los bodies `bodies/*.glb` con clips
  bakeados a 120 fps) para sanear nuestro actor 3D: hoy nuestras animaciones
  salen del paquete vendido y no conocemos su frame rate de bake ni si usa la
  misma convencion de +Z/-Z.
- Evaluar si el `AxiePlayable` con phase-lock 1D (Idle/Walk/Run) merece la pena
  para el movimiento de unidades en el tablero (hoy usan clips sueltos).
- Confirmar si el pack de Godot (nuevo, Unity 6000) tiene alguna parte/color que
  al actual le falte, mirando `colors[]` y `addons[]` contra nuestro manifest.

## 5. Que se ha hecho en esta rama

- Clonado de referencia en temp (fuera del repo, no se commitea el recurso
  entero): `C:\Users\PC\AppData\Local\Temp\opencode\godot-axie-mixer-3d`.
- Este documento (`docs/investigacion-spine-2d-3d.md`).
- No se toca codigo del juego: solo investigacion y documentacion.

## 6. Visor spine 2D (sesion 2026-09-13)

El usuario pidio poder ver visualmente los recursos spine 2D antes de decidir el
camino a 3D. Se construyo un visor standalone (`spine2d-viewer.html` +
`src/spine2d-viewer-main.jsx`, mismo patron que `board3d-test.html`) que carga
dos fuentes servidas desde `public/`:

- **Starters** (`public/assets/starters-2d/<id>/`): los 12 starters PvE del
  toolkit 2D de Origins, formato Spine 3.8 **JSON** (`<id>.json` +
  `<id>.atlas` + `<id>.png`). Identificados por hash de skeleton: `1` = Buba
  (Beast), `12` = Momo (Bird), `3` = Puffy (Aquatic).
- **Chimeras** (`public/assets/chimeras-2d/<name>/`): los enemigos PvE de
  Origins, formato Spine 3.8 **binario** (`.skel` + `.atlas` + `.png`). Por
  ahora solo `aqua-alpha-wolf` (el pedido por el usuario; el resto del kit
  sigue en el clon de temp).

**Como carga cada formato** (la diferencia importa para el port Godot):

- Starters: `fetch(<id>.json)` → `SkeletonJson(loader).readSkeletonData(raw)`.
- Chimeras: `fetch(<id>.skel).arrayBuffer()` →
  `SkeletonBinary(loader).readSkeletonData(new Uint8Array(raw))` — y aqui hubo
  un bug real: `SkeletonBinary` de `@pixi-spine/runtime-3.8` construye
  `new DataView(data.buffer)`, asi que UN ArrayBuffer directo no vale (no tiene
  `.buffer`): hay que pasarlo envuelto en `Uint8Array` o lanza
  "First argument to DataView constructor must be an ArrayBuffer".
- El atlas se monta con `new TextureAtlas(atlasText, loader, callback)` de
  `pixi-spine` + `AtlasAttachmentLoader`; los `.atlas` del kit usan regiones
  con rotacion/offsets, el parser de spine las respeta.

**Bug real encontrado y arreglado en la integracion (no solo del visor, del
patron):** el reset de la seleccion al cambiar de pestaña vivia en un
`useEffect` que corria DESPUES del commit; durante el render intermedio el
preview principal usaba el `selected` del tab anterior con el `kind` nuevo —
pedia `/assets/chimeras-2d/1/1.atlas` (no existe; Vite responde el
`index.html` del SPA) y el parser del atlas leia `<!doctype html>` como nombre
de pagina ("Atlas page load failed <!doctype html>"). El fix: el reset vive en
el `onClick` del tab (`selectTab(k)`), en el mismo batch que el `setTab`, asi
no existe ningun render con combinacion (`tab`, `selected`) invalida.

**Verificado en vivo** (CDP 9333, WebSocket directo): 12 thumbs de starters +
preview grande con 41 animaciones; pestaña Chimeras carga el `.skel` binario
(11 animaciones, `action/idle/normal` activa; cambio a `defense/hit-die`
reproducido sin error); captura `016-visor-spine-chimera.png`. `npm run build`
+ `npm run lint` limpios, cero errores de consola.

**Siguiente paso natural (no iniciado aqui):** el flujo que pedia el usuario de
skeleton 2D → representacion 3D. El chimera 2D se ve reconociendo el skeleton
de `aqua-alpha-wolf`; el acabado 3D real seguiria viviendo en el port Godot del
mixer 3D (seccion 4), no en el origins-kit (que es 2D puro). El visor queda
como la pieza que le pone ojos a la decision.

## 7. Conversor slime 2D -> 3D con volumen real (sesion 2026-09-13)

Para validar el flujo "skeleton 2D → representacion 3D" antes de decidir el
camino a Godot, se prototipo en el navegador con el propio runtime spine +
Three.js (ambos ya estan en el repo; Godot no esta instalado). El usuario eligio
**volumen real** (no quads 2.5D): el cuerpo extruido como malla 3D con la
silueta real del PNG, ojos como esferas, boca en profundidad.

**Eleccion de criatura:** el `slime` base (el mas simple del kit, 15 huesos,
3 piezas visuales; hay 7 slimes en el kit). Copiado a
`public/assets/chimeras-2d/slime/` (`slime.skel` 17 KB binario, `slime.atlas`,
`slime.png`) y anadido al visor 2D para inspeccionarlo mientras se validaba.

**Como funciona** (`spine-slime-3d.html` + `src/spine-slime3d-main.jsx`):

- El runtime spine evalua el skeleton 2D como siempre; cada frame se copian las
  **coordenadas mundiales** del hueso (`bone.worldX/worldY` +
  `getWorldRotationX()` + `getWorldScaleX/Y()`) a nodos `Object3D` de three. Se
  usa el plano XY del spine como plano de tres y la profundidad sale del propio
  modelo (Z), no de los huesos. Los nodos van en coordenadas MUNDIALES porque el
  runtime ya aplica la herencia padre→hijo: montarlos en jerarquia propia no da
  doble aplicacion.
- El cuerpo se construye **trazando la silueta real**: `traceOutline` (vecinos
  de Moore sobre el alpha del PNG) + `simplifyRing` (Douglas-Peucker) +
  `ExtrudeGeometry` con bevel redondeado; el color es el medio de los pixeles de
  dentro. Ojos = esferas blancas + pupilas (por los centros oscuros de la region
  eyes); boca = esfera oscura adelantada en Z; sombra = disco plano.
- Para no depender de texturas del atlas, se usa un `DummyAttachmentLoader` que
  devuelve attachment sin textura (no hace falta tocar el runtime).

**Bugs reales encontrados y arreglados al integrarlo:**

1. `bone.worldRotation` / `worldScaleX` / `worldSignX` NO existen en el runtime
   3.8 de `@pixi-spine` — la transformacion mundial vive en `bone.matrix`
   (`{a,b,c,d,tx,ty}`) y se lee con metodos: `getWorldRotationX()`,
   `getWorldScaleX()`, `getWorldScaleY()`. Usar los getters de la API 4.x lanza
   "Cannot read properties of undefined".
2. `DummyAttachmentLoader` necesita que `attachment.color` sea un objeto
   `{r,g,b,a}` no nulo: `SkeletonBinary` escribe el RGBA en ese campo.
3. `boneNodes` declarado dentro de `boot()` pero usado en `loop()` →
   `ReferenceError: boneNodes is not defined` en masa (1153 excepciones). Fix:
   subirlo al scope del efecto.

**Verificado en vivo** (CDP 9333, WebSocket directo): recarga limpia con 0
errores de consola; la escena pinta contenido real — lectura de píxeles del
framebuffer con `readPixels` tras un render manual dio 13.357 muestras no-cero
en el bbox (260,0)-(1108,336) — con la pose viva del skeleton (@body en
(0,-133), @eyes en (-57,-167), 15 huesos) y las animaciones del select
cambiando la pose en vivo. Captura `017-slime-3d.png`. `npm run build` +
`npm run lint` limpios (warnings preexistentes, 0 errores).

**Si el resultado convence al usuario:** el mismo patron (pose mundial por frame
+ geometria extruida por silueta) se puede repetir para el resto de criaturas 2D
del kit; el camino a Godot (seccion 4) quedaria como port de la geometria, no
del runtime.

## 8. Pipeline real Spine2D -> GLB con Blender (sesion 2026-09-14)

El usuario dejo el mismo slime (`.skel`+`.atlas`+`.png`) en una carpeta `prueba/`
nueva y pidio explicitamente seguir el proceso del subagente `spine-to-3d.md`
(Blender headless, planos texturizados 2.5D con profundidad), en vez de seguir
extendiendo el prototipo de la seccion 7 (extrusion de silueta en el navegador,
que ya tenia su propio boton de exportar GLB via `GLTFExporter` de Three.js —
opcion descartada por el usuario a proposito).

**Blender SI esta instalado** (`C:\Program Files\Blender Foundation\Blender 5.2`,
5.2.1 LTS, no estaba en el PATH de la shell) — el prerrequisito que el propio
`spine-to-3d.md` pide confirmar antes de empezar.

**El paso 1 del proceso ("Spine Editor para pasar de .skel a .json") se saltó
sin Spine Editor**: este repo ya tiene un parser de `.skel` binario verificado
(`@pixi-spine/runtime-3.8`, usado en el visor 2D y en el prototipo de la seccion
7) y ese runtime **funciona igual en Node puro** (sin DOM/canvas, confirmado con
`require()` liso). `tools/spine-to-3d/dump_skeleton.cjs` (nuevo, committeado)
parsea `<id>.skel` con el mismo `DummyAttachmentLoader` ya probado + un parser de
texto propio para `<id>.atlas` (formato estandar de Spine), y vuelca huesos
(jerarquia + transform local), slots (orden de dibujo real) y los attachments
del skin default a un JSON intermedio — sin depender de licencia de Spine Editor
en ningun paso.

**El paso 2 (desempacar el atlas en PNGs sueltos) tampoco hizo falta**: en vez de
recortar imagenes, `tools/spine-to-3d/import_to_blender.py` mapea cada plano a
la region del atlas via **coordenadas UV** sobre la MISMA textura compartida
(`slime.png`) — Blender no necesita el PNG desempaquetado para esto. Reutiliza
el mismo hallazgo ya verificado en la seccion 7 (`rotate: true` del atlas NO
exige traspasar el rect al leerlo).

**Decision de diseño en el importador**: en vez de un `Armature` real de
Blender (paso 3 del documento), la jerarquia de huesos se construye con
**Empties** (`PLAIN_AXES`), parentados entre si replicando `bone.parent` uno a
uno. Motivo: el objetivo de esta pasada es la pose de reposo (setup pose, sin
animacion — el propio `spine-to-3d.md` dice que preguntar si hace falta
animacion, aqui no se pidio), y construir edit-bones de un `Armature` exige
calcular el "roll" a partir de un angulo de rotacion arbitrario en un plano que
no es nativo de Blender (el plano de pantalla del spine se mapea al plano XZ,
no al XY con el que Blender calcula roll de forma directa); los Empties
consiguen la misma jerarquia/transform local sin ese calculo, a costa de no ser
un Armature "real" (deuda si mas adelante se quiere animacion horneada — para
eso conviene retomar el camino ya funcional de la seccion 7, que si hornea
clips completos).

**Mapeo de ejes**: plano de pantalla del spine (X derecha, Y arriba) -> plano
XZ de Blender; la profundidad (fuera de pantalla en spine) va en el eje Y de
Blender. Cada plano de slot lleva un modificador **Solidify** (grosor
proporcional a su lado menor) y un offset de profundidad por **orden de dibujo
real** del skeleton (los slots que Spine pinta encima en 2D quedan mas cerca de
la camara frontal en 3D) — el paso 4 del documento ("extruye cada plano...
ordenalos en Z segun la capa") aplicado literal. La exportacion
(`bpy.ops.export_scene.gltf` con `export_apply=True`) aplica el Solidify antes
de escribir el GLB, asi que la geometria final ya tiene volumen real, no un
modifier pendiente.

**Solo los slots visibles en la pose de reposo generan geometria**: de los 12
slots del slime, 4 tienen `attachmentName` no nulo en el setup pose (shadow,
body, eyes, mouth) — los mismos 4 que el prototipo de la seccion 7 ya habia
identificado a mano; las 7 `part-N` (variantes cosmeticas, activadas solo por
animacion) y `eyes-shut` quedan fuera, correcto.

**Bugs reales encontrados y resueltos en esta pasada:**
1. Ejecutar `dump_skeleton.cjs` desde fuera del repo (ruta de scratchpad)
   rompia la resolucion de `@pixi-spine/runtime-3.8` (`Cannot find module`) —
   Node resuelve modulos subiendo desde la ubicacion del propio script, no del
   cwd. Se resolvio moviendo el script DENTRO del repo
   (`tools/spine-to-3d/`), donde la subida normal encuentra `node_modules`
   sin variables de entorno.
2. El repo tiene `"type": "module"` en `package.json` — un `.js` en
   `tools/spine-to-3d/` se interpretaba como ES module y `require()` fallaba
   ("require is not defined in ES module scope"). Renombrado a `.cjs`
   (`dump_skeleton.cjs`), documentado en su propia cabecera para no repetir
   el bug.
3. `bpy.data.images.load()` con una ruta RELATIVA (`"prueba"`) fallaba
   ("No such file or directory") pese a que el shell estaba en la carpeta
   correcta — Blender resuelve relativos contra su propio cwd interno, no el
   del proceso que lo lanzo. Se paso la carpeta de assets siempre en
   ABSOLUTO.
4. `scene.render.engine = 'BLENDER_EEVEE_NEXT'` (nombre de motor de versiones
   mas nuevas de Blender) no existe en esta 5.2.1 LTS instalada
   (`enum "BLENDER_EEVEE_NEXT" not found`) — el enum real en esta version es
   `'BLENDER_EEVEE'`. Solo afecto al script de verificacion por render, no al
   exportador.

**Verificacion (sin Spine Editor, sin poder "ver" imagenes directamente):**
- Estructura del GLB inspeccionada leyendo el chunk JSON del binario a mano:
  19 nodos, 4 mallas, 1 material — la jerarquia de nodos reproduce EXACTA la
  del skeleton (`@root -> @pivot-main -> @body -> @eyes/@mouth`,
  `@root -> [back]shadow -> slot_shadow`, `@root -> @root2 -> part-1..7`
  sin geometria, como se esperaba). Traslaciones de los nodos de hueso
  contrastadas a mano contra el JSON intermedio (ej. `@body` bone y=150 en
  spine -> `T=(0, 0.75, 0)` en el nodo glTF con `SCALE=0.005`, correcto tras
  la conversion Blender Z-up -> glTF Y-up del propio exportador). Bounding
  box de `slot_body` en espacio local: ~2.15 unidades de alto x ~0.475 de
  profundidad tras el Solidify — volumen real, no un plano.
- Render de comprobacion (`tools/.../render_check` temporal, no committeado):
  import del GLB en una escena limpia, camara ortografica frontal + sol,
  render 512x512 en EEVEE, y lectura de pixeles del PNG resultante desde el
  propio Blender (`Image.pixels`) para confirmar contenido real sin depender
  de "ver" la imagen — el pixel central del render difiere claramente del
  color de fondo (fondo ~(0.25, 0.29, 0.27) tras la curva de color del motor,
  centro ~(0.36, 0.41, 0.02): tono verde-amarillento bajo en azul, coherente
  con el cuerpo de un slime). GLB + render entregados al usuario via
  `SendUserFile` para inspeccion visual real (el modelo de esta sesion no lee
  imagenes).

**Que queda commiteado vs que no**: `tools/spine-to-3d/dump_skeleton.cjs` +
`import_to_blender.py` son reutilizables para el resto de criaturas del kit
(genericos, no hardcodean "slime" en ningun sitio salvo el `id` que se lee del
propio nombre del `.skel`). El `slime.glb` resultante y el render de
verificacion NO se commitearon (son un artefacto derivado de un experimento
puntual, no un asset del juego) — se entregaron directamente al usuario.
`prueba/` (input del usuario) se deja tal cual, sin mover ni borrar.

## 9. Conclusiones de la rama (cierre 2026-09-14)

Esta rama era de investigacion; al cerrarla se quedan dos conclusiones firmes y
una limpieza, todo commiteado aqui:

### 9.1 El 3D de chimeras NO hace falta ahora mismo

Tras las secciones 6-8 (visor 2D de starters/chimeras, prototipo de slime 2D a
3D en el navegador y pipeline completo Spine2D -> GLB con Blender) la decision
se consolida en contra de un pipeline 3D de chimeras para esta etapa:

- **El PvE del juego usa los starters oficiales** (Buba/Momo/Puffy) reconstruidos
  con las partes 3D reales del pack (`axieGeneCatalog.js`, `STARTER_INFO`/
  `starterDescriptor`), NO las criaturas chimeras. No hay hueco de gameplay que
  exija chimera alguno en el MVP1 ni en Ronda 1.
- El experimento del slime (2D -> 3D por silueta extruida y por plano+Solidify)
  **valido el flujo**, pero su resultado es un artefacto de demostracion, no un
  recurso del juego: el render de criaturas en el tablero ya esta resuelto con el
  **mixer 3D de partes** (el camino 2D quedo sin uso desde la sesion en que las
  cartas pasaron a `Portrait3D.jsx`). Meter chimeras 3D hoy seria construir un
  pipeline paralelo para una clase de enemigo que el diseño no pide.
- **Si algun dia se quiere** (p. ej. una mazmorra con enemigos caoticos), el
  atajo es el port Godot del mixer 3D (seccion 4) como referencia de geometria, o
  retomar el patron de la seccion 7 (pose mundial por frame + geometria por
  silueta) — que es el unico que hornea clips completos sin Blender.

### 9.2 Nuevos recursos oficiales de Axie integrados

Durante esta rama se integraron recursos del kit oficial del Vibeathon que
quedan funcionando en el juego (no solo investigados):

- **Axie Origins Battle Kit — VFX de combate** (`public/vfx/`, 7 skills + 2
  buffs grabados del juego real como atlases additive): reproduccion de los
  clips de habilidad de la clase del golpeador sobre el overlay del tablero en
  cada impacto (`originsVfx.js` + `BoardRegion.jsx`, sesion 2026-09-14).
- El **pack 3D completo** (8 bodies, 420 partes, animaciones, addons, slot-icons
  con su `content-integrity.json`) ya estaba integrado como base del render; con
  la sesion de hoy queda registrado recurso a recurso, con estado y punto de
  codigo, en **`docs/recursos-vibeathon.md`** (inventario verificado en disco,
  incluidos los paquetes CC0 de Kenney que cubren lo que el kit no tiene).

No se integra (documentado en `recursos-vibeathon.md`) el mixer npm
`@axieinfinity/mixer` 2D (puente sin uso desde la sesion 3D, referencia) y el
kit VFX deja dos clips `shield`/`summon_on_cast` precargados pero sin disparo
hasta que un impacto del dado del Lord lleve esos efectos.

### 9.3 Limpieza: se borra todo el material 2D->3D que no sirve

Con las conclusiones firmadas, se elimina el material generado para estos
experimentos que ya no aporta (no se pierde ninguna conclusion: todo queda
documentado en este archivo):

- Visores y demos: `spine2d-viewer.html` + `src/spine2d-viewer-main.jsx`,
  `spine-slime-2d.html` + `src/spine-slime-2d-main.jsx`,
  `spine-slime-3d.html` + `src/spine-slime3d-main.jsx`.
- Artifactos del slime: `slime-2d.png`, `slime-2d-white.png`, `prueba/`,
  `tools/spine-to-3d/`.
- Copias de toolkit 2D que solo servian al visor: `public/assets/starters-2d/`
  y `public/assets/chimeras-2d/` (los starters PvE se verifican igual desde el
  pack 3D; las chimeras no se usan, ver 9.1).

El juego (lo que corre en `npm run dev`/`build`) no las referenciaba: los demos
eran paginas standalone sin entrada en `index.html`.
