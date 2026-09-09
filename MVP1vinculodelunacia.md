# Vínculo de Lunacia — MVP 1
## Documento de trabajo. Fuente de verdad para construir.

**Versión:** 1.0 · 8 de septiembre de 2026
**Para:** el desarrollador. Se puede seguir sin haber leído el GDD.
**Contexto (opcional):** `GDD-vinculo-de-lunacia-v3.md` explica *por qué*. Este archivo dice *qué*.

**Todo lo de aquí está decidido.** Los valores marcados *(prov.)* son provisionales: se cambiarán con playtest, pero se construyen con ese número, no se dejan abiertos.

---

## 1. Qué es el MVP 1

Un táctico por turnos, en navegador, de **asedio a una torre**.

> **Objetivo del MVP 1: que los Axies, según su clase y sus partes, tengan habilidades definidas y que se pueda jugar.**

Cada bando tiene un **Lord inmóvil** (la torre) y **3 Axies móviles**. Ganas reduciendo a 0 la vida del Lord rival. Cada unidad tiene un dado cuyas caras son sus partes del cuerpo; tirar no dice cuánto pegas, dice **qué puedes hacer este turno**.

Alrededor del combate hay lo mínimo para que signifique algo: un territorio PVE de 5 nodos, dos recursos, dos edificios y un puñado de desbloqueos.

**No hay:** blockchain, PVP, equipo, acuñación, mercado, energía, convalecencia, recolección.

---

## 2. Las 4 clases

Cuatro roles deliberadamente incompatibles entre sí. Si dos se parecen, una sobra.

| Clase | Rol | Vida | Movimiento | Alcance | Ataque básico |
|---|---|---|---|---|---|
| **Plant** | Tanque | 12 | 1 | 1 | 1 |
| **Beast** | Soldado | 9 | 2 | 1 | 2 |
| **Bird** | Arquero | 7 | 2 | **3** | 1 |
| **Aqua** | Asesino | 7 | **3** | 1 | 2 |

**Lord** (ambos bandos): vida **24** · movimiento **0** · alcance **2** · ataque de torre **3**.

*(Todos los valores prov.)*

**Por qué estas cuatro y no un mago:** el mago tendría movimiento 2 y alcance 2 — duplica al soldado en movilidad y al arquero en alcance, se solapa con el papel de utilidad del Lord, y necesita un sistema de estados que el MVP no tiene. El asesino, en cambio, es la única unidad rápida del juego, es la única que puede usar el terreno de agua, y es lo que impide que las partidas se atasquen. Dawn y Dusk entran en el MVP 2.

### 2.1 Regla del ataque básico

> Toda unidad puede atacar siempre con el **ataque básico de su clase**, salga la cara que salga. Ninguna combinación de partes produce una unidad incapaz de actuar.

---

## 3. Las partes

Doce partes de combate: **3 por ranura × 4 ranuras**, y **3 por clase**. Los nombres son del catálogo real de Axie; **las habilidades y los números son nuestros**.

En Axie las cartas de combate salen de **cuerno, boca, lomo y cola**. Ojos y orejas no producen carta, y aquí tampoco: dan caras de utilidad.

### 3.1 Cuerno — ofensivo penetrante

| # | Parte | Clase | Habilidad | Valor |
|---|---|---|---|---|
| H1 | **Little Branch** | Plant | Perforante: ignora el escudo del objetivo | 2 |
| H2 | **Imp** | Beast | Perforante: ignora el escudo. **+1 si el objetivo está por debajo de la mitad de su vida máxima** | 3 |
| H3 | **Feather Spear** | Bird | Ataque a distancia con **+1 de alcance** sobre el del chasis | 2 |

### 3.2 Boca — sostenimiento

| # | Parte | Clase | Habilidad | Valor |
|---|---|---|---|---|
| M1 | **Serious** | Plant | Golpe. **El atacante gana 2 de escudo** | 2 |
| M2 | **Risky Fish** | Aqua | Golpe fuerte. **El atacante se hace 1 de daño** (ignora su propio escudo) | 4 |
| M3 | **Nut Crack** | Beast | Golpe. **+2 si este mismo Axie lleva también Nut Throw** | 3 |

### 3.3 Lomo — defensivo

| # | Parte | Clase | Habilidad | Valor |
|---|---|---|---|---|
| B1 | **Pumpkin** | Plant | Guardia. **Se aplica al tirar y no gasta la acción** | 3 |
| B2 | **Clam Shell** | Aqua | Guardia **y cura 1** de vida. Se aplica al tirar, no gasta la acción | 2 |
| B3 | **Balloon** | Bird | Guardia **y empuja 1 casilla** a un enemigo adyacente, en línea recta. Se aplica al tirar, no gasta la acción | 2 |

