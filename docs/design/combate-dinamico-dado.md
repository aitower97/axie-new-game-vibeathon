# Combate dinámico y la integración del dado
## Estudio profundo de mecánicas de *Fire Emblem* y *Yu-Gi-Oh! Dungeon Dice Monsters* aplicadas a Vínculo de Lunacia

**Documento de trabajo · Versión 2.0 · 9 de septiembre de 2026**
**Estado:** investigación terminada y propuesta detallada. **Fase A (sección 7.1:
A1, A2, A2.3, A3, A5) implementada el 10 de septiembre de 2026** — ver la nota de
estado en `CLAUDE.md` para el detalle de que archivo/función cubre cada pieza y qué
se dejó fuera a propósito (A4, A6, el "remate" de 3 Energía). No decidido: los
apartados de diseño con valores marcados *(prov.)* se validan en playtest; los
valores tal cual quedaron implementados son los de este documento (30 escudo de
Muro, +10/+20/+15 de los distintos bonus, etc.), sin cambios.

**Relación con el resto del repo:**
- `MVP1vinculodelunacia.md` — reglas decididas del MVP1. Esta propuesta **no las
  sustituye**; propone en qué orden evolucionarlas.
- `src/axie.js` — el dado y los efectos (código real actual).
- `src/App.jsx` — el combate (movimiento, zona de control, alcance, ataque, turnos).

---

## Índice

1. Objetivo, alcance y preguntas
2. Metodología y fuentes
3. Parte I — Fire Emblem: anatomía del combate
4. Parte II — Yu-Gi-Oh! Dungeon Dice Monsters: el dado como economía
5. Parte III — Vínculo de Lunacia a día de hoy (estado real en código)
6. Parte IV — Síntesis: el "tratado" de integración
7. Parte V — Hoja de ruta de implementación
8. Parte VI — Métricas de éxito, riesgos y playtest
9. Glosario
10. Fuentes

---

## 1. Objetivo, alcance y preguntas

### 1.1 Pregunta central

> ¿Qué mecánicas concretas de *Fire Emblem* y de *Yu-Gi-Oh! Dungeon Dice Monsters* se
> pueden integrar a nuestro dado —cuyas caras son las partes del cuerpo del Axie— para
> que la partida sea **super dinámica, divertida y competitiva**, sin romper el eje del
> juego ("la cara dice qué puedo hacer este turno, no cuánto pego")?

### 1.2 Objetivos operativos de la investigación

1. Extraer de cada juego las mecánicas que **crean la sensación** deseada (tensión,
   lectura del rival, riesgo/recompensa, remate, comeback) y no solo las que añaden
   números.
2. Traducir cada mecánica a **las piezas que ya existen** en nuestro juego
   (recogiendo del tablero 8×7, zona de control, los cuatro tipos de terreno, el dado de
   6 caras, los efectos golpe/perforar/guardar/impulso/invocación, el Lord y su válvula
   de invocación, el reloj de 12 turnos).
3. Producir una propuesta **implementable por fases**, con valores provisionales,
   casos de uso concretos y un orden de pruebas.
4. Marcar con honestidad qué es copia declarada (FE/DDM) y qué es original nuestro.

### 1.3 Lo que NO se investiga aquí

- No se investiga el mercado ni la visión de producto (ya están en `docs/`).
- No se investiga la integración on-chain ni la real de genomas (fuera del MVP1).
- No se inventan números de Axie reales (los del catálogo están en `MVP1` sección 3).

---

## 2. Metodología y fuentes

### 2.1 Método

1. Búsqueda documental sobre **Fire Emblem** con foco en: sistema de batalla por turnos,
   triángulo de armas (todas las versiones), el *break* de Engage, follow-up attacks,
   combat arts, terreno defensivo, cebo/baiting, zona de peligro y comportamiento de la IA.
2. Búsqueda documental sobre **Yu-Gi-Oh! Dungeon Dice Monsters** (reglas oficiales
   Mattel, guías GBA de GameFAQs, Yugipedia): crests, seis caras del dado, invocación por
   nivel, costes de movimiento, defensa por pago, items de magia/trampa, el Die Master.
3. Contraste con juegos de dados modernos (**Dice Throne**, **Roll for the Galaxy**) para
   entender el patrón probado de *mitigación del azar* (rerroll, banco de acciones) y las
   decisiones de diseño que conviene copiar o evitar.
4. Lectura del estado real del juego (`MVP1`, `src/axie.js`, `src/App.jsx`) para aterrizar
   cada propuesta en la estructura de código existente.

### 2.2 Fuentes principales

| Tema | Fuente |
|---|---|
| Triángulo de armas, Tria Attack, Follow-Up | Fire Emblem Wiki (fireemblemwiki.org) |
| *Break* de Engage y análisis táctico | GameSpot (análisis de Engage), Serenes Forest, GameFAQs *Battle Basics* (Engage) |
| Combate clásico (mit/def/velocidad/crítico) | IGN Wikipedia de *Fire Emblem* (Battle System) |
| Reglas DDM (físico) | Manual oficial *Mattel Starter Set* (DDM) |
| Crests, niveles, costes (GBA) | Guías de GameFAQs (TymaHughes, shaeki, Civ_Magirus) |
| Lore/reglas del juego en la obra | Yugipedia (*Dungeon Dice Monsters*, *Crest*) |
| Mitigación de azar en dados | BGG/Wikipedia *Dice Throne*; reglas *Roll for the Galaxy* |

---

## 3. Parte I — Fire Emblem: anatomía del combate

### 3.1 Qué es el combate en FE

FE es un táctico por turnos donde el combate entre dos unidades **se resuelve solo** tras
declararlo: lo que el jugador controla es la **decisión de entrar**, no la ejecución del
golpe. La fórmula de golpe (simplificada y por juego) combina:
- **Poder (might/attack)** vs defensa: el daño base del arma.
- **Precisión (hit)** vs evasión (avoid, calculada con Spd y Luck): probabilidad de acertar.
- **Velocidad (Spd):** si superas la del rival por un umbral, **doblas** (follow-up).
- **Crítico (crit):** probabilidad de multiplicar el golpe (×3 en la mayoría de títulos).

