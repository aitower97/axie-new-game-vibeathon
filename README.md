# Tactic Dice — Axie Vibeathon 2026, Ronda 1

> Un táctico por turnos donde el dado de cada Axie está hecho de sus seis partes del
> cuerpo, y ascender no sube un número: evoluciona una parte y reescribe esa cara.

Prototipo construido para la Ronda 1 del Axie Vibeathon 2026 usando el
[Axie Origins Battle Kit](https://github.com/axieinfinity/axie-origins-asset-kit) oficial
bajo el permiso concedido en la Sección 5 de las Official Rules del Vibeathon.

# PLAY THE PROTOTYPE

**[PUBLIC GAME URL — pending: add after the Vercel deploy is verified]**

Desktop browser (Chrome / Edge), mouse. The game UI is in English.

# HOW TO PLAY

See [docs/HOW_TO_PLAY.md](docs/HOW_TO_PLAY.md).

# FUTURE VISION

See [docs/FUTURE_VISION.md](docs/FUTURE_VISION.md) (split into *implemented now* vs *future*).

**Repository:** https://github.com/aitower97/axie-new-game-vibeathon ·
**Submission copy:** [docs/SUBMISSION.md](docs/SUBMISSION.md) ·
**Axie Core fit, AI disclosure, assets and limitations:** sections below (the rest of this README is in Spanish).

## Arrancar

```
npm install
npm run dev
```

Abre la URL que muestre la terminal (normalmente http://localhost:5173). Build de
producción con `npm run build` (salida en `dist/`), servible como sitio estático (no
necesita backend ni base de datos).

## Controles y dispositivos soportados

Solo navegador de escritorio (Chrome/Edge verificados), con ratón — **no hay soporte
táctil/móvil**, es una decisión de diseño explícita para poder centrar el tiempo de la
Ronda 1 en el combate en vez de en dos layouts distintos.

- **Arrastrar** el tablero para desplazar la cámara, **rueda del ratón** para zoom.
- **Clic** en un Axie propio para seleccionarlo; las casillas a su alcance se iluminan.
- **Clic** en una casilla para moverte (mover nunca gasta el turno) o en un enemigo
  adyacente para atacar con la cara tirada (botón **Básico** o **Especial** en el panel
  de acción, según lo que haya salido).
- **Tirar dados** tira la cara de las seis partes de cada Axie vivo; las caras sin golpe
  (guardia/reposición) sí acumulan Energía aunque no ataquen.
- **Pasar turno** cuando ya no queda nada útil que hacer — en arenas PVP hay un reloj de
  20 s por turno jugable que pasa el turno solo si se agota.
- El icono 🔊/🔇 de la barra superior controla la música (arranca al primer clic, por
  política de autoplay del navegador).

## La idea en treinta segundos

Cada Axie tiene seis partes: ojos, orejas, cuerno, boca, lomo y cola. **Esas seis partes
son las seis caras de su dado.** Tirar no dice "cuánto pego", dice **qué puedo hacer este
turno** — y qué cara sale depende de **qué parte concreta** llevas: un cuerno *Imp*
perfora, un *Little Branch* pega menos pero dobla de guardia, un cuerno *Cactus* ni
siquiera ataca. Mover nunca gasta el turno de una unidad: el jugador decide moverse y
*después* elegir el ataque Básico o el Especial de la cara tirada, o al revés.

Sobre esa base, el combate añade tres capas pensadas para que la partida se decida por
el jugador, no por rachas de suerte:

- **Afinidad de clase** (triángulo real de Axie llevado a las 4 clases del MVP1): Beast
  gana a Plant y pierde con Aqua/Bird; Plant gana a Aqua/Bird y pierde con Beast; Aqua
  gana a Beast y pierde con Plant; Bird gana a Beast y pierde con Plant. Multiplica el
  daño ×1.15/×0.85, visible en el panel de acción antes de golpear.
- **Crítico genético**: la probabilidad y el multiplicador de crítico salen de la CLASE
  del atacante (Beast 20 %/×2.0, Bird 25 %/×2.5, Aqua 15 %/×3.0, Plant 5 %/×1.5) más un
  extra si la cara tirada añade ráfaga (+5 % de probabilidad, +0.25 al multiplicador).
- **Muerte súbita (solo PVP)**: tras la ronda 8, +2 casillas de movimiento y +50 % de
  daño para ambos bandos durante 2 rondas extra; si nadie gana en ese margen, decide la
  vida restante del Lord.

**Progresión**: evolucionar una parte no sube un número — **reescribe la cara del dado**
de esa parte para siempre. El Laboratorio deja además bloquear caras concretas: no
compra poder, compra certidumbre sobre qué cara sale en la tirada.

## Encaje con Axie Core y visión de producto

El genoma de Axie (seis partes + clase) deja de ser cosmético o una hoja de
estadísticas: **es la fuente de la mecánica central del juego** — la distribución de
probabilidad del dado. Cambiar una parte cambia literalmente qué puede hacer la
criatura ese turno, y evolucionar una parte reescribe esa cara de forma permanente. Es
la misma genética que ya existe en el ecosistema Axie, convertida en la palanca de
juego en vez de en un número de fondo.

El análisis de mercado, el modelo económico (estructura Lord/tropa, sink asimétrico,
suscripción de acuñado) y el estudio de la competencia (Terrariums, Homeland, Den of
Mysteries) están en `docs/design/decision-de-producto.md` y `docs/design/estudio-mercado-2026.md`.

## Estado actual (verificado en vivo, no solo por código)

Combate del MVP1 completo y jugable de principio a fin: tablero 3D real (Three.js
vanilla + bloques Kenney), IA enemiga con prioridades, dos modos (PVE contra el mapa de
Lunacia, PVP contra arenas con reloj y muerte súbita), un HUB con Laboratorio de
evolución/bloqueo de partes, Investigación e Inventario de recursos, música ambiental
por estado, y VFX de combate reales del Axie Origins Battle Kit sobre cada impacto.

## Known issues / limitaciones conocidas

- **Despliegue pendiente de verificar** — configurado para Vercel como app estática de
  Vite (`vercel.json`: `npm run build`, salida `dist/`, ~550 MB por el pack 3D de Axie);
  la URL pública se añade arriba cuando esté desplegada y comprobada.
- **Sin tests automatizados.** La lógica de combate (afinidad, crítico, contragolpes,
  muerte súbita) está verificada por revisión de código y partidas jugadas a mano en
  cada sesión, no por una suite que corra sola.
- **Muerte súbita PVP verificada por código, no por una partida real completa**: la IA
  del PVE gana en pocas rondas si el jugador no defiende activamente, así que ninguna
  partida de verificación llegó a la ronda 9 en el entorno de pruebas. La lógica está
  revisada a fondo pero pendiente de una partida manual que la dispare.
- **AXP/Ascensión con umbral abstraído.** En Axie real, la Ascensión ocurre en los
  niveles 10/20/30 y exige una transacción on-chain firmada; aquí el umbral es menor y
  la Ascensión es inmediata para que la progresión se vea dentro de una partida de
  demostración. Se declara explícitamente como abstracción, no como confusión del
  sistema real.
- **Nada on-chain** — deliberado, las bases del Vibeathon lo marcan como opcional en
  fase de prototipo.
- **Fondo 2D de Lunacia es una composición propia**, no arte oficial de Sky Mavis: usa
  props CC0 de Kenney recoloreados más algunos elementos (santuario de cristal, árbol de
  flor, una choza) dibujados a mano en SVG, inspirados en referencias visuales de
  Terrariums/Homeland pero sin calcarlas.

## Disclosures (uso de IA, dependencias, assets, contribuidores)

- **Uso material de IA**: este prototipo se construyó con asistencia extensa de
  **Claude Code** (agente de codificación de Anthropic) a lo largo de toda la Ronda 1 —
  implementación de la lógica de juego, componentes de interfaz, iteración de diseño
  visual, y arte derivado original (el logotipo del juego y algunos elementos del fondo
  2D son SVG dibujados por el agente, no trazados de ningún asset de terceros). Cada
  sesión de trabajo queda documentada con su alcance y verificación en `CLAUDE.md`.
- **Trabajo/starters preexistentes**: ninguno más allá de las herramientas oficiales del
  Vibeathon listadas abajo.
- **Dependencias de código**: React 19, Vite 8, Three.js, Tailwind CSS (capa
  responsive), y `@jaatster/threejs-axie-mixer3d-public` (mixer 3D vendorizado,
  herramienta del propio ecosistema de la competición) — lista completa en
  `package.json`.
- **Assets del Axie Origins Battle Kit** (modelos 3D, partes, VFX de combate,
  emblemas de ranura): inventario completo, verificado archivo por archivo, en
  `docs/design/recursos-vibeathon.md`.
- **Assets de terceros no-Axie**: props 3D CC0 de Kenney (Platformer Kit, Mini Forest)
  para el terreno del tablero y la decoración de fondo; música ambiental de Kevin
  MacLeod (incompetech.com, CC-BY 4.0, atribución en el panel de ayuda del juego y en
  `public/music/README.md`).
- **Contribuidores**: proyecto individual (ver historial de commits de git para
  autoría).

## Estructura del repo

```
src/
  App.jsx              orquestador: estado de partida, logica de turnos/combate/IA
  components/          UI de presentacion (HUB, tablero, cartas, HUD)
  axie.js              datos de partes, clases, dados y resolucion de efectos
  axieMixer3D.js        puente genoma -> mixer 3D oficial del Vibeathon
  main.jsx, App.css    arranque y estilos
public/                assets servidos tal cual: assets/axie (pack 3D), models, music, vfx, brand
vendor/                mixer 3D vendorizado (necesario para el build remoto)
vercel.json            despliegue estatico en Vercel (build: npm run build, salida: dist)
docs/                  guia de juego, vision, textos de entrega, guion de video, checklist
docs/design/           documentos de diseno internos (reglas MVP1, estudio de mercado, recursos)
CLAUDE.md              historial completo de sesiones de desarrollo, con verificacion
```

El contexto completo del proyecto, cada decisión de diseño tomada y su verificación en
vivo (capturas, pruebas manuales, comandos ejecutados) están documentados sesión a
sesión en `CLAUDE.md`.