### 3.4 Cola — movilidad y control

| # | Parte | Clase | Habilidad | Valor |
|---|---|---|---|---|
| T1 | **Nut Throw** | Beast | Ataque a **distancia 2** (independiente del alcance del chasis). **+2 si lleva también Nut Crack** | 2 |
| T2 | **Shrimp** | Aqua | Impulso: **mueve hasta 2 y ataca al final**. El movimiento sigue sujeto a zona de control | 2 |
| T3 | **Pigeon Post** | Bird | Reposiciona: **mueve 1 casilla a un aliado adyacente**. No ataca | — |

### 3.5 Ojos y orejas

En el MVP 1 **no se eligen**. Producen **caras de invocación**. Se diseñan en el MVP 2.

### 3.6 Afinidad de clase

> Si la clase de la parte coincide con la clase del chasis, **el valor de esa cara sube +1**.

Es la única razón por la que un Axie puro rinde más que un híbrido, y es la decisión de construcción central del juego.

*Ejemplo:* **Imp** (Beast) en un chasis Beast → perforante **4**. El mismo Imp en un chasis Aqua → perforante **3**.

### 3.7 Estructura de datos sugerida

```json
{
  "id": "imp",
  "nombre": "Imp",
  "ranura": "cuerno",
  "clase": "beast",
  "efecto": "perforante",
  "valor": 3,
  "modificadores": [
    { "cuando": "objetivo_bajo_50pc_vida", "valor": 1 }
  ]
}
```

```json
{
  "id": "plant",
  "rol": "tanque",
  "vida": 12,
  "movimiento": 1,
  "alcance": 1,
  "ataqueBasico": 1
}
```

---

## 4. Los dados

### 4.1 Dado de unidad

| Unidad | Caras de combate | Caras de utilidad | Invocación extra | **Total** |
|---|---|---|---|---|
| **Estándar** | 3 | 0 | 0 | **3** |
| **NFT fase 1** | 4 (cuerno, boca, lomo, cola) | 0 | 1 | **5** |

En el MVP 1 solo existen **estándar** y **fase 1**. Las fases 2 y 3 (5 y 6 partes) son MVP 2.

Las unidades estándar llevan 3 de las 4 partes de combate, todas de su propia clase → **siempre con afinidad**.

### 4.2 Dado del Lord — 6 caras

| Cara | Contenido |
|---|---|
| 1 | **Ataque de torre** — daño 3, alcance 2 |
| 2 | **Invocación** |
| 3 | **Invocación** |
| 4 | **Ranura de habilidad** — bloqueada |
| 5 | **Ranura de habilidad** — bloqueada |
| 6 | **Ranura de habilidad** — bloqueada |

> **Una ranura bloqueada se comporta como Invocación.**

Un Lord sin mejorar tiene **5 caras de 6 que invocan**: es una fábrica. Cada habilidad que desbloqueas lo hace más peligroso y menos generoso.

**Esto no es un adorno: es la válvula anti-bola-de-nieve.** Con solo 3 móviles, perder uno pronto decidiría la partida si no hubiera reposición constante. No bajar las invocaciones del Lord base sin sustituir la válvula por otra cosa.

### 4.3 Habilidades del Lord

Se desbloquean con **Esencia**, una por ranura.

| Habilidad | Efecto | Coste |
|---|---|---|
| **Muro** | Da **3 de escudo** a un aliado a alcance 3 | 2 Esencia *(prov.)* |
| **Llamada** | Invoca **2 unidades** de la reserva en el mismo turno | 3 Esencia *(prov.)* |
| **Marca** | Un enemigo a alcance 3 recibe **+2 de daño** del próximo ataque que le impacte | 3 Esencia *(prov.)* |

---

## 5. Reglas de combate