Conclusión de la investigación: **lo competitivo no está en la fórmula, está en el
intercambio**. FE es un juego de *economía de intercambios*: cada ataque declarado es un
contrato *"yo recibo esto, tú recibes esto de vuelta, y a veces no hay vuelta"*.

### 3.2 El turno: iniciativa y orden

- Los bandos alternan turnos completos (todas tus unidades, luego todas las suyas).
- En tu turno puedes mover a cada unidad **una vez** y en cualquier orden; la unidad
  "lenta" define los destinos (mueve antes), la "rápida" aprovecha huecos que se abren.
- **La iniciativa es del jugador que ataca**: *si atacas tú, decides el momento*; si el
  rival llegó primero a tu zona, es él quien decide. Toda la tensión de posición es
  gestión de *quién tiene la iniciativa*.

**Traducción a nuestro juego:** ya compartimos turno completo por bando y orden libre.
Hoy no hay nada que "ganar" al entrar primero, salvo el daño; el intercambio (apartado
5.2) añade esa segunda moneda: la iniciativa se cobra solo si atacas con ventaja.

### 3.3 El intercambio (exchange) y el contragolpe

La regla que cambia todo en FE:

1. Declaras ataque contra un rival **en tu alcance**.
2. **Se resuelve tu golpe** (daño o fallo).
3. **Si el rival sobrevive y te alcanza**, **contraataca** (una vez, aun muriendo
   después: "la última palabra es del moribundo").
4. La **velocidad** decide si alguien golpea dos veces (follow-up), con la paradoja de
   que un rival rápido que sobrevive puede doblarte a ti en su contragolpe.

**Cómo se siente:** *entrar a pegar gratis no existe*. Leer el preview (daño que darás /
daño que recibirás + % de acierto) antes de confirmar es la rutina mental que convierte
cada turno en un cálculo de riesgo.

**Qué hace gracias a esto el Bird/arquero:** los ataques a distancia casi nunca reciben
contragolpe (el rival no le alcanza). En FE el arquero es débil cuerpo a cuerpo pero
"rompe la iniciativa" porque dispara sin pagar la vuelta. (Juego con nuestro problema:
el Bird hoy es el chasis más flojo del playtest según las señales del MVP1.)

**Qué hace gracias a esto el tanque:** aceptar el intercambio en tu turno para *recibir*
menos y forzar al rival a gastarse — el *trade favorable*.

### 3.4 El triángulo de armas: de bonus a "rotura"

**Origen (Genealogy of the Holy War, 1996):** Espada > Hacha > Lanza > Espada. El bando
con ventaja recibe bonus de golpe/daño y el perdedor penalizaciones. A lo largo de los
juegos el tamaño del efecto varía (±10 hit / ±1 Mt, o ±20 % de Atk en *Heroes*).

**El giro de Engage (2023):** el triángulo **deja de sumar números**. Ahora:
- La ventaja **solo se materializa al iniciar el combate** (no en el contragolpe).
- Si causas daño teniendo ventaja, **rompes (break)** al rival: **suelta su arma y no
  puede contraatacar** durante el resto del skirmish y la **siguiente acción del turno**.
- Unidades blindadas (armor) son **inmunes al break** — tienen una forma de no entrar
  en el ciclo.
- (Detalle: algunas skills como Tetra Trick rompen varios tipos de arma a la vez; Qi
  Adepts pueden romper cualquier tipo).

**Por qué es brillante (y qué copiamos):**
1. Da a la "piedra-papel-tijera" una **consecuencia estratégica** (niego tu turno) en vez
   de un número.
2. Crea **toma de decisiones de equipo**: necesitas cobertura para que no te rompan la
   pieza que contrarresta al rival.
3. Convive con la confirmación de remates: el *break* es la herramienta para **cobrar el
   kill sin pagar la vuelta** — el corazón del estilo "killbox" del juego.

**Lo que NO copiamos:** la inmunidad de los blindados (en nuestro juego sería una clase
en la que el triángulo no aplica; añade fricción sin ganancia detectada en el MVP1).

### 3.5 Follow-up attacks (el doble golpe)

Regla del tutorial oficial: *si tu Spd es 5 o más que la del rival, puedes atacar dos
veces*. Es la forma de **castigar el overextend**: una unidad fuera de posición y más
lenta recibe el doble pago por el mismo hueco.

**Traducción:** en nuestro dado, el "follow-up" natural **no es velocidad sobre la
otra**, es el **banco de Energía** (5.3): gastar para que un golpe duela más o llegue
más lejos es nuestra versión de "sé más rápido que tú gastando mejor".

### 3.6 Combat arts y habilidades activas

