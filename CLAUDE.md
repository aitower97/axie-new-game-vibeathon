# Vínculo de Lunacia — contexto del proyecto

> **Muerte súbita PVP + afinidad de clases + crítico genético + timer de turno
> (sesión 2026-09-14, rama `feat/jugabilidad-prorroga-afinidad-critico`; detalle
> en `docs/jugabilidad-prorroga-afinidad-critico.md`):**
> - **Pedido del usuario: "que la partida se sienta decidida por el jugador y no
>   por suerte larga"** — tres mecánicas nuevas + un reloj para el PVP.
>   **Afinidad**: triángulo oficial de Axie traído a las 4 clases del MVP1 — Beast
>   gana a Plant y pierde con Aqua/Bird; Plant gana a Aqua/Bird y pierde con Beast;
>   Aqua gana a Beast y pierde con Plant; Bird gana a Beast y pierde con Plant;
>   Aqua/Bird y parejas sin relación neutras. `AFFINITY_STRONG/WEAK = 1.15/0.85`
>   con `Math.floor`, aplicado en el especial, el básico y el **contragolpe** (que
>   mira desde el defensor que contesta), en los 4 resolutores de ataque como una
>   única fuente; contra el Lord es neutro (no tiene clase). **Crítico genético**:
>   la prob. y el multiplicador salen de la CLASE (Beast 20 %/×2.0, Bird 25 %/×2.5,
>   Aqua 15 %/×3.0, Plant 5 %/×1.5) + la parte TIRADA aporta +5 % de ráfaga y +0.25
>   al multiplicador (el básico solo lleva la base de clase). Tirado en el
>   resolutor real (`applyUnitAttackLocal`/`applyCounterLocal` con `rollCrit`),
>   NUNCA en la preview: la preview (`describeExchange`) muestra la estadística
>   vía `critFor` y sigue determinista. **Muerte súbita (solo PVP)**: tras la ronda
>   8, +2 casillas de movimiento (`OVERTIME_MOVE`) y +50 % de daño (`OVERTIME_DMG`)
>   para AMBOS bandos, 2 rondas extra = 4 medios-turno (`OVERTIME_ROUNDS`/`EXTRA`),
>   luego tiebreak por vida de Lord. `OVERTIME_ACTIVE` es flag de MÓDULO (patrón
>   `TERRAIN_LAYOUT`): lo leen los helpers puros (`effectiveMove`, daño) sin
>   recibirlo por parámetro. Activación al INICIO de `passTurn` (antes del corte)
>   con log "MUERTE SUBITA (PVP): prorroga de 2 rondas…" + impacto VFX sobre ambos
>   Lords (`klass:'lord', effect:'overtime'`); techo de reloj dinámico
>   `16 + OVERTIME_EXTRA`; el PVE corta en 16 como siempre. **Timer PVP 20 s**:
>   `PVP_TURN_MS = 20000` solo en arenas PVP y solo durante el turno jugable
>   (el turno rival se reproduce con pausa y no consume reloj); al agotarse,
>   tirada automática (si aún no) + pase de turno sin mover/atacar. `setInterval`
>   de 1 s con `turnSecondsRef` (sin re-render por segundo) + estado
>   `turnSecondsLeft`; `autoPassRef` enlaza `passTurn`/`rollDice` vivos cada render
>   (el lint de deps del `useEffect` exigía eso; alternativas re-creaban el
>   interval por segundo — solución documentada). Reseteo al volver el turno al
>   jugador y en `resetMatch` (que también apaga `OVERTIME_ACTIVE`).
> - **UI:** `ActionPad.jsx` gana chips de preview `Afinidad x1.15/x0.85` (+ "Afinidad
>   neutral") y `Critico N% xM`, que solo salen cuando hay objetivo en rango y no es
>   el Lord; aviso de prórroga (+2 casillas / +50 %) solo para unidades. `Hud.jsx`:
>   pastilla "MUERTE SUBITA" dinámica y contador `X/8` → `X/10` en prórroga.
>   `Controls.jsx`: chip `⏱ Ns` (rojo con pulso ≤5 s). CSS nuevo en `App.css`:
>   `.combat-float.variant-crit` (verde), `.odds-chip*`, `.turn-timer*`,
>   `.hud-chip.turn.overtime`.
> - **Bug real encontrado en la verificación en vivo y arreglado**: el chip de
>   crítico pintaba "Critico 3000 %" porque `rate` ya viene en porcentaje y el chip
>   lo multiplicaba por 100 (`Math.round(exchangeCrit.rate * 100)`) — corregido a
>   `Math.round(exchangeCrit.rate)`.
> - **Verificado en vivo** (CDP 9333 directo, drivers Node propios en la temp del
>   opencode: `cdp-feature-check.mjs` → `cdp-attack3.mjs`): timer contando (17→16 s),
>   auto-pase por tiempo agotado confirmado (el reloj reaparece en ~19-20 s); chips
>   `Afinidad x1.15` y `Critico N% xM` visibles al pasar el cursor sobre un objetivo
>   en rango; floats `CRITICO` y `Afinidad` ocurriendo en combate real; cero errores
>   de consola y cero excepciones. `npm run build` + `npm run lint` (48 ficheros)
>   limpios. Capturas simples: no hace falta la suite, el drive jugó partidas reales.
>   **Pendiente de verificación en vivo**: la prórroga exige llegar a la ronda 9 con
>   el Lord propio vivo — la IA gana en ~4 rondas si el jugador no defiende, así que
>   el driver no la alcanza; lógica revisada por código y pendiente de partida manual.

> **VFX de combate reales del Axie Origins Battle Kit + auditoría de recursos
> del Vibeathon (sesión 2026-09-14):**
> - **Pedido: "¿y si hacemos que cuando golpeen se vean las habilidades"?** Los
>   7 clips de skill del kit oficial de Origins (grabados del juego real como
>   atlases additive en `public/vfx/`) se integran como overlay de combate real:
>   cada impacto del juego (`applyUnitAttackLocal`, `lordAttack()` y el ataque
>   enemigo del Lord en `runEnemyTurn` — los 4 puntos donde una unidad o un
>   Lord golpea) lleva ahora `klass`+`effect` del golpeador y la casilla de
>   origen (`atkR`/`atkC`); solo el golpe primario y el contragolpe mandan VFX
>   (los floats/ring/sacudida previos se mantienen, el VFX se suma, no
>   sustituye). `originsVfx.js` gana `vfxIdFor(class, effect)` (mapea la clase
>   del Axie al skill del kit: aqua→aquatic_slash, beast→beast_slash, bird y
>   Lord→beast_slash por no tener clip, plant→plant_bite; los buffs del dado
>   del Lord ya quedan mapeados a shield/summon_on_cast para cuando los lleven
>   los impactos) y `getClip`/`preloadVfx` (catálogo + atlas additive cacheados
>   por id, precarga en silencio al montar el tablero). `BoardRegion.jsx` crea
>   por impacto un `<canvas class="vfx-canvas">` hijo del overlay 3D —mismo
>   espacio de layout que las celdas, se transforma con el tablero, con
>   `plus-lighter`, sin clics— y `playOnCanvas` lo auto-elimina al terminar el
>   clip. **Bug real encontrado y arreglado al integrarlo**: `getClip` tenía
>   `.then((atlas) => ({ clip, atlas }))` leyendo `clip` fuera de su scope
>   (ReferenceError "clip is not defined" en cada carga de clip). Se anidó el
>   `.then` de atlas dentro del de clip: `loadClip(id).then((clip) =>
>   AdditiveAtlas.load(clip).then((atlas) => ({ clip, atlas })))`.
> - **Verificado en vivo** (CDP 9333 directo, hub→Partida libre): recarga con
>   cero errores de consola; el pipeline aislado carga el atlas en ~740 ms y
>   cada clip se reproduce entero (~1 s, su duración real); con turnos reales
>   pasados por clics, un impacto del rival crea `.vfx-canvas` que pinta su
>   contenido (9.275 px con alfa en el instante muestreado) y se auto-elimina
>   (~1-1.5 s, traza 0 0 1 1 0). Captura `captura-vfx.png`. `npm run build`
>   + `npm run lint` limpios (los 3 warnings de lint son de páginas demo
>   pre-existentes: spine2d-viewer-main/spine-slime-2d-main).
> - **Nuevo `docs/recursos-vibeathon.md`**: inventario verificado en disco de
>   los recursos del kit oficial (pack 3D de 5.821 archivos con su
>   `content-integrity.json`, slot-icons, starters-2d/chimeras-2d, VFX kit,
>   mixer npm) con estado (integrado/referencia/pendiente) y punto de código,
>   más los paquetes CC0 de Kenney que cubren lo que el kit no tiene. No
>   inventa la lista oficial del kit: es el inventario que el repo puede
>   acreditar.

> **Los enemigos del PvE pasan a ser los starters oficiales de Axie,
> reconstruidos con las partes 3D del pack (sesión 2026-09-12, quinto
> bloque):**
> - **Pedido del usuario: "Beuno no veo mal usar los starters inciales en el
>   PVE"** (en la conversación sobre "en el mixer 3D hay enemigos que no son
>   axies"). Investigación previa: en Classic/Origins los enemigos PvE son
>   **Chimera** (criaturas sin clases, caóticas; el toolkit 2D de Sky Mavis
>   trae sus spines: bear-dad/mom, dryad-fighter/mage/ranger, slime x7,
>   treant x3, werewolf, wolf x4) pero el mixer 3D del pack solo ensambla
>   partes de Axie, sin soporte Chimera; los starters 3D oficiales
>   (axie-starter-3d-assets: Buba/Puffy/Pomodoro) son MODELS COMPLETOS con
>   rig+animaciones, no modulares — usar el modelo entero rompería la premisa
>   del dado de 6 partes. Se ofrecieron dos caminos; el usuario eligió el
>   (a) "reconstruir con partes (recomendado)".
> - **El spine 2D de cada starter confirma que son mascotas con skeleton
>   propio** (analizado buba.json / 12-momo-bird.json / 03-puffy-aquatic.json
>   del toolkit 2D: slots genéricos back/horn/mouth/tail, sin nombres de
>   parte reales tipo Imp/Shrimp) — no son criaturas modulares, así que la
>   reconstrucción asigna las partes REALES verificadas de la clase
>   (ROSTER_PARTS: mismas caras de dado), no partes propias.
> - **Fix (3 archivos + docs)**: `axieGeneCatalog.js` gana `STARTER_INFO`
>   (nombre + `colorVariant` real del manifest por clase enemiga: Buba→Beast
>   beast-03 index 3 `fdb014`, Momo→Bird bird-04 index 26 `ff78b4`, Puffy→
>   Aquatic aquatic-03 index 14 `00dff3`, los tres verificados en
>   manifest.json antes de usarse) y `starterDescriptor()` — el roster
>   ENEMIGO de `ROSTER_DESCRIPTORS` pasa a usar starters (antes todos los
>   colores de clase eran idénticos en los dos lados y solo ojos/orejas 2 vs
>   4 los separaban); **`App.jsx`** (`makeUnit`) añade `name` a las unidades
>   enemigas (lookup de `STARTER_INFO`, heredado por clones y reserva);
>   **`UnitCard.jsx`** muestra una insignia con el nombre del starter en la
>   carta mini; **`PveScreen.jsx`** actualiza el blurb de la escaramuza base
>   ("La pandilla de starters rivales -Buba, Momo y Puffy-"). El Lord y el
>   bando propio no cambian.
> - **Bug real encontrado y arreglado al integrarlo**: `ROSTER_DESCRIPTORS`
>   (que llama a `starterDescriptor`) se evaluaba ANTES de que existiera
>   `STARTER_INFO` en el mismo módulo — `ReferenceError` de TDZ
>   ("Cannot access 'STARTER_INFO' before initialization") que rompía la
>   recarga de Vite en caliente. Se movió `STARTER_INFO`+`starterDescriptor`
>   ANTES de `ROSTER_DESCRIPTORS` en `axieGeneCatalog.js`.
> - **Verificado en vivo** (CDP 9333, WebSocket directo, recarga limpia):
>   0 errores de consola; el roster enemigo muestra las insignias Buba/Momo/
>   Puffy (el jugador ninguna); `ROSTER_DESCRIPTORS.enemy` con colorVariant
>   3/26/14; el tablero 3D arranca con `mixer.create` strict:true sin lanzar
>   con los nuevos colores. Captura `014-starters-rivales.png`. `npm run
>   build` + `npm run lint` limpios.
> - **Elección de starters**: se mantienen las 3 clases del MVP1
>   (beast/bird/aqua) para no tocar contadores; Buba/Momo/Puffy son starters
>   oficiales con nombre propio que cubren EXACTAS esas clases. Deuda:
>   elegir el color oficial de cada starter (no leídos desde el arte) y, si
>   el usuario quiere, usar binas de starters por ranura según la reserva.

> **Un Axie SIEMPRE se puede mover, no importa qué cara le haya tocado
> (sesión 2026-09-12, cuarto bloque):**
> - **Pedido del usuario: "no me gusta que el pajaro si tiene una habilidad de
>   no ataca y empuja a un axie rival el no se pueda mover, un axie siempre se
>   va a poder mover".** Bug real confirmado: con una carta de no-ataque
>   (reposición Swallow, y por el mismo camino guardia+empuje Balloon) la
>   unidad no se PODIA mover — `moveCells` en `App.jsx` excluía reposición con
>   `!isReposition`, y `unitCanAct` acababa el turno de las caras de reposición
>   ANTES de considerar su propio movimiento. Decisión pedida al usuario
>   (respondió "Ninguna carta bloquea el mover"): el movimiento es un derecho de
>   toda unidad con cualquier carta, y la reposición es una opción ADEMÁS del
>   propio movimiento, no en su lugar.
> - **Fix en `App.jsx`**: `moveCells` pierde el `!isReposition` (un Axie con
>   Swallow/Balloon se mueve igual, 2/3 casillas según clase); `unitCanAct`
>   comprueba el MOVIMIENTO SIEMPRE primero, para cualquier carta (antes de las
>   ramas de guardia/reposición), y el auto-fin de turno solo corta si tras
>   moverse no queda nada útil (sin objetivo de básico/especial al alcance y
>   sin aliado adyacente que reposicionar); `moveTo` decide con `unitCanAct`
>   si la unidad sigue seleccionada tras moverse (un Swallow que se mueve Y
>   tiene un aliado al lado puede reposicionarlo después); `canMoveBoost` del
>   ActionPad (gasto 2E = +1 casilla) también pierde el `!isReposition`. En
>   `ActionPad.jsx`, la pista de reposición ahora avisa: "Puedes moverte tu, o
>   tocar a un aliado adyacente para reposicionarlo."
> - **Verificado en vivo** (CDP 9333, con la tirada real cuya BD incluye el
>   renombre del bloque anterior): el pájaro P1 tiró **Swallow**, al
>   seleccionarlo el tablero mostró sus **5 celdas summon-zone** (movimiento
>   real con cara de reposición) y al hacerlo moverse a la casilla (2,1) quedó
>   "Ya ha actuado" — el turno se acabó solo porque ya no veía enemigos ni
>   tenía aliado que reposicionar, justo el comportamiento pedido. `npm run
>   build` + `npm run lint` limpios, cero errores de consola en recarga.
>
> **EL mapeo 3D llega a TODAS las ranuras, no solo a las caras del dado
> (sesión 2026-09-12, tercer bloque):**
> - **Pedido del usuario: "son todas las partes también las que no tienen
>   habilidad... veo alguna espalda mal, las colas ya están bien".** El bloque
>   anterior solo había tocado las 4 ranuras del dado MVP1; ojos, orejas y los
>   slots de combate SIN carta seguían genéricas o con la espalda equivocada.
>   Ahora `ROSTER_PARTS` (en `axieGeneCatalog.js`, que sustituye a
>   `DIE_FACE_3D`) mapea **las 6 ranuras de cada clase** a partes reales:
>   Beast {horn Imp v4, mouth Nut Cracker v2, **back Jaguar v6 (sin carta)**,
>   tail Nut Throw v10}, Bird {horn Feather Spear v12, **mouth Hungry Bird v8
>   (sin carta)**, back Balloon v2, tail Swallow v2}, Aqua {**horn Anemone v8
>   (sin carta)**, mouth Risky Fish v8, back Hermit v2, tail Shrimp v12},
>   Plant queda fuera del roster (referencia). Ojos y orejas siguen por bando
>   (2 jugador / 4 enemigo) pero siempre con partes reales de la clase.
> - **La decisión clave de este bloque: renombrar las 2 caras huérfanas a su
>   parte real** (preguntado al usuario, eligió "Renombrar a partes reales":
>   Clam Shell era un **cuerno** Aquatic id 6 en agp, nunca existió un lomo
>   "Clam Shell" en el pack; Pigeon Post era un **lomo** Bird id 8). En
>   `axie.js` (PARTS_MVP1): `clam-shell` → **`hermit`** (mismo efecto
>   guard-heal, misma ranura back, la cola Aquatic v2 que ya era de la partida
>   se convierte en EL Hermit del modelo) y `pigeon-post` → **`swallow`**
>   (mismo reposition-ally, misma ranura tail, la cola Bird v2). Se actualizó
>   la lógica de comentarios de App.jsx/App.css y las fichas de diseño
>   (`MVP1vinculodelunacia.md` 3.3/3.4, `BRIEFING-UNITY-3D.md` 5.3/5.4 +
>   HealEffect.cs, `docs/combate-dinamico-dado.md`).
> - **Dato nuevo importante (corrige la nota del bloque anterior): la cobertura
>   real del pack no es uniforme** - ojos y bocas solo tienen las variantes
>	2/4/8/10; el resto de ranuras 2/4/6/8/10/12 (volcado completo del
>   manifest.json por slot/clase). Todas las variantes elegidas existen (Beast
>   back 6, Bird mouth 8, Aquatic horn 8 incluidas), así que `mixer.create`
>   con `strict:true` sigue sin lanzar.
> - **Verificación en vivo** (CDP 9333): recarga con `errcheck` cero
>   problemas; descriptores finales impresos y contrastados (player/enemy de
>   las 3 clases); una tirada real committeó caras (Beast→Imp, Bird→Feather
>   Spear, Aqua→Shrimp) sin errores; 17 canvas en pantalla (2 Lord-dice + 6
>   dados + 8 retina Portrait3D compartido + tablero). `npm run build` +
>   `npm run lint` limpios (45 archivos). Capturas `011-partes-totales.png`
>   (estado inicial) y `012-partes-tirada.png`.
>
> **Las partes del mixer 3D ahora son las partes del dado (sesión 2026-09-12,
> segundo bloque):**
> - **Bug real reportado: "el agua de mi equipo lleva KOI y decimos shrimp en
>   la habilidad".** Los descriptores 3D del roster eran "de clase pura"
>   (`ROSTER_DESCRIPTORS` en `axieGeneCatalog.js`): TODAS las ranuras de una
>   clase usaban la misma variante genérica 2 (jugador) / 4 (enemigo) del pack
>   -la cola Aquatic v2 es un Koi de verdad- mientras las caras del dado
>   (`PARTS_MVP1` en `axie.js`) llevan el NOMBRE real de la parte (Shrimp,
>   Imp, Pumpkin...). Resultado: el modelo 3D y la habilidad no se
>   correspondian. **Fix**: cada cara del dado con nombre pasa a usar la
>   **variante = id real de la parte** en su descriptor (tabla `DIE_FACE_3D`):
>   shrimp tail=12, risky-fish mouth=8, imp horn=4, nut-crack mouth=2 (Nut
>   Cracker), nut-throw tail=10, feather-spear horn=12, balloon back=2,
>   little-branch horn=2 (real: cuerno de Beast), serious mouth=2, pumpkin
>   back=12. Los ids vienen del decoder agp (github.com/ShaneMaglangit/agp,
>   `traits.json` bits->int, cruzados con `PART_GENE` de `axieMixer.js` que ya
>   estaba verificado: shrimp=12, hare=8, hermit=2, balloon=2, imp=4,
>   serious=2...), y todas las variantes usadas existen en
>   `public/assets/axie/manifest.json` (verificado: cada (clase, ranura) tiene
>   los pares 2-12). El fallback sigue siendo 2/4 por bando para ojos/orejas y
>   para las caras cuyo modelo exacto NO existe en el pack: animalejo
>   `clam-shell` (en agp es cuerno, no lomo aquatic) y `pigeon-post` (en agp
>   es lomo, no cola bird) -los dos corren en la variante generica del bando.
>   La tabla agp de traits solo cubre ids pares 2-12; los nombres de ranura de
>   agp no siempre coinciden con los del juego (Nut Cracker vs Nut Crack;
>   tail-nut-cracker id 10 para la cola "Nut Throw").
> - **Verificación en vivo** (CDP 9333): recarga con cero errores de consola
>   (el `mixer.create` con `strict:true` no lanza: todas las variantes
>   referenciadas existen en el pack), `npm run build` + `npm run lint`
>   limpios, captura de pantalla para comprobación visual del usuario. Tanto
>   las cartas como el tablero beben del MISMO `ROSTER_DESCRIPTORS`/`axieUnits`
>   (App.jsx 1539), asi que el fix llega a ambos.
>
> **Energía con sentido + rondas visibles + la mano ahora abre la ayuda real
> (sesión 2026-09-12):**
> - **"El sistema de energía tiene que tener un sentido, no que sea 2 de
>   inicio y cada turno se acumula 1 de energía".** El rediseño intermedio de
>   esta misma ventana (unidad que no atacó = +1 por turno) se descartó tras
>   ese rechazo. Diseño final, confirmado: la Energía sale de las **caras del
>   dado** -cada cara sin golpe que asientas al tirar (guardia de cualquier
>   tipo o reposición, `yieldsEnergy(effect)` en `App.jsx`) da **+1**- y la
>   banca **persiste toda la partida** (tope `ENERGY_CAP=5`, ya no se vacía al
>   cambiar de turno). Dentro de las 8 rondas, guardar para el turno gordo o
>   gastar (2E = +10 al próximo golpe, 2E = +1 casilla, intactos) es una
>   decisión real. El rival también acumula (informativo, no gasta): pasó de
>   sobreescribir a sumar en `passTurn`. El "remate" de 3E (TODO previo) quedó
>   superado de raíz porque el Básico es ya ataque gratuito y explícito en el
>   ActionPad (`hasBasic`/`attackMode`), así que se eliminó `_ENERGY_FINISH_COST`.
>   **Verificado en vivo** (CDP 9333): tirar dados subió el medidor propio
>   0→1→2 a lo largo de dos tiradas, la banca sobrevivió al ciclo completo de
>   turno (antes se resetearía a 0), y el medidor del rival fue 0→1
>   acumulando en su turno. `npm run build` + `npm run lint` limpios (45
>   archivos), cero errores de consola en recarga.
> - **Rondas 1-8**: el reloj ya era de 8 rondas (`TURN_CLOCK = 16` medios-turno;
>   `Hud.jsx` muestra `Ronda X/8`), verificado en vivo ("2/8"). No hizo falta
>   tocar código.
> - **"Cuando pinchas la mano o te pones encima no pasa nada"** (pedido
>   duplicado porque la burbuja de `:hover` no bastó, ver entrada previa): el
>   clic en la mano (`.board-view-hint` en `BoardRegion.jsx`) abre ahora un
>   **panel de ayuda real** (`HelpOverlay.jsx`, componente nuevo): Objetivo
>   (matar al Lord rival), Rondas (8, empate por vida de Lord), Tu turno,
>   Energía (cómo se gana y se gasta, con la mecánica persistente nueva) y
>   Controles. Es UI local de `BoardRegion` (`showHelp`), no toca el estado de
>   partida. Cierra con la ✕ o con clic fuera. El cursor de la mano pasó de
>   `default` a `pointer` (+ anillo de brillo al hacer hover) -ahora SÍ hay
>   una interacción real detrás del clic, ya no se repite el bug del cursor
>   de ayuda. **Verificado en vivo**: clic real abre el panel con sus 5
>   secciones, la ✕ lo cierra, `stillOpen=false` tras el clic.
>
> **Bug real de rendimiento encontrado y arreglado: el renderer 3D
> compartido de las cartas robaba 70-90ms de CADA frame, y por eso el
> arrastre del tablero se sentia con lag (sesión 2026-09-11, tras "se ha
> perdido la fluidez con la que nos moviamos antes en el tablero 3D"):**
> `sharedRenderer3D.js` (el UNICO WebGLRenderer que dibuja las 16 cartas del
> dashboard -8 Portrait3D + 8 Die3D/LordDie3D, para no pasarse del limite de
> contextos WebGL del navegador) hacia, para CADA carta, `setSize` +
> `render` + `drawImage` SEGUIDOS: leer (`drawImage`) el canvas WebGL justo
> despues de renderizar fuerza una sincronizacion GPU->CPU (flush) -con 16
> cartas eso son 16 sincronizaciones seguidas cada frame. **Diagnosticado
> con un trace de Performance real** (`chrome-devtools`, grabado durante un
> arrastre simulado del tablero): el propio `loop()` de `sharedRenderer3D.js`
> aparecia como el bloque de trabajo mas caro de cada `FireAnimationFrame`,
> 70-90ms -pese a que `Board3D.jsx` tiene su PROPIO contexto WebGL aparte
> (nunca se toco ese archivo esta vuelta), el jank se notaba igual porque
> ambos corren en el MISMO hilo de JS: esas sincronizaciones le robaban al
> frame el tiempo que `Board3D.jsx` necesitaba para aplicar el pan. La
> aritmetica cuadraba exacto: 16 cartas × ~5ms de stall ≈ 80ms, el numero
> medido. **Arreglo real**: `sharedRenderer3D.js` reescrito para renderizar
> TODAS las cartas primero, en su propio recuadro fijo (viewport+scissor)
> de un unico canvas-atlas (`TILE_SIZE=200`, `ATLAS_COLS=4`), sin leer nada
> todavia -y solo DESPUES, en una segunda pasada, leer las 16 seguidas: la
> GPU solo se sincroniza de verdad en la PRIMERA lectura de esa segunda
> pasada, las 15 siguientes leen del mismo framebuffer ya resuelto (mucho
> mas baratas). Separar "renderizar todo" de "leer todo" colapsa N stalls en
> ~1. El renderer compartido pasa a `setPixelRatio(1)` (el atlas ya esta
> dimensionado en pixeles de dispositivo a mano; `getSharedPixelRatio()`
> sigue igual para que cada carta sepa a que resolucion crear su propio
> canvas 2D, sin relacion con esto). **Verificado en vivo**: mismo trace de
> Performance, mismo arrastre simulado, ANTES vs DESPUES -promedio de
> `FireAnimationFrame` de ~70-90ms a 7.69ms (los frames siguen sin
> corrupcion visual: capturas confirman las 8 cartas + 8 dados con su icono
> bien colocado tras el cambio). `npm run build` + `npm run lint` limpios,
> cero errores de consola.
>
> **Vuelta atrás definitiva: el icono del dado horneado en la textura 3D,
> como el Lord (sesión 2026-09-11, sexta y última vuelta sobre el mismo
> dado en el mismo día):**
> - **"Como no se va a poder si lo tenemos hecho arriba en el Lord, inserta
>   tal cual las partes en el modelo 3D del dado".** Razon: `LordDie3D.jsx`
>   dibuja su glifo (⚔◉◎♥⬆⧉) con `ctx.fillText` DIRECTO en la textura de
>   cada cara -horneado de verdad, gira con el cubo sin ningun apaño, porque
>   un caracter de fuente sigue siendo nitido tras la minificacion/luz del
>   pipeline 3D (los glifos estan diseñados para leerse pequeños). El
>   intento anterior de esta sesion (un `<img>` plano SUPERPUESTO al canvas,
>   con su rotacion sincronizada a mano por CSS durante el balanceo idle)
>   evitaba el lavado de contraste pero NUNCA estaba genuinamente pegado
>   durante el giro grande de la tirada -el usuario lo noto y pidio volver
>   al mismo mecanismo que ya funciona para el Lord. **Se volvio a hornear
>   el icono en la textura** (`stampIcon` restaurada en `Die3D.jsx`, llamada
>   para las 6 caras -no solo la ganadora, igual que el Lord- dentro del
>   mismo bucle que crea los materiales), con dos mejoras respecto al primer
>   intento horneado de la sesión: (1) color "tal cual" el panel de detalle
>   (`ICON_FILTER` = mismo `sepia/saturate/hue-rotate/brightness` que
>   `--icon-filter` en App.css, no un recolor solido que aplanaba el
>   relieve del PNG); (2) un TRAZO real por debajo (la silueta estampada en
>   anillo, recoloreada a negro solido via `source-atop`, mismo truco que
>   ya se habia probado antes) para que el contorno sobreviva al brillo
>   emisivo plano del material de la cara. Se quito toda la maquinaria del
>   `<img>` superpuesto (`iconRef`, `idleWobble`, el `opacity`/`transform`
>   por frame en `update()`, el `<img>` del `return`) y la regla CSS
>   `.die-3d-icon` (ya sin uso). Efecto secundario BUENO: las 6 caras llevan
>   icono desde el primer render, asi que el dado ya se ve "vestido" con sus
>   partes incluso ANTES de la primera tirada (quejas anteriores de "no
>   aparecen al inicio" quedan resueltas de raiz, no por temporizacion sino
>   porque ya no dependen de ningun estado de tirada).
> - **Verificación en vivo**: cero errores de consola en recarga, antes de
>   tirar (captura confirma icono visible en la cara idle por defecto,
>   ninguna tirada de por medio) y despues de tirar 2 veces distintas
>   (incluida una que aterrizo en "cola", confirmando que el reflejo
>   `FLIP_SLOT.tail` -de la vuelta anterior- sigue aplicandose correctamente
>   sobre este nuevo camino horneado). `npm run build` + `npm run lint`
>   limpios.
>
> **El icono del dado queda REALMENTE pegado al cubo + cursor de ayuda
> confuso arreglado (sesión 2026-09-11, quinta vuelta sobre el mismo dado en
> el mismo día):**
> - **"Por que las partes no estan atacheadas a los dados y giran con ellos,
>   no entiendo".** Pregunta justa: el `<img>` superpuesto (vueltas
>   anteriores) era un sticker plano centrado por CSS -nunca giraba con el
>   cubo, ni siquiera durante el balanceo idle tras aterrizar. Arreglado de
>   verdad en `Die3D.jsx`: el `<img>` ahora tiene un `ref` (`iconRef`) y su
>   `opacity`/`transform` se escriben DIRECTO desde `update()` -la misma
>   funcion que ya mueve el cubo real, frame a frame, mismo patron que
>   `BoardRegion.jsx` usa para el tween de las unidades (sin pasar por
>   re-render de React). Mientras `tumble` o `landing` (spin+settle) estan
>   activos el icono se queda oculto (`opacity:0`) -un `<img>` plano no
>   puede replicar una vuelta de 360° en varios ejes sin verse roto, y esos
>   giros grandes duran ~1.1s como mucho. En cuanto el cubo esta REALMENTE
>   quieto (`landedEuler` fijado) el icono aparece Y su `rotateY`/`rotateX`
>   de CSS replica, frame a frame, la MISMA oscilacion `Math.sin/cos` que ya
>   usa `group.rotation` para el balanceo idle -angulos pequeños (±3-4°), la
>   aproximacion 2D es indistinguible de una rotacion 3D real a esa escala.
>   Resultado: el icono SI gira con el dado en todo momento salvo durante el
>   giro grande de la tirada (donde esta oculto de todas formas, nada que
>   "no se vea pegado"). **Verificado en vivo**: se leyo `el.style.transform`
>   del `<img>` real en dos instantes seguidos -los grados de rotateY/rotateX
>   cambian solos, en vivo, sin ninguna interaccion del usuario, confirmando
>   que sigue el balanceo del cubo.
> - **"La manita arriba, sale una interrogacion pero no hace nada"**: el
>   icono de ayuda (🖐️, antes el texto "Arrastra para mover...") llevaba
>   `cursor:help`, que pinta el cursor del SISTEMA OPERATIVO como una flecha
>   con interrogacion -el usuario lo leyo como parte de la interfaz (un
>   boton roto) en vez de como el aviso nativo de que hay un tooltip al
>   pasar el cursor. Cambiado a `cursor:default`; el `title` (texto completo
>   original) se sigue viendo al pasar el cursor, solo que sin prometer una
>   interaccion que no existe.
> - **Verificación**: `npm run build` + `npm run lint` limpios. En vivo con
>   `chrome-devtools`: cero errores de consola tras recargar y tirar dados;
>   lectura directa del DOM confirma opacity/transform del icono
>   actualizandose en tiempo real sin re-renders de React de por medio.
>
> **Retoque del `<img>` superpuesto del dado + reubicación completa del HUD
> del tablero (sesión 2026-09-11, cuarta vuelta sobre el mismo dado en el
> mismo día):**
> - **El icono superpuesto (recién añadido) tenía dos bugs reales**: (1)
>   tardaba de mas en aparecer -esperaba a que terminara TODA la animacion de
>   aterrizaje (`LANDING_MS=1100` con `setTimeout`) antes de mostrarse, asi
>   que el dado se veia "vacio" un buen rato tras cada tirada (reportado:
>   "ya ni siquiera aparecen al inicio, solo aparecen cuando caen"). Se quito
>   el `setTimeout`/estado `showIcon` entero: ahora es un valor derivado
>   directo de las props (`!rolling && rolledSlot`), visible en el mismo
>   instante en que la tirada hace commit -puede solaparse un instante con
>   el giro final de aterrizaje, mejor que tardar en aparecer. (2) La caja
>   CSS del icono (`.die-3d-icon`) era rectangular (56%×45%) y estaba
>   descentrada (`top:42%`), asi que `object-fit:contain` la encogia de mas
>   y quedaba corrida hacia arriba (reportado: "no esta centrada, el tamano
>   es mas pequeño"). Recalculada con la geometria/camara reales de
>   `Die3D.jsx` (FOV 38°, distancia camara-cara ~2.64, cara de 1.02 de lado
>   → la cara visible ocupa ~56-58% del contenedor por igual en ancho Y
>   alto, la camara es de aspecto 1:1): caja CUADRADA 58%×58%, centrada en
>   `top:46%` (un pelin arriba del centro real, deja aire a la etiqueta de
>   texto pegada abajo en la propia cara). **Verificado en vivo**: captura
>   recortada y ampliada del dado real confirma icono grande, centrado, y
>   visible en el mismo instante del commit de la tirada.
> - **HUD del tablero reubicado entero** ("la energia mia a mi lado y la
>   suya al suyo, abajo no puede estar porque esta lo de seleccionar
>   habilidades especiales, cuidado con ponerlo muy arriba que esta lo de la
>   vision, que no se quede nada encima de lo otro"): los dos medidores de
>   Energía (añadidos la vuelta anterior) pasan de la esquina INFERIOR a la
>   SUPERIOR del tablero -abajo vive el `ActionPad` (selector de ataque
>   Básico/Especial), que no puede compartir hueco. El propio va arriba a la
>   IZQUIERDA (lado de "TU MANDO" en el layout de dos columnas), el del
>   rival arriba a la DERECHA (lado de "ASEDIANTES") -cada uno en su lado,
>   como se pidió. La franja de texto "Arrastra para mover · rueda para
>   zoom..." (`.board-view-hint`), que antes vivía arriba a la izquierda
>   -justo donde ahora va el medidor propio-, se redujo a un icono circular
>   pequeño (🖐️) CENTRADO arriba: el texto completo sigue disponible al
>   pasar el cursor (`title`, con `pointer-events:auto` para que el tooltip
>   nativo funcione pese a que el resto del overlay del tablero es
>   `pointer-events:none`). Resultado: tres elementos en la franja superior
>   del tablero (medidor propio, icono de ayuda, medidor rival) sin que
>   ninguno se pise con otro ni con el `ActionPad` de abajo.
> - **Verificación**: `npm run build` + `npm run lint` limpios. En vivo con
>   `chrome-devtools`: cero errores de consola tras recargar, tirar dados, y
>   seleccionar una unidad (para confirmar que el `ActionPad` de abajo
>   sigue sin chocar con nada). Captura de pantalla completa confirma los
>   tres elementos del HUD superior bien distribuidos y el icono del dado
>   nítido y centrado en las 3 cartas a la vez.
>
> **El icono del dado se convierte en un `<img>` superpuesto + cola boca
> abajo + medidor de Energía por bando (sesión 2026-09-11, tercera vuelta
> sobre el mismo dado en el mismo día):**
> - **"Ponlo igual que las partes que se despliegan debajo, no se ve nada de
>   la forma".** Los intentos anteriores (filtro CSS, luego recolor solido +
>   trazo real, luego subir el tamaño del cubo) seguian perdiendo contra el
>   PIPELINE 3D: el material de la cara suma brillo emisivo plano sobre la
>   textura, y a 50-64px de carta la textura de 512px se reduce >20x antes de
>   llegar a pantalla (el filtrado de minificacion de Three.js promedia con
>   el fondo claro de alrededor) -verificado comparando el icono aislado en
>   un canvas 2D limpio (nitido) contra el mismo icono ya en el cubo
>   (borroso pese a todos los ajustes). El panel de detalle (`FaceRow.jsx`/
>   `PartLogo`) no tiene ese problema porque es un `<img>` de verdad, pintado
>   por el navegador sin pasar por WebGL. **Solucion**: dejar de hornear el
>   icono en la textura 3D (`Die3D.jsx` ya no llama a `stampIcon` -la cara
>   del cubo solo lleva la etiqueta de texto) y superponer un `<img
>   className="face-logo">` de verdad encima del canvas (mismo
>   `--icon-filter` que el panel de detalle, CSS `.die-3d-icon` en
>   `App.css`, `position:absolute` centrado sobre `.die-3d` que ahora es
>   `position:relative`). Solo se muestra cuando el cubo YA aterrizo del
>   todo (`showIcon`, un estado que se arma con un `setTimeout` de
>   `LANDING_MS=1100` -las fases "spin"+"settle" de `startLanding` duran
>   0.55s+0.55s- tras cada commit; mientras gira no hay cara ganadora fija
>   donde anclar un icono plano). **Verificado en vivo**: capturas reales
>   muestran ahora la silueta y el color de la parte con total nitidez
>   -mismo aspecto que el panel de detalle, que era justo el pedido.
> - **Bug real, "la cara de la cola cae boca abajo"**: confirmado con una
>   captura de la textura real (la etiqueta de texto salia arriba en vez de
>   abajo de la cara). Se restauro `FLIP_SLOT = { tail: true }` en
>   `Die3D.jsx` (dibuja esa cara reflejada 180 grados en el canvas 2D) -un
>   comentario de una sesión anterior daba esto por innecesario "con planos
>   individuales por cara" sin haberlo verificado en vivo; no lo era. La
>   razon original para haberlo quitado (que el icono de Pigeon Post
>   quedara al reves) ya no aplica: el icono es ahora el `<img>` superpuesto
>   de arriba, ajeno a la rotacion 3D de la cara.
> - **Medidor de Energía por bando** ("tiene que haber 2, uno para el rival
>   y otro para mi equipo"): la Energia del rival no existia como concepto
>   -la IA no gasta Energia en nada (A3 solo cubre boosts del jugador), asi
>   que se añadio SOLO para mostrarla: `runEnemyTurn` calcula
>   `enemyEnergyGained` (mismo criterio que `rollDice()`, +1 por cara sin
>   golpe de `newRolls`) y lo devuelve; `passTurn()` lo aplica con
>   `setEnemyEnergyBank` en el mismo punto donde ya aplica el resto de la
>   tirada del rival. Nuevo estado `enemyEnergyBank` en `App.jsx` (reseteado
>   en `resetMatch`), pasado a `BoardRegion.jsx` -> dos `<EnergyGauge>`, el
>   propio donde ya estaba (esquina inferior derecha del tablero) y el del
>   rival en la esquina opuesta (inferior izquierda) con paleta roja/rosa
>   (`.energy-gauge.energy-enemy`, mismo acento que el resto de la UI del
>   bando enemigo: `#ff9b94`/`var(--rose)`) para distinguirlos sin leer la
>   etiqueta. El del rival no muestra los gastos armables (+10 golpe/+1
>   casilla no le aplican a la IA todavia) -en su lugar, una nota: "Lo que
>   banco el rival este turno".
> - **Verificación**: `npm run build` + `npm run lint` limpios tras cada
>   cambio. En vivo con `chrome-devtools`: cero errores de consola tras
>   recargar, tirar dados repetidas veces hasta forzar una cola en pantalla,
>   y reiniciar partida. Capturas de las 3 unidades a la vez confirman
>   iconos nitidos y bien coloreados, y los dos medidores de Energia
>   visibles y distinguibles a la vez.
>
> **Formas del dado distinguibles + fondo 2D como un mundo real (sesión
> 2026-09-11, feedback directo del usuario tras la vuelta anterior):**
> - **Dado: el problema real era contraste, no la forma.** Primer intento
>   (equivocado, revertido en la misma sesión): pensar que dos caras sin
>   relacion (Nut Throw/Shrimp/Pigeon Post, las 3 "cola") compartiendo el
>   emblema generico de `slotIcons.js` era la causa, y cambiar `Die3D.jsx` a
>   renderizar la parte 3D real por clase+ranura (`partIcon3D.js`). El usuario
>   aclaro la causa real: "el problema es el color, lo que no se aprecia es el
>   contorno, no destacaba sobre el dado, quiero las formas de antes pero que
>   se vean" -asi que **se revirtio** a `SLOT_ICON_URL` (el emblema oficial de
>   marketplace, `slotIcons.js`) como origen del icono, sin tocar mas esa
>   parte. El fix real fue en `stampIcon` (`Die3D.jsx`): antes el icono se
>   pintaba con `ctx.filter = 'sepia()...'` sobre el PNG original -un filtro
>   CSS cuyo resultado dependia del sombreado propio de cada PNG, y ese marron
>   final podia quedar demasiado parecido al marron de la vineta de detras
>   (perdiendo el contorno contra su propio fondo). Ahora el icono se
>   RECOLOREA a un solido plano (`source-atop` sobre un lienzo aparte, alpha
>   del PNG original conservada) con un TRAZO real (la silueta estampada 12
>   veces en anillo, desplazada unos pixeles, recoloreada aparte a
>   `ICON_OUTLINE_COLOR`) compuesto debajo del relleno (`ICON_SOLID_COLOR`) -un
>   borde de verdad, no una sombra difusa. **Bug real encontrado a mitad de
>   la sesión** (visto comparando el icono aislado en un canvas 2D limpio,
>   nitido, contra el mismo icono ya en el cubo 3D, borroso): el material de
>   la cara (`MeshStandardMaterial`, `emissive:0xffffff, emissiveIntensity:
>   0.18` -mismo material que el bisel, pedido de otra sesion "que brille
>   mas") suma brillo PLANO sobre toda la textura, icono incluido, asi que un
>   marron "normal" perdia la mitad de su contraste antes de llegar a
>   pantalla; los colores del icono bajaron a casi negro
>   (`ICON_SOLID_COLOR=#1A1108`, `ICON_OUTLINE_COLOR=#000000`) para
>   compensar. Se quito tambien el `shadowBlur` que habia sobre el trazo (bug
>   real: el trazo YA es un borde duro, la sombra encima solo lo volvia a
>   difuminar). Por ultimo, el dado de unidad crecio de `size=50` a `size=64`
>   en `UnitCard.jsx` -a 55px de canvas la textura de 512px se reduce >20x
>   antes de llegar a pantalla (mas el filtrado de minificacion de Three.js
>   promediando con el fondo claro de alrededor), asi que mas resolucion
>   fisica real ayuda directamente donde el color ya no puede compensar mas.
>   **Verificado en vivo**: el icono aislado en un canvas 2D limpio (sin
>   pasar por el cubo 3D) sale nitido con trazo negro solido -confirma que el
>   dibujo en si es correcto; capturas del cubo real tras cada cambio
>   (recolor solido -> quitar shadowBlur -> subir tamaño) muestran mejora
>   progresiva y verificable en la nitidez final.
> - **Fondo 2D de Lunacia, rediseño completo ("que parezca un campo de
>   verdad, un mundo, Kenney tiene ecosistemas completos, lo que hay ahora son
>   3 arboles y 2 setas mal puestas").** En vez de bajar un pack 2D nuevo, se
>   reaprovecha el ecosistema Kenney que YA esta instalado para el tablero 3D
>   (Platformer Kit + pack Mini Forest, ambos CC0, `public/models/`):
>   `src/backdropSprite3D.js` (modulo nuevo, mismo patron que `partIcon3D.js`
>   pero SIN recolorear -conserva el material/textura real del `.glb`, el
>   `colormap.png` compartido se resuelve solo por ruta relativa) renderiza 13
>   especies (`tree-pine`, `tree-pine-small`, `mini-forest/tree`,
>   `mini-forest/tree-high`, `mini-forest/plant`, `flowers`, `mushrooms`,
>   `rocks`, `mini-forest/rocks-high`, `mini-forest/rocks-low`,
>   `mini-forest/stones`, `fence-low-straight`, `crate`) a PNG, cacheadas por
>   URL. `LunaciaBackdrop.jsx` las coloca en 43 posiciones organizadas en
>   CLUSTERS con intencion narrativa (arboleda arriba -> roquedal con setas a
>   su sombra -> prado de flores -> borde de aldea con valla y cajones, a los
>   dos lados del tablero) en vez de puntos sueltos al azar, con `flip`
>   (espejo horizontal) en la mitad de las instancias repetidas para que la
>   misma especie no se vea como una fotocopia. Las 9 PNG antiguas
>   (`src/assets/backdrop/tree-*.png`, `mushrooms.png`, `fence-*.png`,
>   `rock.png`) se quedan en el repo sin usar (mismo criterio que otros
>   puentes descartados: referencia rapida si hiciera falta volver atras);
>   `grass-plain.png`/`grass-flower.png` (la textura de suelo tileada) siguen
>   en uso, no son props. **Sigue siendo cierto que el fondo solo se ve en los
>   margenes** (fuera del `max-width:1680px` de `.app` en pantallas anchas,
>   mas los 14/20/12px de padding y algun hueco interno sin fondo opaco, como
>   el panel de detalle vacio) -eso no cambio esta sesión, es una limitacion
>   de espacio del layout de escritorio, no del fondo en si. **Verificado en
>   vivo**: recarga completa, cero errores de consola, las 43 imagenes
>   montadas tras ~1.5s (carga async de 13 `.glb`), captura confirma arboleda/
>   roquedal/prado/aldea reconocibles en las 4 franjas visibles (arriba,
>   abajo-izq, abajo-der en ambos lados).
> - **Verificación**: `npm run build` + `npm run lint` limpios tras cada
>   cambio (3 pasadas: iconos de dado, fondo, ajuste de contraste). En vivo
>   con `chrome-devtools`: cero errores de consola en recarga + tirada +
>   seleccion de unidad + reinicio.
>
> **"Mover no gasta la accion" + ActionPad + iconos de dado mas grandes + Axie
> sobre terreno (sesión 2026-09-11, trabajo en paralelo con opencode,
> retomado y verificado por esta sesión — Claude Code):**
> - **REDISENO grande, ya estaba hecho al retomar la sesión (no documentado
>   hasta ahora):** mover una unidad YA NO gasta su acción — se queda
>   seleccionada tras moverse y el siguiente click decide el ataque, **Básico
>   o Especial** (botones nuevos en `ActionPad.jsx`, que sustituye a
>   `ActionBar.jsx` — borrado). Campo nuevo `unit.moved` (`App.jsx`,
>   `makeUnit`): true = ya se movió este turno, solo puede atacar. Caras de
>   guardia/reposición ya NO dan el básico como respaldo automático
>   (`attackTargetsForFace` — antes lo hacían, y "ponerse en guardia" acababa
>   pegando con el básico sin que el jugador lo eligiera); ahora el básico es
>   una opción explícita (`hasBasic`/`hasSpecial`/`attackMode` en `App.jsx`,
>   botones "Básico"/"Especial: <cara>" en `ActionPad.jsx`). Si una unidad se
>   queda sin nada útil que hacer (no puede moverse más y no tiene objetivo ni
>   básico ni especial) se le acaba el turno sola (`unitCanAct`/`endUnitTurn`)
>   en vez de quedar seleccionable y atascada — mismo patrón para el Lord
>   (`lordCanAct`/`endLordTurn`/`selectLord`). La IA (`decideUnitAction`,
>   `runEnemyTurn`) sigue la misma regla: prueba el especial de su cara
>   tirada primero, si no hay objetivo cae al básico explícito. **Bug real
>   encontrado y arreglado al retomar la sesión**: en
>   `applyUnitAttackLocal`, `relation` se usaba (en un float de "Ventaja"/
>   "Desventaja" nuevo, ver abajo) ANTES de estar declarada más abajo en el
>   mismo bloque — `ReferenceError` de TDZ que hacía fallar EN SILENCIO todo
>   ataque de unidad (capturado por el try/catch de React o perdido en la
>   consola sin log claro). Se movió la declaración de `relation` arriba,
>   antes de su primer uso.
> - **Animaciones de combate nuevas**: anillo de impacto + sacudida del
>   tablero (`impacts`/`pushImpacts`, `IMPACT_MS=650`, clase `.board-shake`
>   en `.board-scene` + `.impact-ring` por celda en `BoardRegion.jsx`) en el
>   golpe primario, el contragolpe y el ataque del Lord; float de "Ventaja"/
>   "Desventaja" sobre el atacante cuando el triángulo de efectos (A1)
>   aplica, visible en el golpe real (antes solo se veía en la preview del
>   intercambio).
> - **Punto 1 de esta sesión — iconos/emojis del dado más grandes y
>   destacados**: `Die3D.jsx` (unidades) agranda el hueco del icono (88×64→
>   92×66 en base 100, `inset` 0.9→0.97) y la viñeta/sombra que lo despega
>   del fondo; `LordDie3D.jsx` (Lord) sube el glifo de `K*34` a `K*52`,
>   recentrado con `textBaseline:'middle'` (con `'alphabetic'` un emoji
>   grande se recorta) y con la misma sombra de despegue. **Verificado en
>   vivo** (`chrome-devtools`, capturas de las cartas con dado ya tirado):
>   los iconos ocupan visiblemente más hueco de la cara sin salirse.
> - **Punto 2 — el terreno ya no tapa al Axie**: `Board3D.jsx` calcula
>   `cellTop`/`topAt(r,c)` = la altura REAL de la tapa de cada celda tras
>   apilar su decoración (tierra/roca/obstáculo/laguna) encima del bloque de
>   césped, y los Axies (`positionHandle`, tween incluido — `toY`/`fromY`/
>   `toRingY`/`fromRingY`) se asientan sobre esa altura en vez de sobre
>   `baseHeight` a secas (bug real: la pieza de tierra tiene grosor y su tapa
>   quedaba por encima de los pies del Axie). Se expuso un hook de debug
>   `window.__boardDebug` (`topAt`, `handles()`) para esta verificación.
>   **Verificado en vivo**: se movió una unidad a una celda de tierra
>   (`topAt=1.223`) y su Y real quedó en `1.362`, por encima — confirmado
>   también por captura (el Axie se ve completo sobre el parche marrón, no
>   hundido).
> - **Punto 3 — fondo 2D de Lunacia "fuera del canvas"**: verificado, YA
>   estaba correctamente fuera del lienzo 3D desde una sesión anterior
>   (`LunaciaBackdrop.jsx`, capa 2D de DOM aparte, `position:fixed;
>   z-index:-1`, HERMANA de `.board-col` en el árbol, nunca dentro de
>   `board3d-host`) — el `WebGLRenderer` de `Board3D.jsx` usa `alpha:true`
>   sin `setClearColor`, así que el margen transparente del canvas alrededor
>   de la isla deja ver el fondo 2D por debajo. Confirmado en captura: se ve
>   el pueblo/bosque de Kenney recoloreado en las esquinas y márgenes del
>   layout con el `topbar` y las columnas nuevas. No hizo falta tocar código
>   para este punto. Si se quiere MÁS presencia del fondo tras el layout
>   compacto de la sesión anterior (los porcentajes de `DECOR` en
>   `LunaciaBackdrop.jsx` estaban pensados para un layout más ancho), queda
>   como retoque visual pendiente, no un bug.
> - **Refactor de renderizado del overlay**: la matriz 3D→CSS del tablero
>   (`board-overlay-3d`) ya NO viaja por estado de React
>   (`board3dMatrix`/`onTransform`, eliminados) — `Board3D.jsx` la escribe
>   DIRECTO sobre el nodo DOM vía `overlayElRef` (pasado desde
>   `BoardRegion.jsx`), sin re-render de React en cada frame de cámara.
> - **Verificación**: `npm run build` + `npm run lint` limpios sobre TODO lo
>   de arriba junto (no solo los edits 1 y 2). Verificación en vivo con
>   `chrome-devtools` sobre `npm run dev`: cero errores de consola tras
>   tirar dados, mover una unidad sobre tierra, ver el ActionPad con
>   Básico/Especial, y reiniciar partida. El navegador headless de
>   `chrome-devtools-mcp` había quedado colgado de una sesión anterior
>   (`--remote-debugging-pipe` roto) bloqueando el perfil; se mató el
>   proceso (`msedge.exe` con `--user-data-dir=...chrome-devtools-mcp...`)
>   y se reconectó sin tocar nada del proyecto.
>
> **Legibilidad del turno rival + leyenda + lag del arrastre (sesión 2026-09-11):**
> tres pedidos explícitos del usuario, todos verificados con clicks reales en
> `chrome-devtools` sobre `npm run dev` (además de `npm run build` + `npm run lint`
> limpios, y cero excepciones de consola en reload + turno completo + drag):
> - **Turno rival más lento y secuencial**: `ENEMY_ROLL_MS` 750→**1150** y
>   `ENEMY_STEP_MS` 420→**900** (App.jsx). Cada paso de `runEnemyTurn` lleva ahora
>   el campo `actor` (`stepFrom(mark, markFx, actor)`: unidad o `'lord-enemy'`), y
>   `passTurn()` lo publica en el estado `enemyActing` ANTES de la pausa del paso,
>   así el jugador ve "quién va a actuar" durante la pausa y después ve la acción.
>   En el tablero se pinta un **halo blanco pulsante** (`.unit.acting`/
>   `.lord-unit.acting` + `@keyframes acting-pulse` en App.css) sobre la unidad
>   rival o el Lord rival que está actuando — confirmado en vivo con el trace del
>   test: la secuencia salió e0 → e1 → e2 → lord-enemy, cada una ~1 s, en vez de
>   aplicar todo de golpe.
> - **Leyenda de terreno ELIMINADA** del tablero (pedido del usuario: "quita la
>   leyenda de tipo de casilla"). Se quitó el render `<TerrainLegend />` y su
>   import en `BoardRegion.jsx` (y la prop `showDashboard` que quedó huérfana);
>   el componente `src/components/TerrainLegend.jsx` se queda en el repo sin uso.
> - **Lag al arrastrar la vista isométrica**: la causa era que `onPointerMove`
>   de `Board3D.jsx` aplicaba CADA evento de ratón del drag con su `panWorldPixels`
>   (`render=true`): a la tasa de polling de un ratón gamer (cientos de eventos por
>   segundo) eso era cientos de renders del escena 3D + reescrituras de la matriz
>   CSS del overlay por segundo, más el bucle rAF de 60 fps encima. Ahora el
>   desplazamiento del drag se **coalesce**: `onPointerMove` acumula
>   `pendingX/pendingY` y el `loop()` los aplica UNA vez por frame. Medido en vivo
>   con 40 `mouseMoved` reales (CDP Input) + inercia: 43 escrituras de matriz en
>   ~1 s (≈1/frame) donde antes eran ≥ N eventos de golpe.
>
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
