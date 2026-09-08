# Vínculo de Lunacia — Alpha (Ronda 1, Axie Vibeathon)

> Un táctico por turnos donde el dado de cada Axie está hecho de sus seis partes del
> cuerpo, y ascender no sube un número: evoluciona una parte y reescribe esa cara.

## Arrancar

```
npm install
npm run dev
```

Abre la URL que muestre la terminal (normalmente http://localhost:5173).

## La idea en treinta segundos

Cada Axie tiene seis partes: ojos, orejas, cuerno, boca, lomo y cola. **Esas seis partes
son las seis caras de su dado.** Tirar no dice "cuánto pego", dice **qué puedo hacer este
turno**:

| Cara | Efecto |
|---|---|
| ✦ Invocación | Fuera del tablero: entra. Dentro: reposiciona (mueve 2). |
| ⚔ Golpe | Ataque normal, la DEF lo reduce. |
| ➤ Perforante | Ignora la DEF del objetivo. |
| ♥ Drenaje | Ataca y te cura 1. |
| ◉ Guardia | Escudo inmediato, se aplica solo al tirar. Dura un turno. |
| ⇉ Impulso | Mueve hasta 2 y puede atacar. |

Qué cara tiene cada parte depende de **qué parte concreta** llevas: un cuerno *Imp*
perfora por 3, un *Little Branch* por 2, un *Cactus* ni siquiera ataca, da guardia. Dos
Axies con el mismo esqueleto pero distinto genoma juegan distinto.

Las dos crías de partida están construidas como opuestas a propósito: **Ascua** es
agresiva (cuerno Imp perforante, boca que drena, cola con impulso) y **Musgo** es
defensiva (orejas y lomo que dan guardia, más DEF, cola de golpe fiable).

## Controles

1. **Tirar dados** — se tira por todas tus criaturas, estén o no en el tablero. Las
   caras de guardia aplican su escudo solas.
2. Una criatura **fuera del tablero** solo actúa si le sale invocación: toca una casilla
   marcada cerca de tu Lord para colocarla. Con cualquier otra cara, espera.
3. Una criatura **en el tablero** hace lo que diga su cara. Tócala para seleccionarla (o
   usa "Seleccionar en tablero") y las casillas a su alcance se iluminan. Toca una casilla
   para moverte o un enemigo adyacente para atacar.
4. Cada criatura actúa **una vez por turno**. Al gastarse se atenúa.
5. **Terminar turno**: los enemigos priorizan rematar a la criatura más herida que tengan
   al lado; si no, van a por tu Lord. Cada tres turnos aparece uno nuevo.
6. Gana quien baje a 0 los corazones del Lord rival.

## Qué es real y qué está simulado

- **Partes y clases: reales.** Los nombres de partes (Imp, Little Branch, Hermit, Nut
  Cracker…) y las clases (Beast, Aquatic, Plant, Bird, Bug, Reptile) son del sistema real
  de Axie. La clase de una criatura se deriva de la mayoría de su genoma, como en Axie.
- **AXP y Ascensión: sistema real, umbral abstraído.** En Axie, la AXP es off-chain, los
  niveles son on-chain y **la Ascensión ocurre en los niveles 10, 20 y 30 y requiere que
  el usuario firme una transacción**. Aquí el umbral es de 3 AXP y la Ascensión es
  inmediata, para que la progresión se vea dentro de una partida de demostración. Es una
  abstracción deliberada, no un malentendido del sistema.
- **Dado e invocación: mecánica propia del prototipo**, no del juego original.
- **Sin integración on-chain.** Las bases del Vibeathon la marcan como opcional en fase
  de prototipo, y la AXP API requiere una app aprobada en el Ronin Developer Console con
  permiso explícito del servicio AXP.
- **IA enemiga: simple.** Prioriza rematar al herido y avanza hacia tu Lord. Suficiente
  para demostrar el loop, no para un balance final.
- **Arte: marcadores de posición.** Cuadros de color con el borde teñido por la clase.

## Siguientes pasos

- Sustituir los cuadros por Axies reales con `@axieinfinity/mixer` (requiere
  `pixi.js@7.2.4` y `pixi-spine@4.0.3`).
- Afinidad de clase por terreno en el tablero (Aquatic por agua, Bird ignora obstáculos).
- Escena explorable previa al combate.
- Ritual de Ascensión con pantalla propia en lugar del aviso actual.
- Desplegar, grabar el vídeo de respaldo y escribir la declaración de encaje con Axie Core.

El contexto completo del proyecto, las decisiones de diseño y las referencias del tooling
de Sky Mavis están en `CLAUDE.md`.
