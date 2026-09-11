# Vínculo de Lunacia — contexto del proyecto

> **Fase A de combate dinámico implementada (sesión 2026-09-10, trabajo en paralelo
> con opencode — ver `docs/combate-dinamico-dado.md` para el estudio y el porqué de
> cada pieza; no sustituye a `MVP1vinculodelunacia.md`, lo evoluciona por fases):**
> el combate ya no es "tira y golpea plano" — cinco piezas nuevas, todas en `App.jsx`:
> - **A1, triángulo de efectos**: Perforar > Guardar > Golpear > Perforar
>   (`EFFECT_FAMILY`/`TRIANGLE`/`relationGain`). Cola/Reposición quedan neutrales
>   a propósito (6.2.1). Con ventaja y daño real, el objetivo sufre **Rotura**
>   (`grantsBreak`): no contraataca este intercambio ni el siguiente golpe que
>   reciba (`unit.broken`, se limpia en su siguiente tirada). No modifica el daño,
>   solo niega la vuelta (6.2.2).
> - **A2, intercambio con contragolpe**: si el objetivo (una unidad, nunca el Lord)
>   sobrevive, tiene alcance y no está roto, contesta una vez con su propia cara
>   tirada (`computeCounterHit`/`applyCounterLocal`, wired dentro de
>   `applyUnitAttackLocal`). **`attack()` (jugador) se unificó para llamar a
>   `applyUnitAttackLocal` en vez de reimplementar el cálculo por su cuenta** —
>   la duplicación histórica attack()/computeUnitAttack (documentada en sesiones
>   anteriores) se resolvió de paso.
> - **A2.3, preview del intercambio**: `hoverCell` (estado de UI, no de partida) +
>   `exchangeInfo` (useMemo sobre `describeExchange`, la misma función que resuelve
>   el golpe real) se pintan en `ActionBar.jsx` (texto) y como chip flotante sobre
>   la casilla en `BoardRegion.jsx`. Implementado como **preview al pasar el
>   cursor + confirmación por el propio click** (no un modal de confirmar/cancelar
>   aparte) — decisión deliberada de esta sesión: el propio documento avisa de que
>   un intercambio con demasiada fricción de UI frena el ritmo (8.2).
> - **A3, banco de Energía**: toda cara sin golpe (guardia/reposición/utilidad) da
>   +1 a `energyBank` (tope `ENERGY_CAP=5`, se vacía al empezar el turno propio).
>   Gasta 2 Energía (`ENERGY_BOOST_COST`/`ENERGY_MOVE_COST`) en **+10 al próximo
>   golpe** (`boostArmed`, ya existente) o en **+1 casilla de movimiento**
>   (`moveBoostArmed`, añadido en esta sesión junto con el resto de A5 — ver abajo).
>   El "remate" (3 E, tratar una cara de guardia como golpe básico) se queda fuera,
>   documentado como TODO en `App.jsx` junto a `_ENERGY_FINISH_COST`.
> - **A5, terreno defensivo**: zona lenta da +10 de guardia real a quien recibe el
>   golpe ahí (`terrainGuardBonus`, ya existente); obstáculo bajo da +1 de alcance
>   a quien dispara desde una casilla pegada a él (`terrainRangeBonus`, añadido en
>   esta sesión) — aplicado en ataque, ataque básico, Impulso y contragolpe, una
>   sola fuente de verdad para los cuatro.
>
> Feedback visual nuevo (ya estaba hecho): `floats`/`pushFloats` (números flotantes
> de daño/cura/escudo/rotura sobre las celdas, `BoardRegion.jsx`), badge de Rotura
> y contador de Energía sobre la unidad seleccionada, y el turno del rival ahora se
> **reproduce paso a paso** (`runEnemyTurn` devuelve `steps`, `passTurn()` los
> reproduce uno a uno con pausa) en vez de aplicarse de golpe — la UI se congela
> (`enemyTurnRunning`) mientras dura. **Explícitamente fuera de esta fase** (no
> pedido, no tocado): A4 invocación con nivel y A6 reescritura de la IA (sección
> 6.7 del documento) — la IA sigue con sus 4 prioridades originales del MVP1.
>
> **Nota de sesión:** este trabajo se hizo en paralelo en otra sesión (opencode)
> mientras esta sesión (Claude Code) trabajaba en otras tareas del repo; se
> retomó y completó (A3 mover+1, A5 obstáculo) tras desconectarse el MCP de
> chrome-devtools — se paso a `claude-in-chrome` (otra extension de automatizacion
> de navegador) para no perder la verificacion en vivo. **Confirmado con clicks
> reales sobre `npm run dev`** (ademas de `npm run build` + `npm run lint`
> limpios): tirar dados acumula Energia con caras sin golpe (+1/+2 segun caras),
> el boton de "+1 casilla" se activa solo con Energia≥2, arma la reserva de
> movimiento (mas celdas resaltadas), y al mover a una celda solo alcanzable con
> el extra consume la Energia, lo dice en el log y mueve la unidad de verdad; un
> ataque real de jugador aplico -60 de daño sin errores de consola en varios
> turnos seguidos con la IA moviendose/duplicando/atacando de vuelta. **Lo unico
> que NO se disparo en las partidas jugadas para verificar (y por tanto sigue
> solo verificado por revision de codigo, no por click real)**: un contragolpe
> con Rotura — los intercambios que salieron tenian al defensor con una cara sin
> valor de golpe (`canCounterWith` exige `face.value != null`), asi que
> `computeCounterHit` devolvio `null` correctamente en vez de contraatacar; la
> logica esta revisada a fondo (`computeCounterHit`/`applyCounterLocal`/
> `grantsBreak`) pero un contraataque real con badge de Rotura visible no llegó
> a ocurrir en pantalla esta sesión.
>
> **Fuente de verdad del diseño: `MVP1vinculodelunacia.md`** (raíz del repo, reglas).
> `BRIEFING-UNITY-3D.md` documenta la investigación histórica de stack (Terrariums usa
> Phaser+PixiJS+React) pero **la decisión final de esta sesión fue otra** — ver abajo.
> Este `CLAUDE.md` sigue mandando en cómo trabajar en el repo (idioma, estilo).
>
> **Dado del Lord rediseñado dos veces (sesión 2026-09-10, ambas a pedido
> explícito del usuario) — detalle completo en `MVP1vinculodelunacia.md`
> sección 4.2/4.3 (actualizada las dos veces):**
>
> *Primer rediseño*: de 1 ataque + 5 caras que invocan (diseño original: 3
> ranuras bloqueadas se comportaban como Invocación sin el sistema de Esencia,
> no implementado en el MVP1) a 1 ataque + 2 invocación + 3 habilidades de
> apoyo desbloqueadas de base (Muro, Marca, Duplicar).
>
> *Segundo rediseño* (mismo día, "quiero que las habilidades no sean meter más
> axies... el que haya invocación solo sea en la de duplicar", y quitar toda
> mención a "torre"): las 2 caras de Invocación desaparecen del todo,
> sustituidas por dos buffs pequeños (Cura +15 vida, Templanza +15 al
> próximo ataque de un aliado). **Duplicar** pasa a ser la ÚNICA cara que
> mete una unidad nueva en el tablero — para que la reserva de 3 no se quede
> sin forma de entrar en juego, esa misma cara ahora cubre TANTO clonar un
> aliado en el tablero COMO sacar de la reserva (el jugador elige con el
> click: aliado = clona, casilla vacía junto al Lord = invoca de la reserva;
> `lordClone`/`lordSummon` en `App.jsx`, misma `lordSummonCells` para las
> dos). "Ataque de torre" → **"Ataque del Lord"**; "Torre del mando" (subtítulo
> de la carta) → **"Puesto de mando"**; el propio documento de diseño y el
> subtítulo de la app ya no dicen "torre" en ningún sitio.
>
> Nuevo campo `marked` en cada unidad (`App.jsx`, `makeUnit`) — Marca: se
> consume en el primer ataque que impacte a esa unidad, sea de una unidad o
> del Lord; el bonus (+20) se añade en LOS 4 sitios donde se calcula daño
> contra una unidad (`attack()`, `computeUnitAttack`, `lordAttack()`, la rama
> `lord-attack` de `runEnemyTurn`). Nuevo campo `buffed` — Templanza: mismo
> patrón pero del lado del ATACANTE (+15), solo hace falta en los 2 sitios
> donde una UNIDAD ataca (`attack()`, `computeUnitAttack` — el Lord nunca es
> el atacante bendecido, `lordAttack()` no lo necesita). Misma duplicación de
> lógica de combate ya documentada antes en ambos casos, no se ha tocado.
>
> Color del Lord (`--card-accent` en `LordCard.jsx`) pasó de `#e3a857` (casi
> igual al naranja de Beast, `#f0a04b`) a `#ffc233`, un dorado más saturado y
> distinguible — pedido explícito del usuario. El pie de la carta del Lord
> (`.card-foot`, roll-result + botón Seleccionar) tenía el MISMO bug de
> solape que ya se había arreglado en las cartas mini (`.card-foot` base es
> `position:absolute`, flotaba encima de la lista de caras) — mismo arreglo
> aplicado en `.card.lord-card .card-foot` (App.css).
>
> **Estado actual: combate del MVP1 completo y jugable de principio a fin (pasos 1-10
> del "Orden de construcción" de `MVP1vinculodelunacia.md`)**, Enemy incluido — ya no se
> juega a mano, `runEnemyTurn` en `App.jsx` le resuelve el turno entero dentro de
> `passTurn()` con las 4 prioridades de la IA mínima del documento. Tablero **8×7**,
> vida/daño en **escala x10** (120/90/70/70). El mapa de terreno actual sigue siendo de
> prueba (los 3 mapas reales, sección 6.1, son el paso 11, todavía no empezado).
>
> **Tablero en 3D real: `Board3D.jsx`, Three.js VANILLA (no react-three-fiber) +
> bloques GLB de Kenney (Platformer Kit, CC0, kenney.nl/assets/platformer-kit)
> unidos en una plataforma.** El usuario pidió explícitamente bloques 3D de verdad,
> no un truco 2D/CSS con apariencia de 3D — WebGL real, con z-buffer real (nada de
> los bugs de orden de profundidad de los intentos anteriores). Cámara
> **ortográfica** (sin escorzo de perspectiva) a propósito: eso hace que la
> proyección 3D→pantalla sea una transformación afín, así que el overlay
> interactivo de React se alinea con UNA sola matriz CSS (`onTransform` en
> `Board3D.jsx`, aplicada a `.board-overlay-3d`) en vez de recalcular la posición
> de cada celda a mano. Ángulo final, decidido con el usuario: **30° de inclinación
> en el eje X** + **10° de giro tipo "peonza sobre la mesa"** en el eje Y del
> propio tablero (no de la cámara) — ambos en `elevationDeg`/`azimuthDeg` dentro de
> `Board3D.jsx`.
>
> **Por qué esta vez SÍ funcionó Three.js** (la sesión ya lo había intentado una
> vez y fallo con un canvas en blanco sin error): aquella vez era
> `@react-three/fiber`, que monta la escena con SU PROPIO reconciliador de React
> separado del árbol normal — `useGLTF` suspende ahí dentro y un `<Suspense>` por
> fuera de `<Canvas>` no lo captura. Aquí es Three.js imperativo puro dentro de un
> `useEffect` (mismo patrón que ya funcionaba bien con Phaser antes de quitarlo):
> sin reconciliador que sincronizar, sin ese problema.
>
> **Bugs reales encontrados y resueltos por el camino, para no repetirlos:**
> - Tras `npm install three`, el canvas de prueba se quedaba completamente en
>   blanco sin ningún error de React — la causa real era que Vite necesitaba
>   re-optimizar sus dependencias (`three` nunca se había importado antes en esta
>   sesión de dev server) y el cache de `node_modules/.vite` estaba desincronizado.
>   Se arregló matando el servidor, borrando `node_modules/.vite` y reiniciando
>   (mismo fix que ya hizo falta una vez con Phaser).
> - El GLB de Kenney se cargaba pero salía gris/sin textura: el modelo referencia
>   un `colormap.png` COMPARTIDO por fuera del `.glb` (para no duplicar la misma
>   textura en ~150 modelos), en `Models/GLB format/Textures/colormap.png` dentro
>   del pack descargado. Hay que copiar ese PNG manteniendo la MISMA ruta relativa
>   junto al `.glb` servido (`public/models/Textures/colormap.png`) para que
>   `GLTFLoader` lo resuelva.
>
> Las unidades y Lords del **tablero** se renderizan con el mixer 3D
> (`@jaatster/threejs-axie-mixer3d-public`, vanilla Three.js, axies del roster +
> los 2 Lords con cuerpo 'sumo') y las **cartas del dashboard usan ahora el MISMO
> modelo 3D**: `Portrait3D.jsx`, con el mixer COMPARTIDO con el tablero
> (`src/axieMixer3D.js`: singleton de modulo sin dispose al desmontar). El puente
> 2D se quedó SIN uso en esta sesión (`src/axieMixer.js` + `src/AxieSprite.jsx`,
> pixi-spine) pero queda en el repo como referencia.
>
> **Renderer WebGL compartido para las cartas (sesión 2026-09-10, `src/sharedRenderer3D.js`):**
> antes CADA carta (`Portrait3D.jsx` y `Die3D.jsx`) abria su propio
> `THREE.WebGLRenderer`, es decir su propio contexto WebGL. Con 2 Lords + 6
> unidades eso eran 8 retratos + 6 dados = 14 contextos solo en el dashboard, mas
> el del tablero (`Board3D.jsx`) = 15 en total, al borde del limite tipico del
> navegador (~16) — sintoma real visto en consola: `"Too many active WebGL
> contexts. Oldest context will be lost."` repetido, riesgo de que una carta se
> quedara en blanco sin aviso. Ahora hay UN unico `WebGLRenderer` oculto
> (`registerRenderable`, modulo singleton) que atiende a todas las cartas: cada
> carta sigue con su propia escena/camara/objetos 3D (su propia animacion), pero
> ya no crea su propio canvas WebGL — crea un `<canvas>` 2D normal, y un bucle
> central (`requestAnimationFrame` unico) dibuja cada carta por turno en el
> canvas WebGL compartido y vuelca el resultado con `drawImage` sobre el canvas
> 2D visible de esa carta. `Board3D.jsx` se queda con SU PROPIO contexto aparte
> (escena grande, vive todo el tiempo de la partida) — total: 2 contextos WebGL
> en toda la app, verificado contando `canvas.getContext('webgl')` en la pagina
> real tras el cambio. `preserveDrawingBuffer:true` vive ahora en el renderer
> compartido, no por carta.
>
> **Bug real encontrado y arreglado al depurar lo de abajo:** el cleanup de
> `Portrait3D.jsx`/`Die3D.jsx` (tras pasar al renderer compartido) dejo de
> quitar su propio `<canvas>` del DOM al desmontar (`host.removeChild`) — en
> desarrollo, StrictMode remonta cada efecto una vez de mas (monta, desmonta,
> vuelve a montar) y sin ese removeChild el remontaje anadia OTRO canvas al
> mismo `<span>` host, dejando dos apilados (uno huerfano, sin registrar en
> el renderer compartido). Visible como un hueco en blanco raro en las
> cartas. Arreglado en ambos archivos.
>
> **Refactor a componentes + Tailwind CSS v4 + responsive de escritorio
> (sesión 2026-09-10, pedido explícito del usuario — "que todo sea
> componentes y responsive como hicimos en otros proyectos... siempre
> implementar las mejores tecnologías"):** `App.jsx` (antes 1843 líneas, todo
> en un componente) pasó a ser el ORQUESTADOR (estado de partida + handlers +
> composición) y la UI se partió en `src/components/*.jsx` (uno por pieza:
> `Emblems`, `LoadingCurtain`, `TerrainLegend`, `BattleLog`, `VictoryBanner`,
> `Hud`, `Controls`, `ActionBar`, `LordCard`, `UnitCard`, `UnitDetailPanel`,
> `Roster`, `BoardRegion`) más `src/gameConstants.js` (geometría/glifos que
> los componentes hoja necesitan directamente). La lógica de partida (turnos,
> combate, IA) se queda intacta en `App.jsx`, sin tocar — esto fue deliberado
> para no arriesgar el MVP1 ya jugable, pese a que el `CLAUDE.md` decía "no
> refactorizar por higiene" (regla pensada para el ritmo del Vibeathon; el
> usuario la anuló explícitamente para este pedido). Se añadió **Tailwind
> CSS v4** (`tailwindcss` + `@tailwindcss/vite`, sin `tailwind.config.js` ni
> PostCSS — integración CSS-first de v4) como infraestructura; el sistema
> visual ya existente (`.card`, `.die-*`, animaciones, posicionamiento del
> tablero) se dejó tal cual en `App.css` — Tailwind no sustituye CSS que ya
> funcionaba, se usa para la capa responsive que faltaba por completo (cero
> `@media` en todo `App.css` antes de esto). Responsive = solo robustez de
> escritorio (el usuario rechazó explícitamente soporte móvil/táctil):
> `.app` pasó de `height:100vh` a `100dvh`, `.roster-col` de `340px` fijos a
> `flex:0 0 clamp(260px, 22vw, 380px)` (con `overflow-x:hidden` explícito —
> sin él, el redondeo de subpíxel entre el `clamp()` y `.roster-squad` podía
> dejar una barra horizontal fantasma de 1px), verificado sin overflow desde
> 1152×768 hasta 2560×1440 con chrome-devtools-mcp. `Board3D.jsx` no se tocó:
> ya tenía su propio `ResizeObserver` (ajusta cámara/encuadre solo).
>
> **Cartas de unidad compactas + panel de detalle compartido (mismo pedido,
> mismo día):** las 3 cartas de unidad de un bando ahora se ven siempre a la
> vez con solo retrato 3D + clase + movimiento/alcance + HP + el cubo del
> dado (`UnitCard.jsx`, sin la lista de 6 ranuras). El detalle en texto de
> esas 6 ranuras vive en un panel COMPARTIDO debajo de las 3 (no una carta
> creciendo, un panel único, pedido explícito del usuario) que muestra la
> unidad sobre la que está el cursor o, si no hay hover, la seleccionada
> (`UnitDetailPanel.jsx`, montado por `Roster.jsx`, que guarda el `hoveredId`
> como estado local de UI — no es estado de partida, no vive en `App.jsx`).
> Reutiliza las clases base `.die-list`/`.face-card` (las mismas que ya usaba
> la carta del Lord), no las recortadas `.card.mini .face-*` (eliminadas: ya
> no queda ningún `.face-card` dentro de una carta mini). La carta del Lord
> NO cambió (decisión explícita del usuario: su dado ya es una lista corta
> de 6 acciones, no 6 partes de cuerpo, no tenía el mismo problema de
> espacio).
>
> **Dashboard rediseñado (sesión 2026-09-09):** el roster va en **dos bandas**,
> "Tus Axies" primero y "Asediantes" después (`.roster-group` + `.roster-title`
> `.ally`/`.enemy` + `.roster-split`), con los retratos 3D **más grandes** (`Portrait3D
> size={104}` en las cartas). Cada cara del dado lleva ahora un **pictograma 3D de la
> parte real del Axie** (`src/partIcon3D.js`): no hay set de iconos de partes
> accesible (el marketplace blinda las imágenes y los kits del Vibeathon no traen
> sprites), así que se renderiza el **modelo 3D oficial de la parte** del pack
> (`public/assets/axie/socket-local-parts/final-unity/standard-parts/S00_<Clase>02_L1_<Slot>.glb`),
> que es la silueta real de Imp/Balloon/Ojos..., coloreado con el color de la clase y
> cacheado como data URL por (clase, ranura) — un renderer WebGL oculto compartido
> que no toca el del tablero. El lanzamiento de dados ahora tiene **recreación visual**
> (pedido explícito): al tirar (`rollDice`) entra un estado `rolling` de ~700 ms en el
> que la rejilla se sacude, cada cara "baraja" en cascada (`--i`) y un brillo barrea
> (`die-shake`/`face-slot-shuffle`/`dice-sweep` en `App.css`), y al hacer commit cae la
> cara ganadora con `dice-land` (giro 900° + pop de brillo). `resetMatch` cancela la
> tirada pendiente (`rollPendingRef`) y el botón "Tirar dados" se desactiva/etiqueta
> "Lanzando dados…" durante la tirada. El dado de las cartas pasó a **6 ranuras**
> (`DIE_SLOTS`, `src/axie.js`): ojo/oreja salen como huecos vacios sin carta
> (`.face-card.empty`) y solo las 4 ranuras de combate (cuerno/boca/lomo/cola) se
> pueden tirar (`u.die` no cambió). Hay botones **"Reiniciar partida"** en los
> controles y en el banner de victoria (`resetMatch` en `App.jsx`). **De momento
> solo hay pieza 3D para terreno "abierto"** (`block-grass.glb`, un
> bloque por celda, con su `colormap.png` en `public/models/`); piedra/agua/zona lenta
> siguen con su tinte CSS plano (`.terrain-stone`/`.terrain-earth`/`.terrain-water` en
> `App.css`) hasta que el usuario elija qué pieza de Kenney usar para cada una — lo
> dejó explícitamente para después ("ya luego probamos nuevas cosas"). El fondo
> decorativo (`LunaciaBackdrop.jsx`) se quitó del render por pedido del usuario
> mientras se centra en el tablero; el componente sigue en el repo por si vuelve a
> hacer falta.
>
> Se prototipó primero en `demos/cube-board-test.html` (CSS 3D, losa única, antes de
> pasar a Three.js) y en una pagina de prueba aislada (`board3d-test.html` +
> `src/board3d-test-main.jsx`, en la raíz del repo) antes de integrarlo en el juego
> real — quedan ahí como referencia rápida para seguir iterando el tablero sin tocar
> `App.jsx`.
>
> Layout en dos columnas (`.layout`/`.board-col`/`.side-col`, `App.css`): el tablero
> domina la izquierda, todo lo demás (roster/controles/log) va en una barra lateral con
> su propio scroll interno. `.app` es `height:100vh; overflow:hidden` — la página nunca
> hace scroll (pedido explícito del usuario).
>
> **Dependencias añadidas más allá de `@axieinfinity/mixer`+PixiJS** (excepción
> documentada más abajo): `three` (el tablero real). `phaser`, `@react-three/fiber` y
> `@react-three/drei` se instalaron y se **quitaron** en esta misma sesión
> (experimentos descartados, ver arriba).

