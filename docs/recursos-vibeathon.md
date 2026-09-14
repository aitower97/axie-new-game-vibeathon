# Auditoría de recursos oficiales del Vibeathon

> Inventario **verificado en disco** de los recursos del kit oficial del Axie
> Vibeathon presentes en este repo, su estado de integración y el punto de
> código que los consume. Este documento no pretende ser la lista oficial del
> kit (el pack de 20+ recursos lo entrega Sky Mavis); es el inventario que
> este repo puede acreditar, chequeado contra `public/` y `package.json` el
> 2026-09-14.

## Paquetes verificados en `public/assets/axie` (pack 3D oficial)

Fuente declarada en el propio `manifest.json`: `github.com/jaatster/threejs-axie-mixer3d-public`
(branch `public-content-v1`, exportado 2026-07-11). Integridad: `content-integrity.json`
(firma `manifestSha256`, `aggregateSha256`, 5.821 archivos, 521.569.032 bytes).

| Recuso | Qué hay | Estado | Consumido por |
|---|---|---|---|
| `bodies/` | 8 bodies (rigs de clase con esqueleto) | ✅ integrado | `src/axieMixer3D.js` (render unitario de tablero + cartas) |
| `parts/` | 420 partes 3D (horn/mouth/tail/back por clase) | ✅ integrado (solo las variantes usadas) | `src/axieMixer3D.js`, `src/partIcon3D.js` |
| `animations/` | 190 clips de animación por body + 6.683 por parte | ✅ integrado | `src/axieMixer3D.js` (idle/run, ataque) |
| `addons/` | 47 grupos de addon (globos/marcos/flash por parte) | ✅ integrado (LOD con aditivos) | `src/axieMixer3D.js` |
| `final-unity/standard-parts/` | Partes tal cual salieron de Unity (`S00_<Clase>02_L1_<Slot>.glb`) | ✅ integrado | `src/partIcon3D.js` (iconos de cara), `src/backdropSprite3D.js` |
| `slot-icons/` | Emblemas por ranura (back/ears/eyes/horn/mouth) | ✅ integrado | `src/slotIcons.js` (caras del dado de unidades) |
| `shaders/` | 12 shaders + 1 shader graph | ⏸ sin uso directo (los consume el mixer del pack) | `public/assets/axie/shaders/` |
| `provenance/` | Trazabilidad del export (librería Jaatster public) | ℹ️ referencia | consulta/investigación |
| `manifest.json` | Catálogo, color variants (por clase, index 0-12) y descriptors | ✅ integrado | `src/axieGeneCatalog.js` (`STARTER_INFO`, `ROSTER_PARTS`, `ROSTER_DESCRIPTORS`) |

## Kit VFX de Origins (Axie Origins Battle Kit)

`public/vfx/` — 9 clips grabados del juego oficial como atlases additive.
`index.json` registra 7 skills + 2 buffs, todos con frames/duration/atlas validados
(`"ok": true`) y su `mapsTo` (defender vs target).

| Id | Tipo | Estado | Uso |
|---|---|---|---|
| `aquatic_slash` | skill | ✅ integrado | golpe de clase Aqua (`SKILL_BY_CLASS`) |
| `beast_slash / bite / gore / smash` | skill | ✅ integrado | golpes de Beast (slash) y fallback de Bird/Lord |
| `bug_slash` | skill | ⏸ sin clase en el roster MVP1 | queda en el catálogo precargado |
| `plant_bite` | skill | ✅ integrado | golpe de clase Plant (referencia) |
| `shield` | buff | ✅ integrado (fuente lista) | cara Guardia/Muro del dado del Lord |
| `summon_on_cast` | buff | ✅ integrado (fuente lista) | caras Invocar/Duplicar del Lord |

Quién lo consume: `src/originsVfx.js` (catálogo + atlas additive + `playOnCanvas`,
2026-09-14) y `src/components/BoardRegion.jsx` (`spawnClipVfx`, overlay
`.vfx-canvas` transformado con el tablero). Verificado en vivo: un impacto real
reproduce el clip de su clase y auto-limpiar su canvas al terminar.

## Spines 2D (toolkit 2D de Sky Mavis)

| Recuso | Qué hay | Estado | Consumido por |
|---|---|---|---|
| `starters-2d/` | Spines de los starters (Buba/Momo/Puffy...) | ✅ integrado (nombres/verificación) | `axieGeneCatalog.js` + investigacion-spine-2d-3d.md |
| `chimeras-2d/` | Enemigos PvE clásicos (aqua-alpha-wolf, slime x7...) | ⚠️ NO usado en el juego | decisiones: el PvE usa starters reconstruidos; slime 2D usado solo en demostración de spines |
| `@axieinfinity/mixer` (npm 1.4.9) | Mixer 2D PixiJS/spine con genomas reales | ⏸ puente sin uso desde la sesión 3D | `src/axieMixer.js` y `src/AxieSprite.jsx` quedan como referencia |

## Paquetes CC0 (no oficiales, sustituyen donde el kit no cubre)

| Recuso | Por qué está | Consumido por |
|---|---|---|
| Kenney Platformer Kit (`public/models/*.glb`) | bloques de terreno del tablero 3D | `src/Board3D.jsx` |
| Kenney Mini Forest (`public/models/mini-forest/`) | props del fondo 2D de Lunacia | `src/backdropSprite3D.js`, `src/LunaciaBackdrop.jsx` |

## Notas

- El pack es de contenido público de la librería Jaatster (`threejs-axie-mixer3d-public`),
  con su propio `content-integrity.json` para auditar que no se mute ningún GLB.
- El MVIPA/Roster solo usa una fracción del pack (3 clases × variantes verificadas contra
  `manifest.json`); el resto queda local como referencia para Ronda 2.
- Los íconos de cara del dado (`partIcon3D.js`) se renderizan desde las partes Unity reales
  del pack, no de imágenes del marketplace.