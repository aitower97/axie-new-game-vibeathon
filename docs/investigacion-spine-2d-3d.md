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