Prototipo para el **Axie Vibeathon 2026**, Ronda 1. Táctico de escaramuza por turnos
sobre rejilla, en navegador, donde **las caras del dado de cada criatura son las partes
de su cuerpo**.

Idioma de trabajo: **español**. El código y los identificadores, en inglés; los textos de
interfaz y la documentación, en español (sin tildes en el código para evitar problemas de
codificación; con tildes en los .md).

---

## 1. El pitch, en una frase

> Un táctico por turnos donde el dado de cada Axie está hecho de sus seis partes del
> cuerpo, y ascender no sube un número: evoluciona una parte y reescribe esa cara.

Esta frase es el eje del proyecto. Cualquier decisión que la debilite es la decisión
equivocada.

---

## 2. Por qué es así (decisión clave, ya tomada)

El prototipo original tenía criaturas genéricas con HP/ATQ/DEF y un dado de
`['summon','summon', N, N, N, N]`. Funcionaba, pero fallaba el test más importante:
**si sustituías los Axies por setas, el juego funcionaba igual**.

En el Vibeathon, "Axie Core" pesa el **35 %** de la nota de Ronda 1. Un juego con Axies
pegados encima puntúa mal. Lo que hace único a Axie no es que gane experiencia: es que
**cada Axie es una combinación de seis partes del cuerpo y una clase**.

