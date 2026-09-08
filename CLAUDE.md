# Vínculo de Lunacia — contexto del proyecto

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

**Stack:** React 19 + Vite 8, sin librería de estado, sin router, sin TypeScript.

**Estructura:**

```
src/
  App.jsx              logica de partida y UI (componente unico)
  axie.js              datos de partes, clases, dados y resolucion de efectos
  axieMixer.js          puente genoma -> @axieinfinity/mixer (tabla de genes reales,
                         animaciones de ataque)
  AxieSprite.jsx        render 2D real del Axie (PixiJS + pixi-spine) en carta y tablero
  LunaciaBackdrop.jsx   fondo 3D ambiental (Three.js), decorativo, ver nota abajo
  App.css               estilos
```

### Reglas de trabajo (importantes, hay 13 días)

- **No refactorizar `App.jsx` en componentes por higiene.** Dividir solo si bloquea de
  verdad. La lógica de datos sí va en `axie.js`; la UI se queda donde está.
- **Nada on-chain.** Es opcional en prototipo y es tiempo robado al 35 %.
- **No ampliar el tablero ni el roster.** Dos criaturas bien diferenciadas por sus partes
  demuestran más que seis genéricas.
- **Antes de añadir un efecto nuevo, comprobar que los que hay se entienden.** Es mejor
  tener cuatro efectos legibles que seis desbalanceados.
- **La carta de criatura tiene que enseñar el dado con sus seis partes.** Es la pantalla
  que hace que se entienda la idea en cinco segundos sin leer nada. Prioridad máxima de
  interfaz.
- **No usar TypeScript ni añadir dependencias** salvo `@axieinfinity/mixer` y sus pares
  de PixiJS, y `three` (ver nota sobre `LunaciaBackdrop.jsx`). Cualquier otra dependencia
  nueva se pide primero.

> **Nota sobre `three`:** decisión explícita del usuario, no mía. Pidió ver el tablero "en
> 3D, en el mundo de Lunacia". Se le avisó de que el tablero/piezas en 3D de verdad
> significaría abandonar `@axieinfinity/mixer` (2D) y depender del Three.js Axie Mixer,
> que `docs/estudio-mercado-2026.md` marca como beta inestable — eligió la alternativa de
> bajo riesgo: un fondo 3D puramente decorativo (`LunaciaBackdrop.jsx`, `pointer-events:
> none`) detrás del tablero 2D real, que sigue intacto. No hay assets de entorno de
> Lunacia publicados por Sky Mavis, así que la escena es abstracta (islas flotantes, luna,
> motas de luz) en la paleta del juego, no un lugar del lore inventado.

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
