# Vínculo de Lunacia — decisión de producto

**Fecha:** 8 de septiembre de 2026
**Se apoya en:** `docs/estudio-mercado-2026.md`
**Resumen operativo:** `CLAUDE.md`

Este documento explica **por qué el juego es como es**. Si en algún momento hay que decidir
entre dos caminos, la respuesta suele estar aquí.

---

## 1. El punto de partida (estado previo al cambio)

El prototipo original era un táctico de escaramuza por turnos sobre rejilla 5×7, con dos
Lords enfrentados a 3 corazones, invocación por dados y progresión AXP/Ascensión. React 19
+ Vite 8, un solo componente de unas 330 líneas.

Lo que más valor tenía y era fácil pasar por alto: la función `makeDie(baseAtk, ascLevel)`.
Era un sistema donde **el progreso reescribe físicamente el objeto con el que juegas**. La
mayoría de prototipos de progresión suben un número; este cambiaba la distribución de
probabilidad de las decisiones disponibles. Ahí estaba el juego, sin desarrollar.

---

## 2. Encaje con el mercado

### A favor

**El formato.** No es un 4X, y eso es una buena noticia: el 4X lleva dos trimestres
consecutivos a la baja desde su techo de 3.090 M USD en Q4'25, con retención pésima
(Whiteout Survival D30 5,57 %, Last War D30 3,82 %). Un táctico de sesión corta es el otro
extremo: barato de producir por minuto jugable y con la estructura de repetición que el
mercado premia ahora que las descargas caen un 12 % y lo que sube es el ingreso por
descarga (+11 %).

**El dado.** Dado + táctica está en la zona sana del gusto actual: es el mismo espacio de
"híbrido de sistemas conocidos" que domina en 2026 (roguelite + cooperativo, survival +
RPG, estrategia + eventos en vivo).

**Navegador.** Vite + React se despliega en un enlace, que es exactamente lo que pide la
entrega del Vibeathon. Cero fricción para el jurado; puntúa en Viabilidad y en Calidad de
prototipo (20 % combinado).

**Hueco real.** No hay ningún táctico de rejilla con dados en Ronin. Origins es card
battler, Den of Mysteries dungeon crawler, Homeland y Pixels gestión, Lumiterra MMORPG.

### En contra

**El problema grande: Axie Core vale el 35 % y no se estaba puntuando.**

Las criaturas se llamaban "Cría de Ascua" y "Cría de Musgo" y tenían HP/ATQ/DEF. Eran
criaturas genéricas. Lo único que conectaba con Axie era AXP y Ascensión — sistema real y
bien traído, pero **una capa de progresión, no la identidad del IP**.

El test: si sustituyes las dos criaturas por dos setas o dos robots, **¿el juego funciona
exactamente igual?** Si la respuesta es sí, el 35 % está perdido. Y era sí.

Lo que hace único a Axie no es que gane experiencia. Es que **cada Axie es una combinación
de seis partes del cuerpo y una clase**. Eso sostiene el coleccionable, el marketplace y
toda la cultura del ecosistema desde 2020. No aparecía por ninguna parte.

**Problema menor:** la profundidad de decisión era fina. Tirar, invocar, mover, pegar. La
IA no obligaba a pensar. Afectaba a Gameplay (25 %).

---

## 3. La decisión

**No cambiar de juego. Cambiar de qué está hecho el dado.**

> **Las seis caras del dado son las seis partes del cuerpo del Axie.**

Eyes, ears, horn, mouth, back, tail. Un dado, seis caras, seis partes. La estructura de
datos ya estaba escrita.

**Antes:** `['summon', 'summon', 2, 2, 2, 2]` — dos caras de invocación y cuatro de ataque
de valor N.

**Después:** cada cara es una **parte real**, y cada parte hace algo distinto y no numérico.
El número que sale deja de ser "cuánto pego" y pasa a ser **"qué puedo hacer este turno"**.
Cada tirada es una decisión táctica en vez de un resultado.

### Por qué resuelve los dos problemas de golpe

**Axie Core (35 %):** el genoma pasa a ser el juego. Un Axie con un back concreto y una
tail concreta *juega distinto*, no *pega más*. Ya no puedes sustituir a los Axies por
setas: si quitas las partes, no hay dado, y si no hay dado, no hay juego.

**Gameplay (25 %):** la decisión se multiplica sin añadir sistemas. La misma tirada se
puede jugar de varias formas según a quién la asignes y dónde esté. Y la Ascensión gana
sentido: **ascender ya no sube ATQ, evoluciona una parte** — que es literalmente lo que
hace la Ascensión en Axie.

### Qué es original y qué no (declararlo en la entrega)

- **No es original:** el táctico de rejilla con invocación desde zona propia y victoria por
  "mata al líder rival" es el esqueleto de Summoner Wars. Los dados de acción con caras que
  son habilidades existen (Dice Throne, Roll Player, King of Tokyo). No reclamar ninguna.