La decisión fue por tanto **no cambiar de juego, sino cambiar de qué está hecho el dado**:

- Seis partes del cuerpo → seis caras del dado.
- La cara ya no dice "cuánto pego", dice **"qué puedo hacer este turno"**.
- La Ascensión evoluciona **una parte concreta** y reescribe esa cara.

Resultado: si quitas las partes no hay dado, y si no hay dado no hay juego. El genoma
es inseparable de la mecánica.

### Qué es original y qué no (declararlo en la entrega)

- **No es original:** el táctico de rejilla con invocación desde zona propia y victoria
  por "mata al líder rival" es el esqueleto de Summoner Wars. Los dados de acción con
  caras que son habilidades existen (Dice Throne, King of Tokyo). No reclamar ninguna.
- **Sí es original:** que las caras del dado sean las partes del cuerpo de una criatura
  coleccionable, y que la evolución de una parte reescriba una cara concreta. Convierte
  la genética de Axie —que en el resto del ecosistema es un bloque de estadísticas o un
  mazo de cartas— en una distribución de probabilidad que el jugador moldea.

---

## 3. Restricciones del Vibeathon

| Hito | Fecha |
|---|---|
| Ronda 1 (prototipo jugable + visión) | 8–21 sep 2026 |
| Finalistas anunciados | 29 sep |
| Ronda 2 (producción) | 4–31 oct |
| Demos finales y ganadores | 5 nov |