1. **Formato: 4 contra 4.** Un Lord inmóvil + 3 unidades móviles por bando.
2. **Tablero 8×6.** La casilla del Lord **la fija el mapa**, no el jugador.
3. **Reserva de 3** unidades fuera del tablero por bando.
4. **Victoria:** reducir a 0 la vida del Lord rival.
5. **Reloj: 12 turnos** *(prov.)*. Al terminar el turno 12 sin Lord caído, gana quien conserve **mayor porcentaje de vida** en su Lord. Empate exacto → gana el defensor.
6. **ZONA DE CONTROL.** Cuando una unidad **entra** en una casilla adyacente (ortogonal) a una unidad enemiga viva, **su movimiento termina inmediatamente**. No se puede pasar de largo. ← *Sin esta regla el juego es una carrera a la torre y no funciona. Es la primera regla que hay que implementar.*
7. **Un dado por unidad**, tirado **una vez al inicio del turno**, por todas las unidades vivas del jugador activo, estén dentro o fuera del tablero.
8. **Una acción por unidad y turno.** El jugador elige el orden.
9. **Movimiento:** hasta el valor del chasis, en ortogonal. Diagonal no.
10. **Alcance:** distancia Manhattan. El ataque no requiere adyacencia si el alcance es mayor que 1.
11. **Las caras de guardia se aplican solas al tirar y NO gastan la acción.** La unidad puede además moverse o atacar.
12. **Escudo:** absorbe daño y **dura hasta el final del siguiente turno rival**. No se acumula entre turnos: al aplicarse uno nuevo, sustituye al anterior si es mayor.
13. **Perforante ignora el escudo**, no la vida.
14. **Invocación (unidad fuera del tablero):** esa unidad entra en la zona de despliegue propia.
15. **Invocación (unidad en el tablero, o Lord):** saca **una unidad de la reserva** a una casilla libre **adyacente al invocador**. Si no hay casilla libre, la cara se pierde.
16. **Los refuerzos del Lord aparecen junto al Lord**, es decir, por detrás. Avanzar tiene coste logístico.
17. **Muerte:** vida a 0 → la unidad sale del tablero. En el MVP 1 **las estándar se pierden definitivamente** al terminar el combate; no hay tirada de convalecencia porque no hay PVP.
18. **El Lord no se mueve nunca.** Ni empujado, ni reposicionado.
19. **El empuje de Balloon** no puede meter a una unidad en piedra ni fuera del tablero: si no hay hueco, no empuja.
20. **Afinidad:** +1 al valor de la cara si la clase de la parte coincide con la del chasis.

---

## 6. Terreno

Los cuatro tipos entran completos en el MVP 1. Con solo 3 piezas móviles, **el terreno es lo que hace que haya partida**: en campo abierto, un 3v3 se juega solo.

| Tipo | Regla |
|---|---|
| **Piedra** | Infranqueable. No se puede entrar ni disparar a través |
| **Zona lenta** (pradera) | Entrar cuesta **2 puntos de movimiento** en vez de 1 |
| **Agua** | **Solo entran unidades Aqua.** Ruta de flanqueo exclusiva |
| **Obstáculo bajo** | Bloquea el movimiento, **no** la línea de tiro |

### 6.1 Especificación de los 3 mapas

Reglas que todo mapa debe cumplir:

- **Al menos 2 rutas** distintas hasta el Lord rival. Con una, es un tapón; con cuatro, la zona de control no da para cubrirlas y vuelve la carrera.
- **Al menos 1 cuello de botella de 1 casilla.**
- Los dos Lords en posiciones **simétricas**.
- Entre 8 y 14 casillas de terreno especial sobre las 48 del tablero.

| Mapa | Carácter | Composición |
|---|---|---|
| **1. El Corredor** | Enseña la zona de control | Un muro de piedra central con dos pasos de 1 casilla |
| **2. Los Bajíos** | Enseña el flanqueo Aqua | Franja de agua lateral que rodea la línea principal |
| **3. La Ciénaga** | Enseña el coste del movimiento | Zona lenta amplia en el centro; obstáculos bajos para el arquero |

---

## 7. Recursos

| Recurso | Se gana | Se gasta en |
|---|---|---|
| **Material** | Cada nodo PVE completado | Producir unidades estándar |
| **Esencia** | Solo del jefe del territorio | Desbloquear habilidades del Lord y partes nuevas |

Sin recolección, sin topes, sin decaimiento. Dos números en una cabecera.

**Costes de producción** *(prov.)*:

| Unidad | Coste en Material |
|---|---|
| Plant (tanque) | 4 |
| Beast (soldado) | 3 |
| Bird (arquero) | 3 |
| Aqua (asesino) | 3 |

---

## 8. Base — 2 edificios

Interfaz de **menú**. Sin cámara, sin unidades andando, sin temporizadores largos.

| Edificio | Función |
|---|---|
| **Cuartel** | Produce unidades estándar de las clases desbloqueadas. Cuesta Material |
| **Santuario** | Desbloquea las 3 habilidades del Lord. Cuesta Esencia |

---

## 9. PVE — 1 territorio

- **5 nodos:** 4 combates + 1 jefe, en línea.
- La dificultad sube por **composición enemiga**, nunca por estadísticas infladas.
- Cada nodo normal da **3 Material** *(prov.)*. El jefe da **5 Esencia** *(prov.)*.
- El jefe es una **tribu pura**: todas sus unidades comparten clase y tienen afinidad completa.
- **Vencer al jefe desbloquea las 3 partes de su clase**, que pasan a poder usarse en cualquier chasis.