*Three Houses* introdujo **combat arts**: habilidades activas con coste de "usos" que
cambian el golpe (más alcance, back-off tras pegar, romper defensa, crítico +). Cada arte
tiene efecto y usos limitados. *Engage* añadió *sync skills* (pasivas tipo "Canto: mover
después de atacar") y *engage skills* (abalanzar el turno de una unidad).

**Qué aportan a la dinámica:** son **palancas puntuales** que el jugador decide cuándo
soltar. Sin ellas, el combate por turnos tiende a la repetición "muevo, golpeo".

**Traducción:** nuestras 12 partes del MVP1 ya son "combat arts" (cada cara es una
habilidad activa de la parte). La Fase B (Ascensión exprés) añade la **palanca temporizada
por partida** equivalente al *engage meter*: ataca/recibe para llenar un medidor y, cuando
está lleno, evolucionas una parte **durante la partida** (reescribes esa cara con +1).

### 3.7 Exámenes de terreno y defensa posicional

- FE tiene **terreno defensivo**: fortalezas (+Def), maleza (+Avoid), zonas que curan.
- **Obstáculos** (muros, pilares) reducen los lados vulnerables: una unidad arrinconada
  contra un muro solo puede ser golpeada por las casillas libres.
- La guía táctico de Engage insiste en dos gestos de jugador experto:
  1. **Cebo (baiting):** sitúa una unidad *justo al borde* de la zona de peligro del
     rival para que la IA/el oponente avance y tú mates al que entró en tu turno.
  2. **Ladearse a su ruta de retirada:** usar la zona de control para que la retirada
     del rival no exista.

**Traducción:** nuestro terreno hoy es **solo coste** (peaje). El apartado 5.5 añade el
**premio por ocupar** y el **refugio** (Lomo detrás de obstáculo), sin tocar piedra/agua.

### 3.8 La IA y la señal de retención

Dato clave de las guías de *Engage*: **muchas IA no avanzan si no pueden atacar** — es la
palanca que hace funcionar el cebo. El jugador experto lee `retención de movimiento` como
información (si se queda, lo estoy disuadiendo; si avanza, me regala la iniciativa).

**Traducción:** nuestra IA mínima del MVP1 ya tiene 4 prioridades; se puede añadir la
quinta: *si está bloqueada hacia el Lord y puede comer una rotura, se retiene en vez de
atacar* (apartado 5.6: reescritura de la IA).

### 3.9 Resumen "qué robar de FE"

| Mecánica | Qué hace por el juego | Riesgo al portar |
|---|---|---|
| Intercambio de dos golpes con preview | Cobra precio por entrar; la decisión se vuelve legible | Puede frenar el ritmo si el preview se traduce en micromanagement |
| Rotura (break) | Da consecuencia al triángulo; permite killbox sin pagar | Puede hacer que un solo 0 defensivo gire la partida; mitigado por 12 turnos |
| Triángulo **sobre efectos existentes** | No añade buttons nuevos; el jugador ya tiene el vocabulario en su dado | Requiere que el dado rival sea visible (info pública, como el arma) |
| Terreno defensivo | Posicionarse recompensa | Con 4 unidades y 8×7, dos casillas "buenas" pueden crear fortaleza inexpugnable → solo en casillas de coste (pradera/obstáculo) |
| Cebo/implementación de IA con retención | El tablero se lee, no se recorre | La IA hay que ajustarla para PvE equilibrado |
| Barrel de agente: Ascensión exprés (meter) | Momento de espectáculo + sinergia con el pitch | Fase B, no ahora |

---

## 4. Parte II — Yu-Gi-Oh! Dungeon Dice Monsters: el dado como economía

### 4.1 El juego en una frase

DDM es un táctico sobre **una mazmorra construida con dados**: cada dado contiene un
monstruo, cada cara del dado es un *crest*, y los crests de la tirada se gastan para
llevar a los monstruos hasta el **Die Master** (el corazón) del rival.

### 4.2 Materiales y setup

- Cada jugador tiene un **pool de 15 dados** (en el manga: 12). El pool decide tus
  opciones: dados cargados de inflamables crests de movimiento, dados trampa, dados con
  monstruos de nivel alto.
- El **Die Master** se coloca en un **dungeon** de 4 casillas propio; la partida se gana
  cuando el Die Master rival pierde sus **3 corazones**.
- Los dados **se despliegan como dimension** al invocar: el dado se "abre" formando una
  de diez figuras de camino (el dungeon dice), que conecta con tu dungeon y luego con el
  del rival. **Los monstruos solo se mueven por caminos construidos.**
- Código de color por tipo: Rojo Dragón, Verde Bestia, Azul Guerrero, Blanco Lanzador de
  Magia, Amarillo No-muerto; los dados negros contienen habilidades especiales.

### 4.3 El dado: 6 caras = 6 crests

| Crest | Icono (GBA) | Función |
|---|---|---|
| **Summon** | Estrella roja | Invocar monstruos; también coste de habilidades |
| **Movement** | Flecha naranja | Mover 1 casilla por crest; los voladores pagan 2/casilla |
| **Attack** | Espada blanca | Un ataque por crest; un monstruo ataca una vez por turno |
| **Defense** | Escudo con cruz negra | Reducir el daño (DEF del monstruo) al ser atacado |
| **Magic** | Pentágono azul | Coste de efectos mágicos (curar, resucitar…) |
| **Trap** | X verde | Coste de trampas (doblar coste de movimiento, destruir zona…) |

Los crests **no se pierden al acabar el turno**: se guardan en la **crest pool** (cuenta)
y se gastan cuando toca. *DDM es un juego de banca de recursos, no de azar.* Cada tirada
es un sueldo.

### 4.4 La tirada y la primera decisión

- Se tiran **3 dados** por turno (regla *Double Dice* de la versión EN: se tira dos veces
  y te quedas con todo, pero solo haces **una** invocación).
- Si salen **2 crests de summon**, puedes invocar **un** monstruo de nivel igual al de
  los crests. Si salen **3 del mismo nivel**, por *Triple Summoning* puedes invocar un
  monstruo **un nivel mayor**.
- El nivel de un monstruo = **número de crests de summon en su dado**: L1 tiene 4 caras
  de summon (barato, débil), L4 tiene 1 (caro, brutal). **Casi toda la estrategia del
  juego está en qué nivel eliges cargar tu pool.**
- Las caras que no son summon se añaden a la **crest pool** para el resto del turno.

### 4.5 Invocar (dimension) y la maquinaria del mapa

- Al invocar eliges **dónde desplegar el dado-camino** (dimension): una de diez figuras
  de camino que debe conectar con tu dungeon y luego con el campo rival.
- **Avanza por el camino:** los monstruos se mueven solo por caminos; los voladores
  ignoran peajes o pagan doble (según versión).
- El objetivo final es que **tu camino conecte con el del rival**: entonces tus
  monstruos pueden llegar hasta su Die Master.

**Conclusión clave para nosotros:** en DDM la victoria es **estructural**: no ganas por
DPS, ganas por *control del camino*. La profundidad nace de que **los caminos se
construyen con los dados que invocas** — el mismo objeto que da el monstruo construye su
ruta. (Nuestra analogía: el dado que invoca es el mismo que peleará — la reserva no es
decorativa, es el "dungeon" en el que se gasta la cara.)

### 4.6 El combate: atacar cuesta, defender cuesta

- Para atacar necesitas **1 crest de ataque** (más si el monstruo ataca dos veces).
- El defensor decide si gasta **1 crest de defensa**: si lo hace, se resta su DEF al ATK
  del atacante. **Si no tiene crest de defensa, el golpe entra entero.**
- Monstruos voladores solo pueden ser atacados por voladores o por la habilidad
  "puede atacar a voladores".

**Cómo se siente:** la defensa es una **decisión de recursos**, no una tirada. Cuando el
rival te ataca recuerdas "¿le quedan crests de defensa?": la información de *cuánto puede
pagar* es pública y táctica. (Familiar: es la misma pregunta que hace FE con "¿podrá
contraatacar?" — y la que nuestro intercambio A2 pone en la mesa.)

### 4.7 Magia y trampa: las respuestas del dado

Hay **10 dados de item** (magia/trampa), p. ej.: *Declaration of Despair* (destruye
crests de summon del pool rival), *Gluminizer* (todos pagan doble al mover), *Resurrection
Scroll* (resucita), *Warp Vortex* (teletransporta), *Crater Creator* (destruye el campo).

**Qué aportan:** convierten el azar de la tirada en **herramientas de reacción**. El
jugador no solo acumula crests ofensivos: decide si su dado lleva una trampa para el que
le empuje. (Abre directamente la puerta al diseño de **ojos/orejas** como caras de
utilidad en nuestro MVP2.)

### 4.8 Qué hace adictivo a DDM (síntesis táctica)

1. **El turno tiene tres fases y tres decisiones**: qué dados cargo, qué invoco/dimensiono,
   qué gasto en esta unidad. Nada de "tirar y rezar".
2. **El nivel del monstruo es el equilibrio**: un eslabón poderoso casi no trae crests de
   apoyo; "más corazón" cuesta "más gasolina".
3. **El azar se banca:** guardar crests para el turno gordo es la cumbre del skill.
4. **La defensa es activa:** puedo hacer algo con lo que tengo cuando me atacan.

### 4.9 Resumen "qué robar de DDM"

| Mecánica | Qué hace por el juego | Riesgo al portar |
|---|---|---|
| Banca de crests (guardar para el turno gordo) | La tirada mala se gestiona: agencia sobre el azar | Sin tope, puede acumularse algo opresivo → banco que se vacía cada turno propio (5.3) |
| Invocación por nivel (Triple Summoning) | Invocar es una decisión con coste, no una lotería | Puede poderificar si el pool es plano → redeﬁnirlo con el "oro" de la reserva |
| Coste por acción (mover/atacar cuesta crests) | Cada acción tiene oportunidad | Es una regresión si ya tenemos x10 y presupuesto de movimiento; se aplica solo al banco extra |
| Defensa activa (pago de crests) | El defensor decide | Ya lo tenemos en las caras de guardia; no doblar sistemas |
| Caras de utilidad (magia/trampa) | Respuestas sin ser ataques | Fase B: entran en ojos/orejas |
| Lord = corazón del mapa | Victoria estructural, no numérica | Ya lo tenemos (Lord inmóvil + reserva); reforzar el "camino" (5.4) |

---

## 5. Parte III — Vínculo de Lunacia a día de hoy (estado real en código)

### 5.1 Resumen ejecutivo del MVP1 actual

- **Formato:** asedio a torre. Un **Lord inmóvil** (vida 240, ataque de torre 30, alcance 2)
  + **3 Axies móviles** por bando.
- **Tablero 8×7** con cuatro terrenos: piedra (bloquea), zona lenta (cuesta 2 de
  movimiento), agua (solo Aqua), obstáculo bajo (bloquea mover, no disparar).
- **Reloj de 12 turnos** y desempate por % de vida del Lord.
- **Zona de control:** al entrar adyacente a un enemigo, tu movimiento termina.
- **Un dado por unidad** tirado al inicio de tu turno. Un dado técnico → 3 caras (tu
  clase, siempre afinidad) o fase 1 → 5 caras (4 partes + invitación extra). El Lord tiene
  su propio dado de 6 caras (1 ataque + 5 invocación, en bruto).

### 5.2 El dado: las caras que ya existen (código en `src/axie.js`)

| Efecto (face) | Slot | Quién | Comportamiento actual |
|---|---|---|---|
| `summon` | eyes/ears | genérico | Fuera del tablero: entra. Dentro: mueve 2 (o golpe 1 de respaldo) |
| `strike` | mouth | Golpe | Daño normal reducido por la DEF del objetivo |
| `pierce` | horn | Perforante | Ignora la DEF |
| `drain` | mouth/back | Drenaje | Ataca y cura 1 (GA ágil) |
| `guard` | back/ears | Guardia | Escudo inmediato, no gasta la acción |
| `dash` | tail | Impulso | Mueve hasta 2 y ataca al final |

El MVP1 (paso 5) concreta 12 partes con sus valores (Little Branch 20, Imp 30, Feather
Spear 20, Serious 20 (+20 escudo), Risky Fish 40 (−10 propio), Nut Crack 30 (+20 combo),
Pumpkin 30, Hermit 20 (+10 cura), Balloon 20 (+push 1), Nut Throw 20 (rango fijo 2),
Shrimp 20 (impulso), Swallow (reposiciona aliado)).

### 5.3 Cómo se resuelve el combate hoy (flujo real en `App.jsx`)

1. Inicio de turno → se tiran los dados de las unidades vivas del jugador activo.
2. Por cada unidad (orden elegido por el jugador) con su cara:
   - Guardia: se aplica sola (escudo) y la acción queda libre para mover/atacar básico.
   - Ataque (strike/pierce/drain/impulso/distancias): se muestran los objetivos en alcance
     efectivo con línea de tiro (solo piedra bloquea).
   - Invocación/Reposición: entra la reserva junto al invocador / reposiciona aliado.
3. Tras gastar acciones del jugador activo → turno rival (IA con 4 prioridades).

**Lo que NO existe hoy (huecos que detecta esta investigación):**
1. **Sin contragolpe:** atacar a una unidad que sobrevive y te alcanza no cuesta nada.
2. **Sin relación/ventaja:** el efecto que sale no interacciona con lo que el rival eligió.
3. **Sin banco de recursos:** la cara de utilidad que no viene bien se desperdicia.
4. **La invocación es plana** (una criatura cualquiera, siempre igual de cara).
5. **El terreno es peaje**, no refugio.
6. **El dado rival no se usa:** su cara solo interesa para su propio turno, nunca para
   contestar al tuyo.

### 5.4 Señales de alarma vigentes (MVP1 sección 12)

1. Partidas que se deciden por el reloj → **atacar es caro o sin retorno**.
2. Nadie usa el asesino → **el flanqueo no paga**.
3. El tanque no aparece → **la zona de control no hace su trabajo**.

La propuesta de este documento ataca la señal 1 (intercambio + rotura dan retorno a
atacar) y la 2/3 (triángulo sobre efectos y terreno defensivo reparten los roles).

---

## 6. Parte IV — Síntesis: el "tratado" de integración

### 6.1 Principios no negociables

Rejilla de decision que cualquier propuesta debe respetar (extraídos de la fuente de
verdad y de la sesión de diseño):

1. **La cara es el mensaje.** La cara dice *qué puedo hacer este turno*, y está ligada a
   una parte del cuerpo. **Prohibido:** rerrolar, redimir la cara por puntos genéricos.
2. **Seis caras = seis partes.** El genoma es el dado. **Prohibido:** dados de más caras
   o caras con peso variable.
3. **La evolución es un compromiso a largo plazo**, no un "bullet time" diario. Si algo
   temporizado entra, debe ser de partida (Fase B), no de cuenta.
4. **La válvula anti-bola-de-nieve del Lord se mantiene.** Su dado sigue siendo una
   fábrica mientras el MVP1 no tenga otro mecanismo robusto de relance.
5. **El reloj de 12 turnos es lo que garantiza diversidad de partidas.** Nada debe hacer
   que atacar sea tan caro que la partida muera en el desempate, ni tan barato que muera
   en el turno 3.
6. **Primero se entienden los efectos que hay; luego se añaden.** (CLAUDE.md) → la Fase A
   *re-semantiza* (triángulo sobre golpe/perforar/guardar, invocación con nivel) y solo
   añade **un** verbo nuevo (contragolpe).

### 6.2 El triángulo de efectos (A1)

#### 6.2.1 La relación

Sobre las **tres familias de efectos** del dado (todas ya existentes):

| Efecto (cara del ATACANTE) | Vence a | Lo explica (texto que ya tiene el juego) |
|---|---|---|
| **Perforar** (Cuerno) | **Guardar** | "ignora el escudo del objetivo" — atraviesa la guardia |
| **Guardar** (Lomo) | **Golpear** | "escudo, no gasta la acción" — absorbe al golpe seco |
| **Golpear** (Boca) | **Perforar** | daño pleno de fuerza — embiste al aguijón |

La **Cola** (Impulso/distancias fijas) y la **Invocación/Reposición** quedan **neutrales**:
ni vencen ni son vencidas. Es deliberado: quemar la Cola debe ser la única forma de
"no entrar en el ciclo" cuando el rival te tiene leído.

#### 6.2.2 La rotura (break)

> Si el atacante tiene **ventaja de relación** y **causa daño**, el objetivo sufre
> **Rotura**: no puede contraatacar en este intercambio **ni** como respuesta en su
> siguiente acción (su siguiente respuesta no puede ser defender/guardar en el caso de
> caras de apoyo: la guardia se mantiene normal, pero sin contraataque propio).
> *(prov.)*

La ventaja **NO modifica el daño**. El precio de la rotura es puro control del turno
(en línea con Engage). Cómo se muestra: al confirmar un ataque con ventaja que hace
daño, sobre el objetivo se marca el ícono de rotura y en el preview se lee
**“(tu cara perfora su escudo) → no contraatacará”**.

#### 6.2.3 Casos de uso concretos (con valores del MVP1)

**Caso 1 — el tanque contra un golpe seco.** *Beast* (Golpe, Nut Crack 30) ataca a un
*Plant* que giraba Guarda (Pumpkin 30). El atacante juega **Boca (Golpe) vs Lomo
(Guardar)** → el defensor tiene ventaja → si sobrevive, **contraataca como Guarda** y
brea. El Beast debe decidir: no entrar, o entrar sabiendo que recibe una vuelta.
*La Guarda se aplica antes (al tirar) según regla actual; aquí el eje es la relación, no
el orden del escudo.*

**Caso 2 — el arquero fuera de campo.** *Bird* con **Feather Spear** (rango +1) dispara
desde el borde máximo de su rango a un *Aqua* que no le alcanza. No hay contragolpe
(no le alcanza). Si el Aqua lleva Perforar (Imp cazador del half-life) para el turno
siguiente, el Bird sabe que matar en un golpe o morir en el contraataque — el video de
"susto" del arquero.
*Esto devuelve valor al Bird sin tocar su chasis: su rango 3 es la única herramienta de
"no recibir".

**Caso 3 — el remate asegurado.** *Aqua* con **Shrimp (Impulso)** mueve 2 y ataca a un
*Bird* al 30 % de vida con cara **Perforar**. Relación: Perforar vs Bird con Guarda
(Balloon) → ventaja para el Aqua → si acierta y mata, la rotura no importa; la sorpresa
es que **si hubiera un contrataque, lo evita**. La *killbox de FE* (matar sin pagar la
vuelta) se materializa.

#### 6.2.4 Relación contra el Lord

El Lord es torre: no se leen efectos en la respuesta (su cara es unica y demasiado
potente para un contraataque gratuito). **Todo ataque contra el Lord es neutral.**
Contra unidades, la relación se calcula con **la cara tirada del defensor**, siempre
visible en la carta del dado (info pública, como el arma equipada en FE).

### 6.3 El intercambio (A2) — contragolpe limitado con preview

#### 6.3.1 La regla

> Cuando atacas a una **unidad** (no al Lord) y esa unidad **sobrevive**, está **en
> alcance del atacante al terminar tu ataque** y **no tiene Rotura**: contraataca una vez
> con **su propia cara tirada** (según su efecto/parte). Un **golpe mortal** no concede
> contraataque (no hay "última palabra del moribundo"; simplificación deliberada para que
> rematar se sienta limpio).

#### 6.3.2 Excepciones

- **Lord:** nunca entra en intercambios (su cara de torre 30/alcance 2 respondería gratis
  y rompería el reloj).
- **Alcance largo:** el rival que no alcanza al atacante no contraataca → **rango >1
  compra iniciativa**. Feather Spear (rango +1) y Nut Throw (fijo 2) pasan de "el mismo
  golpe que cuerpo a cuerpo con puntos sueltos" a **herramienta de iniciativa**.
- **Rotura:** la ventaja de relación niega la vuelta (6.2.2).

#### 6.3.3 El preview (competitividad)

Antes de confirmar el ataque, la UI muestra el **trato completo**:

```
Golpe a Beast (Nut Crack 30)
 ─ Daño que darás:    20  (30 − DEF 10)
 ─ Su respuesta:      Perforar (Imp) → recibirás 30
 ─ Relación:          Perforar > Golpe → NO contraataca (Rotura)
```

Este cuadro es la pieza que vuelve **competitiva** la partida: el error ya no se esconde
detrás del azar de la tirada; se ve, se decide y se paga.

#### 6.3.4 Impacto en el ritmo

- Menos ataques "de relleno" (entrar sin relación = pagar la vuelta). El tablero
  se vuelve **más resolutivo**, no más lento: menos golpes, pero más significado por golpe.
- Los jugadores pasan a jugar con **"la iniciativa del daño"**: el Bird dispara sin
  devolución, el Tanque "carga" para que el rival reciba, el asesino entra solo cuando
  mata o rompe.

#### 6.3.5 Tabla de golpes-para-matar (TTK) de referencia con intercambio

Con valores del MVP1 (sin rotura, intercambio simple) y confirmando los ratios actuales
(del MVP1, x10):

| Atacante → Blanco | Daño (cara; afinidad) | Vida del blanco | Golpes para matar | Con contragolpe del blanco (si sobrevive) |
|---|---|---|---|---|
| Beast Nut Crack (30) → Beast | 30 − DEF(10) = 20 | 90 | 5 | Vigilar: el Beast rival golpea 20 en cada vuelta → 4 vueltas = la pelea se decide |
| Aqua Imp (perfora, 30) → Bird | 30 (ignora DEF) | 70 | 3 | Bird no alcanza → 0 vuelta → *killbox real* |
| Bird Feather Spear (20) → Aqua | 20 − DEF(10) = 10 | 70 | 7 | Aqua no alcanza (rango 1) → intercambio torcido a favor del arquero |
| Aqua Shrimp (20, impulso) → Beast | 20 − 10 = 10 | 90 | 9 | Solo tiene sentido para rematar o con banco de Energía |

**Conclusión del cálculo:** la rotura es lo que hace económicos los remates (columna
"con contragolpe" pasa de pagar el doble a gratis cuando rompes o matas). Sin ella, todos
los segundos golpes son traders perdedores → nadie atacaría → se protegería el reloj (la
señal 1). Con ella, **matar es una jugada planificada**.

### 6.4 El banco de Energía (A3) — la tirada se gestiona, no se sufre

#### 6.4.1 Por qué no rerroll

El rerroll de *Dice Throne* resuelve "tirada mala" **negando el genoma** ("me vuelvo a
tirar porque no me tocó lo que quería"). Rompe el mensaje *la cara es tu parte*.
Además, multiplica el tiempo por turno (un dado de 6 → dos o tres tiradas por unidad).

#### 6.4.2 La mecánica

> La cara que **no produce golpe** en la tirada (Guardia, Invocación, Reposición,
> utilidad) otorga a esa unidad **+1 de Energía** *(prov.)* al banco del turno.
> Al inicio de tu turno puedes gastar:
> - **2 Energía** → esa unidad **mueve 1 casilla extra** antes de su acción. *(prov.)*
> - **2 Energía** → su **siguiente golpe** suma **+10** al valor de la cara. *(prov.)*
> - **3 Energía** → **remate**: la cara de Guardia/Invocación de esta unidad se trata
>   como si fuera la **cara básica de golpe** de su clase. *(prov.)*
>
> El banco **se vacía al final de tu turno** si no se gasta (no es acumulación infinita).

#### 6.4.3 Ejemplo

*Plant* con cara de Guarda (siempre un +1 de Energía) y un *Bird* con cara de Invocación
(+1). El jugador gasta 2 de Energía para que el *Plant* avance una casilla más y ocupe el
cuello de botella antes de que el rival despliegue — la "tirada de apoyo" se convierte en
**tempo** real.

#### 6.4.4 Compensaciones de diseño

- La cara de **Guardia pura** (ya otorga escudo) no debe regalar *también* Energía sin
  límite → si la Guardia ya se aplicó, la Energía que da es **solo si NO gastas la
  acción** en otra cosa (la regla actual de no gastar acción se mantiene; la Energía es
  el incentivo a no abusar de "guardia + golpe básico").
- Valores con tope máximo de banco **5** *(prov.)* para que no haya "ahorro gordo" de
  partida entera.

### 6.5 La invocación con nivel (A4) — invocar tiene coste y elección

#### 6.5.1 La idea (Triple Summoning domado)

> Si en tu turno salen **2 caras de invocación** entre tus unidades, en vez de invocar
> 2 de la reserva normal puedes elegir **invocar 1 unidad "de oro"** (una creatura de
> segunda generación de la reserva; coste en Material/pase de nodo — definida en Fase B).
> Si salen **las mismas 2 caras** de invocación, puedes **reposicionar 2** en vez de 1.
> *(prov.)*

#### 6.5.2 Qué cambia

- **Invocar ya no es equivalente a "turno perdido por casualidad"**: dos unidades que
  tiran invocación en el mismo turno producen una **decisión** (¿calidad o cantidad?).
- **La válvula del Lord se conserva** (su invocación sigue siendo individual y de bajo
  nivel); solo se abre la opción de "oro" cuando el jugador *concentra* sus caras — no
  la desata automáticamente.

#### 6.5.3 Cómo entra la reserva (mapa)

Reutilizando el lenguaje de DDM (el dado que invoca construye su camino): las invocaciones
"salen junto al invocador" (regla 15-16 del MVP1). El cambio táctico es puro *orden*:
decidir **qué invocar primero** (por dónde quieres abrir tu camino hacia el Lord).

### 6.6 Terreno defensivo (A5) — ocupar recompensa

| Casilla | Regla nueva *(prov.)* | Lógica de diseño |
|---|---|---|
| **Zona lenta (pradera alta)** | Además del coste 2 de movimiento, quien termina ahí gana **+1 de Guardia** (30 → 40) al recibir el siguiente golpe | La trinchera del tanque: donde hay coste, hay premio |
| **Obstáculo bajo** | Quien dispara **desde detrás** de un obstáculo gana **+1 de alcance** ese tiro (rango+1) | El arquero se esconde y amplía su ventana de "no contraataque" |
| Piedra / agua | Sin cambio | Ya tienen identidad fuerte |

**Riesgo mitigado:** solo se premian las casillas que hoy ya se pisan por obligación; así
el terreno no crea fortalezas inexpugnables, solo hace que **elegir bien dónde estar** sea
información valiosa.

### 6.7 La IA enemiga reescrita (A6)

Prioridad de la IA actual (MVP1):

1. Rematar al enemigo con menos vida al alcance.
2. Atacar al Lord si está al alcance.
3. Avanzar por la ruta más corta despejada.
4. Atacar a quien bloquea.

Prioridad propuesta (añade la lectura de la relación):

1. **Remate limpio:** rematar (mata sin recibir vuelta, o con Rotura). 
2. Rematar aceptando el cambio (solo si el objetivo morirá).
3. Atacar al Lord si está al alcance **y no te expones a rotura**.
4. Atacar a quien bloquea **solo si la relación es favorable o neutral**.
5. **Retención:** si entrar regalaría el turno (ser roto), mantenerse fuera de la
   zona de control del jugador y esperar (comportamiento de cebo de FE).
6. Avanzar por la ruta más corta despejada.

Este cambio convierte a la IA de "camina hacia el jugador" en "castiga al jugador que
descuida su rotura" — el espejo mismo de la estrategia que el jugador debe usar.

### 6.8 Interacción con el dado del Lord y los estados

- El dado del Lord sigue siendo 1 ataque + 5 de invocación. Su ataque de torre **no lee
  relación** (es neutral) y **nunca contraataque** (regla 6.3.2). La Fase B puede
  convertir las 3 ranuras bloqueadas en habilidades que sí interactúan (Muro, Llamada,
  Marca) — actuales del MVP1 paso 12, sin conflicto con esta propuesta.
- **Estados visibles en el tablero:** Rotura (icono de escudo volcado) y Energía (contador
  azul) deben pintarse junto a la barra de vida. Ui-UX (apartado 6.9).

### 6.9 Cambios de interfaz que exige la propuesta

1. **Preview del intercambio** (6.3.3) antes de confirmar todo ataque a unidad → es la
   pieza de "competitividad" y la primera que debe implementarse con A2.
2. **El dado del rival visible** con su cara tirada resaltada → la relación se lee de
   un vistazo. (La carta del dado ya enseña las 6 caras; ahora necesita marcar la tirada.)
3. **Icono de Rotura** en la unidad objetivo y en la carta.
4. **Contador de Energía** junto al nombre de cada criatura.
5. **Zona de peligro** (Fase B): casillas en las que el rival te rompería — no es
   estrictamente necesaria para A, pero es el acelerador de la curva de aprendizaje.

---

## 7. Parte V — Hoja de ruta de implementación

### 7.1 Fase A (MVP1, alta prioridad, ~una iteración por pieza)

| # | Pieza | Archivo | Verificable cuando | Estado |
|---|---|---|---|---|
| A1 | Triángulo de efectos + Rotura | `App.jsx` (`relationGain`/`grantsBreak`) + UI (badge Rotura en `BoardRegion.jsx`) | Una cara Perforar sobre una Guarda muestra Rotura en el preview | ✅ Implementado 10-sep-2026 |
| A2 | Intercambio con contragolpe | `App.jsx` (`applyUnitAttackLocal`/`computeCounterHit`, compartido entre `attack()` y la IA) | El Bird a rango 3 no recibe vuelta; el Beast cuerpo a cuerpo sí | ✅ Implementado 10-sep-2026 |
| A2.3 | Preview del intercambio | `App.jsx` (`describeExchange`, `hoverCell`) + `ActionBar.jsx`/`BoardRegion.jsx` | Pasar el cursor sobre un objetivo muestra daño/rotura/vuelta antes de tocar | ✅ Implementado 10-sep-2026 (hover, no modal de confirmar/cancelar — ver `CLAUDE.md`) |
| A3 | Banco de Energía | `App.jsx` (`energyBank`/`boostArmed`/`moveBoostArmed`) | Una Guarda da 1 de Energía y se puede gastar en mover +1 o +10 al golpe | ✅ Implementado 10-sep-2026 (el "remate" de 3 E se dejó fuera, ver TODO en `App.jsx`) |
| A4 | Invocación con nivel | `App.jsx` (contador de caras de invocación del turno) | Dos invocaciones en un turno ofrecen "¿oro o cantidad?" | ⏸ No pedido en esta fase |
| A5 | Terreno defensivo | `App.jsx` (`terrainGuardBonus`/`terrainRangeBonus`) | El tanque en zona lenta recibe +10 de guardia; disparar pegado a un obstáculo da +1 de alcance | ✅ Implementado 10-sep-2026 |

**Orden sugerido:** A2 (es el corazón) → A1 (le da el contexto) → A3 (agencia) → A5
(barato) → A4 (precisa definir la reserva "de oro").

### 7.2 Fase B (MVP2 y visión de producto)

| Pieza | Origen | Nota |
|---|---|---|
| Ojos/orejas = crests de utilidad (curar, red, muro temporal) | DDM 3.4 | Rellena el hueco de 6 caras sin inventar mecánicas nuevas |
| Ascensión exprés (meter de combate) | FE Engage / pitch | Ataca/recibe para llenar; al llenarse, evoluciona una parte DURANTE la partida (+1 a esa cara) — el gesto "Engage/Ascender" público |
| Zona de peligro en UI | FE 2.3 | Acelerador de aprendizaje; prerequisito de competitividad profesional |
| Pool de dados (15) para el modo de cuenta | DDM 3.5 | Construcción a priori del genoma = construcc. de crests |
| Modos de mapa competitivos (claim/territory) | DDM 3.3 | La victoria estructural: controlar el camino, no solo DPS |

### 7.3 Qué NO tocar en la Fase A

- El dado del Lord y la válvula de invocación (regla 4.2 MVP1).
- El reloj de 12 turnos y el desempate por % de vida.
- El ataque básico de respaldo (regla 2.1) — se mantiene tal cual; el intercambio no lo
  elimina, solo condiciona la vuelta.
- El tablero 8×7 y los cuatro tipos de terreno; solo se premian casillas existentes.

---

## 8. Parte VI — Métricas de éxito, riesgos y playtest

### 8.1 Métricas de éxito (cómo saber que funcionó)

1. **El jugador planifica la rotura:** "te voy a romper el contragolpe" con el dado del
   rival visible antes de atacar → el triángulo se entiende sin leer.
2. **El Bird gana uso por su alcance** (disparo lejos = no vuelta) y el **asesino**
   aparece en composiciones por el flanqueo de agua → los roles se repartieron.
3. **El banco de Energía se gasta** distintos en más de la mitad de los turnos → la
   tirada se gestiona, no se sufre.
4. **Las partidas siguen muriendo por el Lord**, no solo por el reloj → la rotura no ha
   encarecido tanto atacar que nadie ataque.
5. **El perdedor explica UNA razón táctica** ("entré con Guarda contra Perforar y me
   rompió") → criterio de salida del MVP1 cumplido con causa posicional (no azar).
6. **TTK estable:** revisar por sesión que ningún chasis suba/baje más de 1 golpe para
   matar tras cada cambio de valores provisionales.

### 8.2 Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| La rotura hace que un "0 defensivo" gire la partida sola | Reloj de 12 turnos + el dado del Lord compensa con reposición (su fábrica); rotura no aplica al Lord |
| El contragolpe ralentiza el ritmo (cada ataque = 2 golpes) | Preview corto + solo 1 respuesta + excepciones (rango, muerte, rotura) |
| La Energía se convierte en "gasolina obligatoria" | Tope de banco 5 + vacía al fin del turno + solo de caras sin golpe |
| El Bird se vuelve el único sano (dispara y no le devuelven) | Su chasis sigue siendo 70 de vida y su daño 10; la relación es el corrector de la economía |
| La IA retenida aburre (nunca avanza) | Retención solo cuando entrar = ser roto; prioridades 1-4 cubren el resto |
| Complejidad excesiva para el MVP1 | Fase A tiene 1 verbo nuevo (intercambio) + 4 re-semantizaciones; la Fase B queda fuera del MVP1 |

### 8.3 Guion de playtest (3 partidas)

1. **Partida 1 (sin A):** línea base actual. Anotar: nº de ataques declarados, nº de
   "reloj-de-mortes", vehículo de cada golpe.
2. **Partida 2 (con A1+A2):** misma composición. Medir: nº de decisiones de no-atacar por
   leer relación; nº de roturas usadas para rematar; tiempo medio de turno.
3. **Partida 3 (con A bueno completo):** libre, con registro de la "explicación de la
   derrota" (criterio de salida).

---

## 9. Glosario

| Término | Definición |
|---|---|
| **Break / Rotura** | Estado que niega el contraataque durante el intercambio y la siguiente acción del rival (FE Engage → nuestro A1) |
| **Intercambio (trade)** | Secuencia ataque + respuesta posible de una batalla; la unidad de competividad de FE |
| **Follow-up (doble ataque)** | Golpe extra cuando tu Spd supera la del rival por el umbral (FE); nuestro análogo es el banco de Energía |
| **Crest / crest pool** | Recurso que otorga cada cara del dado en DDM; se guarda y se gasta. Nuestro análogo: banco de Energía (A3) |
| **Summon level (nivel del die)** | Nº de crests de invocación en un dado; define la dificultad de invocar (DDM). Nuestro análogo: invocación con nivel (A4) |
| **Die Master / corazones** | Objetivo del rival en DDM (3 corazones). Nuestro análogo: el Lord (240 de vida) |
| **Zona de peligro (danger zone)** | Casillas en las que el rival puede golpear (FE); prerrequisito UX del competitivo (Fase B) |
| **Rotación defensiva / retain IA** | Comportamiento de la IA que no avanza si no puede atacar (FE); palanca del cebo (A6) |
| **Preview de batalla** | Cuadro FE que muestra el intercambio previsto antes de confirmar (→ 6.3.3) |

## 10. Fuentes

- Fire Emblem Wiki — *Weapon triangle*, *Basics 9: Follow-Up Attacks*, *Triangle Attack*,
  *Triangle Adept*.
- IGN — *Fire Emblem: Battle System*; guía *Fire Emblem Engage*.
- GameSpot — análisis de *Fire Emblem Engage* (break).
- GameFAQs — *Battle Basics* (Engage); guías GBA *Yu-Gi-Oh! Dungeon Dice Monsters*
  (TymaHughes, shaeki, Civ_Magirus).
- Mattel — reglas oficiales *Yu-Gi-Oh! Dungeon Dice Monsters Starter Set*.
- Yugipedia — *Dungeon Dice Monsters*, *Crest (Dungeon Dice Monsters)*.
- BGG y Wikipedia — *Dice Throne*; Rio Grande Games — reglas *Roll for the Galaxy*.
- Repo — `MVP1vinculodelunacia.md`, `src/axie.js`, `src/App.jsx`, `CLAUDE.md`.