**Criterios de Ronda 1:**

| Criterio | Peso |
|---|---|
| Axie Core | **35 %** |
| Gameplay | 25 % |
| Visión de producto | 20 % |
| Viabilidad | 10 % |
| Calidad de prototipo y documentación | 10 % |

**Entrega:** título, pitch de una frase, descripción corta y larga, thumbnail, enlace
jugable que abra en pestaña nueva, controles e instrucciones de primer contacto, enlace
a repositorio (puede ser privado), vídeo de respaldo, y declaración de qué herramientas
IA se usaron y cómo encaja con Axie Core.

**La integración on-chain es opcional en fase de prototipo.** No gastar tiempo en ella.

---

## 4. Contexto de mercado (resumen; el estudio completo está en `docs/`)

> Documentos de referencia, con fuentes citadas:
> - `docs/estudio-mercado-2026.md` — tendencias 2026 (móvil, PC, Web3), estado de Ronin y
>   Axie, análisis del hilo de @MukeGaming, y las direcciones que se descartaron.
> - `docs/decision-de-producto.md` — por qué el juego es como es y el plan de Ronda 1.
>
> Leerlos solo si hace falta justificar una decisión o escribir la entrega; para trabajar
> en el código basta con este archivo.

Lo que justifica las decisiones de diseño:

- **El 4X está en declive**: dos trimestres consecutivos a la baja tras tocar techo en
  3.090 M USD en Q4'25, y retiene fatal (Whiteout Survival D30 5,57 %, Last War D30
  3,82 %). Por eso este juego es **táctico de sesión corta**, no estrategia pesada.
- **Las descargas caen ~12 % interanual pero el ingreso por descarga sube un 11 %**: el
  mercado premia retención y profundidad, no captación. Sesiones cortas y repetibles.
- **Puzzle es el único motor de crecimiento real** (+20 % IAP, ~70 % de toda la ganancia
  absoluta del mercado móvil). De ahí viene la idea de que la aleatoriedad del dado sea
  un problema que resolver, no un resultado que sufrir.
- **Web3 gaming está estancado, no creciendo**: 4,66 M de wallets activas diarias
  (DappRadar Q3 2025, último informe trimestral publicado), –4,4 % trimestral. La media
  de los juegos hace **2–5 transacciones por wallet** (login, reclamar, salir). Axie hace
  22. Los líderes (Alien Worlds 599, Off the Grid 124) son los que dejan fabricar y
  consumir dentro del juego.
- **Ronin está contraído pero saneado**: migración a L2 de Ethereum sobre OP Stack
  completada en mayo de 2026, inflación de RON de >20 % a <1 %, comisiones al tesoro del
  0,5 % al 1,25 %, grants "Proof of Distribution" de 5 M RON para juegos con demanda real.
  Axie Infinity Classic cerró el 24 de junio de 2026; Sky Mavis consolida en Origins.