| Nodo | Enemigo | Enseña |
|---|---|---|
| 1 | 2 estándares Beast | El turno y el dado |
| 2 | 1 Plant + 1 Beast | Que el tanque bloquea |
| 3 | 1 Bird + 2 Beast | Que el alcance duele |
| 4 | 1 Plant + 1 Aqua + 1 Bird | Composición mixta |
| 5 | **Jefe:** Lord + 3 Aqua puros | Que el flanqueo mata |

**IA enemiga mínima:** priorizar en este orden — (1) rematar a la unidad enemiga con menos vida al alcance, (2) atacar al Lord si está al alcance, (3) avanzar hacia el Lord por la ruta más corta que no esté bloqueada, (4) si está bloqueada, atacar a quien bloquea.

---

## 10. Orden de construcción

Cada paso deja algo comprobable. No pasar al siguiente sin cerrar el anterior.

| # | Paso | Comprobable cuando |
|---|---|---|
| 1 | Tablero 8×6, colocación de Lord y 3 móviles, turnos alternos | Se ven las piezas y se pasa turno |
| 2 | Movimiento por chasis + **zona de control** | Una unidad no puede pasar de largo junto a un enemigo |
| 3 | Ataque básico, vida, muerte, victoria por Lord a 0 | Se puede ganar una partida |
| 4 | Terreno: piedra, zona lenta, agua, obstáculo bajo | El Aqua entra en el agua y los demás no |
| 5 | Dados de unidad (3 y 5 caras) y las 12 partes con sus efectos | Cada cara hace algo distinto y visible |
| 6 | Afinidad de clase (+1) | La misma parte rinde distinto en dos chasis |
| 7 | Escudos y reglas de guardia sin gasto de acción | Pumpkin absorbe un golpe entero |
| 8 | Dado del Lord, invocación, reserva de 3 | El Lord repone bajas |
| 9 | Reloj de 12 turnos y desempate por % de vida | Una partida termina sin que caiga nadie |
| 10 | IA enemiga con las 4 prioridades | Se puede perder |
| 11 | Los 3 mapas | Las tres partidas se sienten distintas |
| 12 | Habilidades del Lord y desbloqueo con Esencia | Muro cambia el resultado de un turno |
| 13 | Base: Cuartel y Santuario | Se produce una unidad y se gasta Material |
| 14 | Territorio PVE de 5 nodos con botín y desbloqueo de partes | Se completa una campaña corta |

**Interfaz, prioridad máxima dentro de cada paso:** la carta de unidad tiene que mostrar arriba el **chasis** (vida / movimiento / alcance) y abajo las **caras con el color de la clase de cada parte**, con la afinidad marcada. Si no se ve de un vistazo qué es puro y qué es híbrido, el sistema no existe para el jugador.

---

## 11. Fuera del MVP 1

| Fuera | Va a |
|---|---|
| Integración on-chain, lectura de genomas reales | MVP 2 |
| Fases NFT 2 y 3 (5 y 6 partes) | MVP 2 |
| Partes de ojos y orejas | MVP 2 |
| Convalecencia y tirada de muerte de NFT | MVP 2 (solo en PVP) |
| PVP en cualquier forma | MVP 2 |
| Reptile, Bug, Mech, Dawn, Dusk | MVP 2 |
| Sistema de estados (bonificadores y penalizadores) | MVP 2 |
| Recolección de recursos con Axies | MVP 2 |
| Topes y probabilidad de recursos | MVP 2 |
| Territorios 2 a 6 de Lunacia | MVP 2 |
| Equipo, objetos, fabricación, inventario | MVP 3 |
| Acuñación, suscripción, mercado | MVP 3 |
| Sistema de energía | Descartado |
| Cuatro recursos | Descartado |
| Base en tiempo real estilo *Imperivm* | Descartado |

---

## 12. Criterio de salida

> Alguien que no lo ha visto nunca juega **tres partidas seguidas por voluntad propia**, y al terminar **sabe explicar por qué perdió una de ellas**.

La segunda parte importa tanto como la primera. Si no sabe explicar la derrota, la partida se está decidiendo por azar y el problema está en el dado o en el terreno — no en la falta de contenido.

**Tres señales de alarma que hay que vigilar desde el primer playtest:**

1. **Las partidas se deciden por el reloj del turno 12** en vez de por muerte del Lord → atacar sale demasiado caro. Bajar la vida del Lord o subir el daño.
2. **Nadie usa el asesino** → el terreno de agua no está bien colocado, o el movimiento 3 no compensa tener 7 de vida.
3. **El tanque no aparece nunca en las composiciones** → la zona de control no está haciendo su trabajo, o los corredores son demasiado anchos.
