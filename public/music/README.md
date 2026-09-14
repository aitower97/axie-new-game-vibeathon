# Musica de Vínculo de Lunacia

Todas las pistas ambientales son de **Kevin MacLeod** (https://incompetech.com/),
con licencia **Creative Commons Attribution 4.0 International (CC-BY 4.0)**
https://creativecommons.org/licenses/by/4.0/

Efectos de audio adicionales provienen de los packs CC0 de **Kenney**
(https://kenney.nl/), sin atribucion requerida.

## Pistas (estado del juego -> pista)

| Estado | Fichero | Titulo original (Kevin MacLeod) |
|---|---|---|
| Hub / pantallas meta | `hub.mp3` | Enchanted Journey |
| Partida PVE | `pve.mp3` | Impact Alegretto |
| Arena PVP | `pvp.mp3` | Heroic Age |
| Prórroga PVP (muerte súbita) | `pvp.mp3` a 1.35x | Heroic Age (remuestreada) |
| Victoria | `victory.mp3` | Carefree |
| Derrota | `defeat.mp3` | Bittersweet |

## Atribucion

```
"Enchanted Journey", "Impact Alegretto", "Heroic Age", "Carefree" y "Bittersweet"
por Kevin MacLeod (incompetech.com)
Licencia: CC-BY 4.0 - https://creativecommons.org/licenses/by/4.0/
Musica obtenida de https://incompetech.com/music/royalty-free/
```

Las pistas fueron re-encodeadas a 112 kbps para reducir el peso de la build.
Todas son bucles (`loop = true`) elegidos por estado del juego (ver `src/music.js`).