- **Hueco confirmado:** no hay ningún táctico de rejilla con dados en Ronin. Origins es
  card battler, Den of Mysteries dungeon crawler, Homeland y Pixels gestión, Lumiterra
  MMORPG.

---

## 5. Herramientas reales de Axie/Ronin (verificado en docs.skymavis.com, sep 2026)

**Importante: solo usar lo que está aquí. No inventar endpoints ni nombres de paquetes.**

### Renderizado de Axies

`@axieinfinity/mixer` (npm, v1.4.9) — utilidad para renderizar Axies 2D a partir de
**genes**, con soporte de accesorios y animaciones, vía PixiJS.

- Dependencias exactas: `pixi.js@7.2.4`, `pixi-spine@4.0.3`.
- Hay que llamar a `initAxieMixer(GenesData, SamplesData, VariantsData, AnimationsData)`
  antes de usar nada; los JSON se importan de `@axieinfinity/mixer/dist/data/`.
- Función principal: `getAxieSpineFromGenes(genes, meta, false)` → `{ skeletonDataAsset, variant }`.
- Assets: `https://axiecdn.axieinfinity.com/mixer-stuffs/v6/`
- Accesorios (Spine 2D): `https://axiecdn.axieinfinity.com/mixer-stuffs/accessory-spines/v1`
- Para partes evolucionadas hace falta v1.4.1 o superior.