- **Sí es original:** que las caras del dado sean las partes del cuerpo de una criatura
  coleccionable, y que la evolución de una parte reescriba una cara concreta del dado. Eso
  convierte la genética de Axie —que en todos los juegos del ecosistema es un bloque de
  estadísticas o un mazo de cartas— en una distribución de probabilidad que el jugador va
  moldeando. No se ha encontrado nada así ni dentro ni fuera del ecosistema Axie.

**Esa frase es el pitch de una línea. Usar tal cual en el formulario.**

---

## 4. Qué se descartó

- **Cozy de gestión de ecosistema:** juego distinto, tiraría el código a la basura, y es
  lo más difícil de hacer divertido en dos semanas.
- **Capa de scouting / fantasy sobre la ladder de Origins:** no aprovecha nada de lo hecho
  y depende de verificar que la Origins API dé resultados por Axie. **Guardada** como
  posible modo secundario a largo plazo.
- El razonamiento completo de ambas está en `docs/estudio-mercado-2026.md`, sección 3.

---

## 5. Qué se tomó del hilo de @MukeGaming

Dos cosas suyas ya estaban en la arquitectura sin nombrar. Son patrones económicos
genéricos, no su diseño concreto:

**La estructura de dos capas.** Muke propone un coleccionable (comandante) + una pila de
comunes. El juego ya tiene eso: **el Lord es el Axie coleccionable, el roster es la tropa**.
Resuelve el coste de entrada de un jugador nuevo: un solo activo caro.

**El sink asimétrico.** Cuando una criatura llega a 0 hace `alive: false, pos: null` y
desaparece para siempre; el Lord solo pierde corazones. Eso ya *es* el sistema de Muke
(comandante se hiere y se cura, comunes se destruyen), implementado sin nombre. Es la
respuesta al problema de sinks que hundió al P2E.

**Para la visión de producto (20 %)**, la mejor idea suya es la **suscripción para
acuñar**: los objetos son de juego por defecto y se paga una cuota mensual por el derecho a
convertirlos en NFT. Agnóstica de género, ingreso recurrente que no es venta de poder, y
encaja con hacia dónde va Ronin. **Citarla como patrón de industria, no como invento
propio.**

**Lo que no se coge:** el RTS (inviable en la ventana) y los raids que roban el 20 %
(expulsa jugadores nuevos, que es lo que el mercado ya no perdona).

---

## 6. Plan de los 13 días de Ronda 1

**Días 1–3 · La conversión del dado — HECHO**
- Roster con `parts: { eyes, ears, horn, mouth, back, tail }` y clase derivada del genoma.
- `makeDie()` genera las caras desde las partes.
- Seis tipos de cara: invocación, golpe, perforante, drenaje, guardia, impulso.
- Ascensión evoluciona la parte usada y reescribe esa cara.
- Se tira por todas las criaturas cada turno, no solo por las que están fuera.

**Días 4–6 · Que se entienda al mirarlo**
- Assets reales con `@axieinfinity/mixer` en lugar de los cuadros de color.
- **La carta de criatura muestra el dado con sus seis partes** (hecho en versión básica;
  falta que sean Axies dibujados, no texto).
- Feedback visual al ascender: qué parte evolucionó y en qué se convirtió la cara.

**Días 7–9 · Profundidad**
- IA enemiga con más criterio (hecho parcialmente: ya prioriza rematar al herido).
- Dos o tres enemigos con partes distintas, para que se note que el genoma cambia el
  combate.
- Ajuste de ritmo: revisar el spawn cada 3 turnos y los 3 corazones del Lord ahora que las
  criaturas actúan cada turno.

**Días 10–11 · La entrega**
- Desplegar (Vercel o Netlify desde Vite).
- Vídeo de respaldo.
- **Declaración de encaje con Axie Core — no dejarla para el final**, vale el 35 %.
- Instrucciones de control y primer contacto (el README ya sirve de base).

**Días 12–13 · Colchón**
- Playtest con alguien que no lo haya visto nunca. Si no entiende el dado en un minuto, el
  problema es de interfaz, no de diseño.
- Margen para lo que salga mal.

---

## 7. Resumen en cuatro líneas

Un táctico de dados bien elegido: no es 4X, es de sesión corta, corre en navegador y no
colisiona con nada de Ronin. Su único fallo grave era que las criaturas podían ser
cualquier cosa, y Axie Core vale el 35 % de la nota. La solución no fue cambiar de juego,
fue **hacer que las seis caras del dado sean las seis partes del cuerpo del Axie**, con la
Ascensión evolucionando partes concretas. Resuelve el problema de nota y el de profundidad
a la vez, y da un pitch de una frase que nadie más va a llevar.