Otros kits: `unity-axie-gtk2d` (Unity), `cc-axie-gtk2d` (Cocos Creator),
`r3f-axie-starter` (React Three Fiber, 3D, personajes Buba/Puffy/Pomodoro),
`fbx-axie-starter`, `unity-axie-starter-3d-demo`.

### AXP (Axie Experience Points)

- **AXP es off-chain**; los **niveles sí son on-chain**.
- **La Ascensión ocurre en los niveles 10, 20 y 30**, y requiere que el usuario firme una
  transacción on-chain.
- La AXP API es RESTful y **requiere app aprobada en el Ronin Developer Console + permiso
  explícito del servicio AXP**. No es alcanzable en la ventana de Ronda 1.

> ⚠️ El prototipo usa un umbral de 3 AXP por Ascensión. Es una **abstracción deliberada**
> para que la progresión se vea dentro de una partida de demo. Hay que decirlo
> explícitamente en la entrega y explicar que el modelo real es 10/20/30 con firma
> on-chain. Demostrar que se conoce el sistema real puntúa en Axie Core.

### Otros servicios (fuera de alcance para Ronda 1, útiles para la visión de producto)

- **Ronin Waypoint**: servicio de cuenta + wallet sin llaves, para onboarding sin fricción.
- **Ronin Store**: venta de objetos de juego, on-chain y off-chain, con pagos familiares.
- **Ronin Market**: marketplace NFT.
- **Reward Distribution**: reparto de recompensas en ERC-20 sin montar tu propio sistema.
- **Saigon** es el testnet; el mainnet es permisionado y requiere aprobación de Sky Mavis.

---

## 6. Modelo económico para la sección de visión de producto (20 %)

Tres patrones de industria (no inventos propios; citarlos como tales):

1. **Estructura de dos capas**: un coleccionable caro + tropa desechable. *El juego ya la
   tiene*: el Lord es el Axie coleccionable, el roster es la tropa. Baja el coste de
   entrada a un solo activo.
2. **Sink asimétrico**: la tropa se destruye permanentemente, el Lord solo se hiere y se
   cura. *El juego ya lo tiene implementado* (`alive: false`), solo faltaba nombrarlo. Es
   la respuesta al problema estructural que hundió al P2E: juegos sin sinks reales que
   dependen de dinero nuevo.
3. **Suscripción para acuñar**: los objetos son de juego por defecto; se paga una cuota
   mensual por el derecho a convertirlos en NFT. Ingreso recurrente que no es venta de
   poder, y solo va on-chain lo que alguien valora lo bastante como para pagarlo. Encaja
   con hacia dónde va Ronin (bAXS no transferible, inflación de RON al mínimo, grants por
   demanda real).

**Regla de oro:** el juego solo paga lo que realmente ingresa. Nada de token nuevo.

---

## 7. Cómo trabajar en este repo

```
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint     # oxlint
```

**Loop visual automatizado (sesión 2026-09-10):** se configuró `chrome-devtools-mcp`
(oficial Google, devDependency) en `opencode.json`. Lanza su propio **Edge headless** con
`--no-page-id-routing`, así que las tools de navegador se pueden usar sin `pageId`. Uso:
`evaluate_script` para medir geometría/colores/alineaciones en la app REAL corriendo
(estilos computados, `getBoundingClientRect`, comparar X de glifos, detectar overflow,
etc.), `navigate_page` para recargar, `click`/`type_text` para probar el flujo, y
`take_screenshot` para dejar un PNG/JPEG en disco que el USUARIO abre al instante.
OJO: el modelo de esta sesión **no lee imágenes** (error "Cannot read image"), así que
los screenshots son para el usuario; la IA verifica lo visual por píxeles/probe numérico
vía `evaluate_script` (estilos + rects) o muestreando pixels
(`toDataURL`→`drawImage`→`getImageData` solo funciona en canvas con
`preserveDrawingBuffer`; el del tablero NO lo tiene — para leerlo por píxeles hay que
exponer un hook de debug del renderer o forzar `render()`).
Avisar al usuario de reiniciar opencode tras tocar `opencode.json` (no se recarga en frío).

**Stack:** React 19 + Vite 8, sin librería de estado, sin router, sin TypeScript.

**Estructura:**

```
src/
  App.jsx              orquestador: estado de partida, logica de turnos/combate/IA,
                        composicion de los componentes de abajo (ver nota de estado
                        arriba, sesion 2026-09-10 — ya NO es un componente unico)
  gameConstants.js      geometria del tablero y glifos que los componentes hoja
                        necesitan directamente (ROWS/COLS/CELL_SIZE/etc.)
  components/           UI de presentacion (LordCard, UnitCard, UnitDetailPanel,
                        Roster, BoardRegion, Hud, Controls, ActionBar, etc.)
  axie.js               datos de partes, clases, dados y resolucion de efectos
  axieMixer.js          puente genoma -> @axieinfinity/mixer (tabla de genes reales,
                         animaciones de ataque)
  AxieSprite.jsx        render 2D real del Axie (PixiJS + pixi-spine) en carta y tablero
  LunaciaBackdrop.jsx   fondo ambiental 2D (pueblo/naturaleza, PNGs de Kenney recoloreados),
                         decorativo, ver nota abajo
  App.css               estilos del juego (sistema visual bespoke: cartas, dado, tablero);
                        index.css solo trae el reset base + `@import "tailwindcss"`
```

### Reglas de trabajo (importantes, hay 13 días)

- **La UI ya está partida en `src/components/*.jsx`** (sesión 2026-09-10, pedido
  explícito del usuario — anuló esta regla para ese pedido). No sigas partiendo más
  piezas "por higiene" a partir de aquí sin que lo pida: divide solo si bloquea de
  verdad. La lógica de partida se queda en `App.jsx` (orquestador); la lógica de datos
  en `axie.js`.
- **Nada on-chain.** Es opcional en prototipo y es tiempo robado al 35 %.
- **No ampliar el tablero ni el roster.** Dos criaturas bien diferenciadas por sus partes
  demuestran más que seis genéricas.
- **Antes de añadir un efecto nuevo, comprobar que los que hay se entienden.** Es mejor
  tener cuatro efectos legibles que seis desbalanceados.
- **La carta de criatura tiene que enseñar el dado con sus seis partes.** Es la pantalla
  que hace que se entienda la idea en cinco segundos sin leer nada. Prioridad máxima de
  interfaz.
- **No usar TypeScript ni añadir dependencias** salvo `@axieinfinity/mixer` y sus pares
  de PixiJS, `three`, y `tailwindcss`+`@tailwindcss/vite` (ver notas de estado arriba).
  Cualquier otra dependencia nueva se pide primero.

> **Nota sobre `LunaciaBackdrop.jsx` (histórico):** cuando el usuario pidió ver el
> tablero "en 3D, en el mundo de Lunacia", la alternativa de bajo riesgo elegida en su
> momento fue un fondo 3D decorativo con `three` detrás del tablero 2D real. Más tarde
> el usuario enseñó una referencia real (Terrariums) pidiendo un fondo de pueblo/
> naturaleza en vez de espacio abstracto, así que `LunaciaBackdrop.jsx` se reescribió
> como fondo 2D (PNGs recoloreados de Kenney) y se quitó `three` del proyecto. El
> tablero en sí pasó después por CSS 3D puro → Three.js/react-three-fiber (`Board3D.jsx`)
> → Phaser (`PhaserBoard.jsx`) → **CSS 3D puro de nuevo**, esta vez con la técnica
> correcta (losa única con 3 caras, no cubos por celda ni motor 2D/3D externo) — ver la
> nota de estado arriba para los motivos reales de cada descarte. Ninguno de los
> archivos de los intentos abandonados sigue en el repo.

### Orden de trabajo previsto

1. ~~Conversión del dado: caras = partes~~ (hecho)
2. ~~Assets reales: integrar `@axieinfinity/mixer` para dibujar los Axies en las cartas
   y en el tablero~~ (hecho — `src/axieMixer.js` + `src/AxieSprite.jsx`; ver nota abajo)
3. ~~IA enemiga con prioridades (rematar al herido, ir al Lord si está libre)~~ (hecho —
   prioriza un remate sobre solo "el más herido", y rodea un bloqueo simple hacia el
   Lord). El ritmo del spawn, cada 3 turnos, se dejó igual.
4. Despliegue (Vercel o Netlify desde Vite), vídeo de respaldo y declaración de encaje
   con Axie Core.
5. Playtest con alguien que no lo haya visto: si no entiende el dado en un minuto, el
   problema es de interfaz, no de diseño.

> **Nota sobre el paso 2:** `@axieinfinity/mixer` no acepta nombres de parte ("Imp",
> "Goda"), solo un genoma binario real o un `AxieBodyStructure` con clase + partValue
> numerico por parte. `axieMixer.js` trae esa tabla (`PART_GENE`) verificada contra el
> decodificador de genes comunitario (github.com/ShaneMaglangit/agp), no inventada. Al
> verificarla salió que 6 de las 18 partes de `PARTS` en `axie.js` tenían la clase real
> equivocada (Little Branch, Goda, Axie Kiss y Timber son Beast; Hermit es Aquatic; Papi
> es Plant) — ya está corregido. Solo enemigos "Axie salvaje" siguen sin genoma propio
> (son genéricos a proposito, fuera del sistema de partes).

### Ideas guardadas para más adelante (no ahora)

- **Afinidad de clase por terreno**: Aquatic se mueve mejor por agua, Bird ignora un
  obstáculo. Hace que la composición de equipo importe. Va en la visión de producto, no
  en el prototipo de Ronda 1.
- **Capa de scouting/fantasy** sobre datos reales de la ladder de Origins (existe la
  Axie Infinity Origins API con leaderboards y battle logs). Depende de verificar que la
  API dé resultados por Axie. Modo secundario a largo plazo.
