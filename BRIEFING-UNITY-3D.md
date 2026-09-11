# Vínculo de Lunacia — Briefing completo para desarrollo

> **Documento para IA de pago.** Todo lo que necesitas saber para construir el juego.
> No falta nada. No inventes nada que no esté aquí.

---

## ⚠️ NOTA TECNOLÓGICA CRUCIAL: Terrariums NO usa Unity

**Descubierto analizando el código fuente de terrariums.axieinfinity.com (sep 2026):**

```html
<script src="/assets/phaser-B6j8tVY_.js"></script>        ← Phaser 3 (framework 2D web)
<script src="/assets/spine-phaser-B8CcmusM.js"></script>   ← Spine-Phaser (animaciones Axies)
<script src="/assets/axie-mixer-C1WHLpj6.js"></script>    ← @axieinfinity/mixer (npm)
<div id="react-root"></div>                                 ← React (UI overlay)
```

**Terrariums es 100% web, 2D, usando exactamente nuestro stack:**
- **Phaser 3** — framework de juegos 2D para HTML5/WebGL
- **Spine** — animaciones esqueléticas 2D de los Axies
- **@axieinfinity/mixer** — el MISMO paquete npm que ya usamos en `axieMixer.js`
- **React** — UI overlay (menús, inventario, etc.)

**Esto significa que si quieres que Vínculo de Lunacia se parezca a Terrariums, la opción más natural NO es Unity sino mantenernos en web con Phaser como base del motor de juego.** Unity sería needed si quieres 3D real o mobile nativo, pero Terrariums demuestra que el estilo visual que buscas (pueblo/naturaleza, Axies 2D animados, UI limpia) se consigue perfectamente en Phaser.

**Opciones:**
1. **Phaser + React + mixer** (como Terrariums) — **DECISIÓN TOMADA POR EL USUARIO (sep 2026): ESTA ES LA OPCIÓN.** Más rápido, ya tenemos el mixer funcionando, se ve como Terrariums.
2. ~~Unity WebGL~~ — descartado. Más pesado, peor rendimiento en browser, innecesario para lograr el look de Terrariums.
3. ~~React + CSS 3D~~ — descartado. Funciona pero sin motor de juego formal para un jugo completo.

> **Decisión final del usuario (9 sep 2026): desarrollar el juego en Phaser 2D web, replicando el stack y estilo de Terrariums.** Todo lo de este briefing se aplica a Phaser salvo que se indique lo contrario.

---

## 1. EL JUEGO EN UNA FRASE

> Un táctico por turnos donde el dado de cada Axie está hecho de sus partes del cuerpo,
> y ascender no sube un número: evoluciona una parte y reescribe esa cara.

---

## 2. QUÉ ES (resumen ejecutivo)

- **Género:** Táctico por turnos sobre rejilla (estilo Summoner Wars / Chess)
- **Plataforma:** WebGL en navegador (exportable a PC/mobile después)
- **Partida:** 1v1, ~5-10 minutos
- **Formato:** 4 unidades por bando (1 Lord inmóvil + 3 Axies móviles)
- **Tablero:** 8×7 casillas
- **Objetivo:** Reducir a 0 la vida del Lord rival
- **Mecánica estrella:** Cada Axie tiene un dado de 3-6 caras; cada cara es una parte de su cuerpo con un efecto distinto
- **No hay:** blockchain, PVP en MVP1, equipo, acuñación, mercado, energía, recolección

---

## 3. RECURSOS DE AXIE (LO QUE SÍ EXISTE Y HAY QUE USAR)

### 3.1 Para Axies 3D en Unity

**Kit oficial de Sky Mavis:**
- `github.com/axieinfinity/unity-axie-gtk3d` — Modelos 3D y animaciones de Axies (Buba, Puffy, Pomodoro)
- `github.com/axieinfinity/unity-axie-mixer3d` — Librería para ensamblar Axies 3D combinando partes modulares en runtime
- `github.com/axieinfinity/unity-axie-gtk2d` — Toolkit 2D (sprites, cards, VFX de Origins)
- `github.com/axieinfinity/axie-origins-asset-kit` — VFX de batalla, animaciones del mixer, efectos de sonido, iconos de status (privado, solicitar acceso)

**Cómo funciona el mixer 3D:**
- Cada Axie se construye a partir de: clase + 6 partes (eyes, ears, horn, mouth, back, tail)
- `unity-axie-mixer3d` ensambla las partes modulares en runtime
- Necesitas los assets de Spine/texturas de `axiecdn.axieinfinity.com/mixer-stuffs/`
- Para el prototipo: usar los 3 Axies de ejemplo del kit (Buba=Beast, Puffy=Bird, Pomodoro=Plant) como base

**Alternativa si no consigues el kit 3D:**
- Assets placeholder de la comunidad: `github.com/jaatster/axie-3d-assets` (modelos genéricos, no son los Axies reales)
- O empezar con cápsulas/planos con colores de clase y texto, y sustituir por Axies 3D cuando lleguen los assets

### 3.2 Estilo visual de Terrariums (la referencia que queremos copiar)

**Paleta de colores:**
- Verde menta pastel como color dominante (hierba, hojas)
- Marrón cálido para estructuras de madera (vallas, troncos)
- Fondo con viñeteado que centra la atención en el centro
- Colores de clase: Plant=#71c14b, Beast=#f0a04b, Bird=#ef6f9c, Aqua=#3fa9e0

**Ambiente:**
- Pueblo/naturaleza: árboles, setas, vallas dispersos alrededor del área de juego
- Hierba tileada como fondo base
- Estilo tierno, redondeado, "cute" (estética Axie estándar)
- Sin espacio abstracto ni fondos oscuros

**Axies en Terrariums:**
- Renderizados como 2D Spine animations (esqueleto + animaciones)
- Se mueven con idle animation, attack animation, etc.
- Ocupan ~40-60px en el tablero
- Se ven nítidos, con todas las partes del cuerpo visibles

**UI:**
- Limpia, minimalista, con mucho espacio en blanco
- Paneles con bordes redondeados, opacidad ~80-90%
- Texto sans-serif, tamaños variados
- Iconos para recursos (Material, Esencia)
- Barras de vida sobre cada unidad

### 3.3 Para entorno 3D (si se elige Unity)

- **Kenney Tiny Town** (CC0): `kenney.nl/assets/tiny-town` — árboles, setas, vallas, estructuras de pueblo
- **Kenney Survival Kit** (CC0): `kenney.nl/assets/survival-kit` — rocas, árboles, hierba, estructuras
- **Kenney Mini Forest** (CC0): `kenney.nl/assets/mini-forest` — bosque denso
- **Kenney Kit Battle** (CC0): `kenney.nl/assets/kit-battle` — efectos de combate
- Licencia CC0 verificada. Se pueden usar libremente.

### 3.3 Referencia visual

- **Terrariums** (juego de Sky Mavis): `terrariums.axieinfinity.com` — pueblo/naturaleza, estilo pastel, tierno
- **Axie Infinity: Origins** — UI de combate, efectos, kartas
- **Boceto del usuario:** `src/assets/deseables/campo_combate.png` — tablero como losa maciza rectangular
- **Fondo de Terrariums:** hierba, árboles, setas, valla dispersos, viñeteado centrando en el tablero

---

## 4. LAS 4 CLASES

| Clase | Rol | Vida | Movimiento | Alcance | Ataque básico | Color |
|---|---|---|---|---|---|---|
| **Plant** | Tanque | 120 | 1 | 1 | 10 | `#71c14b` (verde) |
| **Beast** | Soldado | 90 | 2 | 1 | 20 | `#f0a04b` (naranja) |
| **Bird** | Arquero | 70 | 2 | **3** | 10 | `#ef6f9c` (rosa) |
| **Aqua** | Asesino | 70 | **3** | 1 | 20 | `#3fa9e0` (azul) |

**Lord (ambos bandos):**
- Vida: **240**
- Movimiento: **0** (inmóvil)
- Alcance: **2**
- Ataque de torre: **30**
- Posición: fila central del lado propio

**Regla 2.1 — Ataque básico:** Toda unidad puede atacar siempre con el ataque básico de su clase, salga la cara que salga.

**Regla 2.1.1 — Primer contacto:** Si el movimiento de este turno mete a la unidad al alcance de un rival **por primera vez**, gana el ataque básico en la misma acción. Si ya estaba al alcance antes de moverse, el ataque básico solo entra como respaldo cuando la cara no ofrece un ataque propio.

---

## 5. LAS PARTES (12 partes de combate)

Las partes van en 4 ranuras: **cuerno** (ofensivo penetrante), **boca** (sostenimiento), **lomo** (defensivo), **cola** (movilidad/control).

### 5.1 Cuerno — ofensivo penetrante

| Parte | Clase | Habilidad | Valor | Efecto |
|---|---|---|---|---|
| **Little Branch** | Plant | Perforante | 20 | Ignora el escudo del objetivo |
| **Imp** | Beast | Perforante | 30 | Ignora escudo. +10 si objetivo por debajo de 50% vida |
| **Feather Spear** | Bird | Ataque a distancia | 20 | +1 de alcance sobre el del chasis |

### 5.2 Boca — sostenimiento

| Parte | Clase | Habilidad | Valor | Efecto |
|---|---|---|---|---|
| **Serious** | Plant | Golpe | 20 | El atacante gana 20 de escudo |
| **Risky Fish** | Aqua | Golpe fuerte | 40 | El atacante se hace 10 de daño (ignora su propio escudo) |
| **Nut Crack** | Beast | Golpe | 30 | +20 si este mismo Axie lleva también Nut Throw |

### 5.3 Lomo — defensivo

| Parte | Clase | Habilidad | Valor | Efecto |
|---|---|---|---|---|
| **Pumpkin** | Plant | Guardia | 30 | Se aplica al tirar y no gasta la acción |
| **Clam Shell** | Aqua | Guardia | 20 | Se aplica al tirar + cura 10 de vida. No gasta acción |
| **Balloon** | Bird | Guardia | 20 | Se aplica al tirar + empuja 1 casilla a un enemigo adyacente en línea recta. No gasta acción |

### 5.4 Cola — movilidad y control

| Parte | Clase | Habilidad | Valor | Efecto |
|---|---|---|---|---|
| **Nut Throw** | Beast | Ataque a distancia | 20 | Alcance 2 (independiente del chasis). +20 si lleva también Nut Crack |
| **Shrimp** | Aqua | Impulso | 20 | Mueve hasta 2 y ataca al final. Movimiento sujeto a zona de control |
| **Pigeon Post** | Bird | Reposiciona | — | Mueve 1 casilla a un aliado adyacente. No ataca |

### 5.5 Ojos y orejas

En MVP1 **no se eligen**. Producen caras de invocación. Se diseñan en MVP2.

### 5.6 Afinidad de clase

> Si la clase de la parte coincide con la clase del chasis, **el valor de esa cara sube +10**.

Ejemplo: Imp (Beast) en chasis Beast → perforante 40. Imp en chasis Aqua → perforante 30.

---

## 6. LOS DADOS

### 6.1 Dado de unidad

| Unidad | Caras de combate | Total |
|---|---|---|
| **Estándar** | 3 (cuerno, boca, lomo — todas de su clase) | **3** |
| **NFT fase 1** | 4 (cuerno, boca, lomo, cola) + 1 invocación | **5** |

### 6.2 Dado del Lord — 6 caras

| Cara | Contenido |
|---|---|
| 1 | **Ataque de torre** — daño 30, alcance 2 |
| 2 | **Invocación** |
| 3 | **Invocación** |
| 4 | **Ranura de habilidad** — bloqueada (= Invocación) |
| 5 | **Ranura de habilidad** — bloqueada (= Invocación) |
| 6 | **Ranura de habilidad** — bloqueada (= Invocación) |

Un Lord sin mejorar tiene 5 caras de 6 que invocan. Cada habilidad desbloqueada lo hace más peligroso y menos generoso.

### 6.3 Habilidades del Lord (se desbloquean con Esencia)

| Habilidad | Efecto | Coste |
|---|---|---|
| **Muro** | Da 30 de escudo a un aliado a alcance 3 | 2 Esencia |
| **Llamada** | Invoca 2 unidades de la reserva en el mismo turno | 3 Esencia |
| **Marca** | Un enemigo a alcance 3 recibe +20 de daño del próximo ataque | 3 Esencia |

---

## 7. REGLAS DE COMBATE (COMPLETAS — NO OMITIR NINGUNA)

1. **Formato:** 4 contra 4. Un Lord inmóvil + 3 unidades móviles por bando.
2. **Tablero 8×7** (8 columnas, 7 filas). La casilla del Lord la fija el mapa.
3. **Reserva de 3** unidades fuera del tablero por bando.
4. **Victoria:** reducir a 0 la vida del Lord rival.
5. **Reloj: 12 turnos.** Al terminar el turno 12 sin Lord caído, gana quien conserve mayor porcentaje de vida. Empate exacto → gana el defensor.
6. **ZONA DE CONTROL:** Cuando una unidad **entra** en una casilla adyacente (ortogonal) a una unidad enemiga viva, **su movimiento termina inmediatamente**. No se puede pasar de largo. **← ESTA ES LA REGLA MÁS IMPORTANTE. Sin ella el juego no funciona.**
7. **Un dado por unidad**, tirado una vez al inicio del turno, por todas las unidades vivas del jugador activo.
8. **Una acción por unidad y turno.** El jugador elige el orden.
9. **Movimiento:** hasta el valor del chasis, en ortogonal. No diagonal.
10. **Alcance:** distancia Manhattan. El ataque no requiere adyacencia si el alcance > 1.
11. **Las caras de guardia se aplican solas al tirar y NO gastan la acción.** La unidad puede además moverse o atacar.
12. **Escudo:** absorbe daño y dura hasta el final del siguiente turno rival. No se acumula entre turnos: al aplicarse uno nuevo, sustituye al anterior si es mayor.
13. **Perforante ignora el escudo**, no la vida.
14. **Invocación (unidad fuera del tablero):** entra en la zona de despliegue propia.
15. **Invocación (unidad en el tablero, o Lord):** saca una unidad de la reserva a una casilla libre adyacente al invocador. Si no hay casilla libre, la cara se pierde.
16. **Los refuerzos del Lord aparecen junto al Lord** (por detrás). Avanzar tiene coste logístico.
17. **Muerte:** vida a 0 → la unidad sale del tablero. En MVP1 las estándar se pierden definitivamente al terminar el combate.
18. **El Lord no se mueve nunca.** Ni empujado, ni reposicionado.
19. **El empuje de Balloon** no puede meter a una unidad en piedra ni fuera del tablero: si no hay hueco, no empuja.
20. **Afinidad:** +1 al valor de la cara si la clase de la parte coincide con la del chasis.

---

## 8. TERRENO

### 8.1 Tipos de terreno

| Tipo | Regla visual | Regla de juego |
|---|---|---|
| **Piedra** | Bloque sólido, alto, gris/roca | Infranqueable. No se puede entrar ni disparar a través |
| **Zona lenta** (pradera) | Hierba amarillenta/marsh | Entrar cuesta 2 puntos de movimiento en vez de 1 |
| **Agua** | Superficie azul, animación de ondas | Solo entran unidades Aqua. Ruta de flanqueo exclusiva |
| **Obstáculo bajo** | Cajas, troncos, setas bajas | Bloquea el movimiento, NO la línea de tiro |

### 8.2 Los 3 mapas

**Reglas que todo mapa debe cumplir:**
- Al menos 2 rutas distintas hasta el Lord rival
- Al menos 1 cuello de botella de 1 casilla
- Los dos Lords en posiciones simétricas
- Entre 8 y 14 casillas de terreno especial sobre las 48 del tablero

| Mapa | Carácter | Composición |
|---|---|---|
| **1. El Corredor** | Enseña la zona de control | Un muro de piedra central con dos pasos de 1 casilla |
| **2. Los Bajíos** | Enseña el flanqueo Aqua | Franja de agua lateral que rodea la línea principal |
| **3. La Ciénaga** | Enseña el coste del movimiento | Zona lenta amplia en el centro; obstáculos bajos para el arquero |

---

## 9. RECURSOS

| Recurso | Se gana | Se gasta en |
|---|---|---|
| **Material** | Cada nodo PVE completado (3 por nodo) | Producir unidades estándar |
| **Esencia** | Solo del jefe del territorio (5 por jefe) | Desbloquear habilidades del Lord |

**Costes de producción:**
| Unidad | Coste en Material |
|---|---|
| Plant | 4 |
| Beast | 3 |
| Bird | 3 |
| Aqua | 3 |

---

## 10. BASE — 2 EDIFICIOS

Interfaz de **menú** (sin cámara 3D, sin unidades andando):

| Edificio | Función |
|---|---|
| **Cuartel** | Produce unidades estándar de las clases desbloqueadas. Cuesta Material |
| **Santuario** | Desbloquea las 3 habilidades del Lord. Cuesta Esencia |

---

## 11. PVE — 1 TERRITORIO

5 nodos en línea: 4 combates + 1 jefe.

| Nodo | Enemigo | Enseña |
|---|---|---|
| 1 | 2 estándares Beast | El turno y el dado |
| 2 | 1 Plant + 1 Beast | Que el tanque bloquea |
| 3 | 1 Bird + 2 Beast | Que el alcance duele |
| 4 | 1 Plant + 1 Aqua + 1 Bird | Composición mixta |
| 5 | **Jefe:** Lord + 3 Aqua puros | Que el flanqueo mata |

**IA enemiga mínima (4 prioridades en orden):**
1. Rematar a la unidad enemiga con menos vida al alcance
2. Atacar al Lord si está al alcance
3. Avanzar hacia el Lord por la ruta más corta que no esté bloqueada
4. Si está bloqueada, atacar a quien bloquea

---

## 12. ARQUITECTURA TÉCNICA

### Opción A: Phaser + React + mixer (como Terrariums — RECOMENDADO)

```
src/
  game/
    config.ts              — Configuración de Phaser
    scenes/
      BootScene.ts         — Carga de assets
      BattleScene.ts       — Escena principal de combate
      MapScene.ts          — Mapa PVE
    entities/
      Unit.ts              — Clase base de unidades
      Lord.ts              — Lord inmóvil
      AxieUnit.ts          — Axie móvil
    systems/
      GridSystem.ts        — Tablero 8×7
      TurnSystem.ts        — Gestión de turnos
      CombatSystem.ts      — Resolución de combate
      DiceSystem.ts        — Tirada de dados
      TerrainSystem.ts     — Terreno y mapa
      AISystem.ts          — IA enemiga
    data/
      PartDatabase.ts      — Las 12 partes
      MapData.ts           — Los 3 mapas
      UnitStats.ts         — Stats por clase
    effects/
      ShieldEffect.ts      — Escudo
      PierceEffect.ts      — Perforante
      GuardEffect.ts       — Guardia
      PushEffect.ts        — Empuje
  ui/
    App.tsx                — React root
    BattleUI.tsx           — UI de combate (cartas, dados, botones)
    UnitCard.tsx           — Carta de Axie
    DiceRoll.tsx           — Dado animado
    HealthBar.tsx          — Barra de vida
    ResourceBar.tsx        — Material y Esencia
    MapUI.tsx              — UI del mapa PVE
  axieMixer.ts             — El que ya tenemos (adaptado a Phaser)
```

### Opción B: Unity (si se necesita 3D o mobile nativo)

### 12.1 Estructura de carpetas recomendada

```
Assets/
  Scripts/
    Core/
      GameManager.cs          — Estado global de la partida
      TurnManager.cs          — Gestión de turnos (tirada → acción → fin turno)
      GridManager.cs          — Tablero 8×7, casillas, terreno
      CombatResolver.cs       — Resolución de ataques, escudo, perforante, guardia
      DiceSystem.cs           — Tirada de dados, generación de caras por partes
    Units/
      Unit.cs                 — Clase base (HP, shield, movement, range, attack)
      Lord.cs                 — Lord inmóvil, dado de 6 caras, invocación
      AxieUnit.cs             — Axie móvil, dado de 3-5 caras
      UnitFactory.cs          — Crear Axies por clase/genoma
    Parts/
      Part.cs                 — Datos de una parte (id, name, class, face, power)
      Genome.cs               — 6 partes → dado de 6 caras
      PartDatabase.cs         — Las 12 partes con sus efectos
      AffinitySystem.cs       — Bonus +1 si parte coincide con clase del chasis
    Effects/
      ShieldEffect.cs         — Escudo, duración, sustitución
      PierceEffect.cs         — Perforante: ignorar escudo
      GuardEffect.cs          — Guardia: se aplica al tirar, no gasta acción
      PushEffect.cs           — Empuje de Balloon
      HealEffect.cs           — Cura de Clam Shell
      ComboEffect.cs          — +20 de Nut Crack/Nut Throw combo
    Terrain/
      TerrainType.cs          — Enum: None, Stone, Slow, Water, LowObstacle
      TerrainTile.cs          — Propiedades de una casilla
      MapData.cs              — Datos de un mapa (grid de terreno, posición Lords)
    AI/
      EnemyAI.cs              — Las 4 prioridades de la IA
    UI/
      UIManager.cs            — Todo el UI: cartas, dados, botones, log
      CardUI.cs               — Carta de Axie (chasis arriba, dado abajo)
      DiceUI.cs               — Dado animado con 3D
      ResourceBarUI.cs        — Material y Esencia
      HealthBarUI.cs          — Barra de vida sobre cada unidad
    Camera/
      CameraController.cs     — Cámara isométrica/side-view del tablero
  Prefabs/
    Units/
      Lord.prefab
      PlantAxie.prefab
      BeastAxie.prefab
      BirdAxie.prefab
      AquaAxie.prefab
    Terrain/
      StoneBlock.prefab
      WaterTile.prefab
      SlowTile.prefab
      LowObstacle.prefab
    UI/
      UnitCard.prefab
      DicePanel.prefab
      HealthBar.prefab
      TurnIndicator.prefab
    VFX/
      AttackVFX.prefab
      ShieldVFX.prefab
      HealVFX.prefab
      SummonVFX.prefab
  Materials/
    Terrain/
      Grass.mat
      Stone.mat
      Water.mat
      SlowGround.mat
    Units/
      PlantColor.mat
      BeastColor.mat
      BirdColor.mat
      AquaColor.mat
    UI/
      CardBackground.mat
  Scenes/
    MainMenu.unity
    Battle.unity
    Base.unity
    PvE_Map.unity
  ScriptableObjects/
    PartData.asset
    UnitStats.asset
    MapLayout.asset
    DiceFace.asset
  Resources/
    AxieModels/               — Modelos 3D de Axies (de unity-axie-gtk3d)
    KenneyAssets/              — Assets CC0 de Kenney
    VFX/                      — Efectos visuales
```

### 12.2 Clases de C# esenciales

```csharp
// Unit.cs — Clase base para todas las unidades
public class Unit : MonoBehaviour {
    public string unitId;
    public UnitClass unitClass;  // Plant, Beast, Bird, Aqua
    public int maxHp;
    public int currentHp;
    public int movement;         // Casillas máximo por turno
    public int range;            // Alcance de ataque (distancia Manhattan)
    public int basicAttack;      // Ataque básico de clase
    public int shield;           // Escudo actual
    public int shieldDuration;   // Turnos que dura el escudo
    public bool isLord;
    public Vector2Int gridPos;   // Posición en el tablero (columna, fila)
    public Genome genome;        // Las 6 partes → el dado
    public bool isAlive;
    public bool hasActed;        // Ya actuó este turno
    
    // Methods
    public void TakeDamage(int damage);
    public void ApplyShield(int amount);
    public bool CanMoveTo(Vector2Int target);
    public bool CanAttack(Vector2Int target);
    public void MoveTo(Vector2Int target);
    public void Attack(Unit target);
    public void Die();
}

// DiceSystem.cs — Tirada y resolución
public class DiceSystem {
    public DiceFace RollDice(Unit unit);  // Returns the face rolled
    public void ApplyGuardFaces(Unit[] allUnits);  // Aplica guardias al tirar
}

// GridManager.cs — Tablero
public class GridManager : MonoBehaviour {
    public const int WIDTH = 8;
    public const int HEIGHT = 7;
    public TerrainType[,] grid;
    public Unit[,] unitGrid;  // Qué unidad está en cada casilla
    
    public bool IsInControlZone(Vector2Int from, Vector2Int to);
    public List<Vector2Int> GetReachableTiles(Unit unit);
    public List<Vector2Int> GetAttackTargets(Unit unit);
    public int GetMovementCost(Vector2Int pos, UnitClass unitClass);
    public bool HasLineOfSight(Vector2Int from, Vector2Int to);
}

// EnemyAI.cs — IA con 4 prioridades
public class EnemyAI {
    public UnitAction ChooseAction(Unit unit, GameState state) {
        // Priority 1: Finish off lowest HP enemy in range
        // Priority 2: Attack Lord if in range
        // Priority 3: Move toward Lord via shortest path (avoiding zones of control)
        // Priority 4: If blocked, attack the blocker
    }
}
```

### 12.3 Configuración de Unity

- **Unity Version:** 2022.3 LTS o superior
- **Render Pipeline:** Universal Render Pipeline (URP)
- **Plataforma target:** WebGL (File → Build Settings → WebGL)
- **Input System:** New Input System (para controles de ratón/touch)
- **Cinemámica:** Para cámara isométrica del tablero
- **TextMeshPro:** Para todo el texto de UI

### 12.4 Cámara

- **Estilo:** Isométrica o cenital con ligero ángulo (como los screenshots de Terrariums/Origins)
- **Posición:** Centrada en el tablero 8×7
- **Movimiento:** Zoom con rueda del ratón, pan con click medio o arrastrando
- **UI encima de la cámara:** Cartas, dados, barras de vida

---

## 13. FLUJO DE UNA PARTIDA

1. **Pantalla de mapa PVE:** Seleccionar nodo (1-5)
2. **Pantalla de preparación:** Elegir 3 Axies del roster para la batalla
3. **Inicio de batalla:** Colocar Lord en posición fija + 3 Axies en zona de despliegue
4. **Por cada turno (hasta 12):**
   a. **Tirada de dados:** Se tiran los dados de todas las unidades vivas del jugador activo
   b. **Aplicar guardias:** Las caras de guardia se aplican automáticamente
   c. **Fase de acción:** El jugador (o IA) elige qué hace cada unidad, en qué orden
   d. **Fin de turno:** Se pasan los escudos al siguiente turno rival
5. **Fin de batalla:**
   - Lord rival a 0 HP → Victoria
   - Lord propio a 0 HP → Derrota
   - Turno 12 terminado → Gana quien tenga mayor % de vida en su Lord
6. **Recompensas:** Material (3 por nodo) o Esencia (5 por jefe)
7. **Volver al mapa PVE**

---

## 14. UI Y CARTAS (PRIORIDAD MÁXIMA)

La **carta de Axie** es la pantalla más importante. Tiene que enseñar en un vistazo:
- **Arriba:** Chasis (clase, HP, movimiento, alcance, ataque básico)
- **Abajo:** Las caras del dado con el color de la clase de cada parte
- **Afinidad marcada:** Si la parte coincide con la clase del chasis, resaltar con brillo/borde
- **Sprite del Axie** junto al título

El **dado en 3D** debe:
- Girar cada vez que se tira (animación de 0.5s)
- Mostrar la cara resultante claramente
- Tener un sonido de dados por cada tipo de resultado
- El dado del Lord tiene su propio modelo/animación

**Barras de vida:**
- Sobre cada unidad en el tablero
- Mostrar HP actual / HP máximo
- Color según la clase
- Escudo mostrado como segmento adicional de diferente color

---

## 15. ORDEN DE CONSTRUCCIÓN

Cada paso deja algo comprobable. No pasar al siguiente sin cerrar el anterior.
Aplica tanto a Phaser como a Unity (adaptar los nombres de archivos).

| # | Paso | Comprobable cuando |
|---|---|---|
| 1 | Tablero 8×7, colocación de Lord y 3 móviles, turnos alternos | Se ven las piezas y se pasa turno |
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
| 15 | Pulido visual: Axies animados, VFX, sonido, animaciones de dados | Se ve como un juego terminado |

---

## 16. QUÉ HACER Y QUÉ NO

### HACER:
- Usar `@axieinfinity/mixer` para renderizar Axies (ya funciona en el proyecto actual)
- Seguir la paleta de colores de las clases (ver tabla en sección 4)
- El tablero debe verse como una losa maciza (como el boceto `campo_combate.png`)
- Cada tipo de terreno debe ser visualmente distinguible de lejos
- El dado debe animarse (girar cada vez que se tira)
- Las cartas deben mostrar el dado con las 6 partes coloreadas por clase
- Si se usa Phaser: seguir el patrón de Terrariums (Phaser para lógica/render, React para UI)
- Si se usa Unity: exportar a WebGL para que abra en navegador

### NO HACER:
- NO inventar partes, clases o mecánicas que no estén en este documento
- NO cambiar los números de HP/daño/movimiento/alcance
- NO añadir PVP, blockchain, tokens, o任何 cosa fuera del MVP1
- NO hacer el tablero más grande que 8×7
- NO hacer el roster más grande que 3 unidades por batalla
- NO usar assets que no sean CC0 o de los toolkits oficiales de Sky Mavis

---

## 17. CHECKLIST DE LA ENTREGA (Ronda 1 Vibeathon)

- [ ] Título: "Vínculo de Lunacia"
- [ ] Pitch de una frase
- [ ] Descripción corta y larga
- [ ] Thumbnail
- [ ] Enlace jugable (WebGL en navegador, abre en pestaña nueva)
- [ ] Controles e instrucciones de primer contacto
- [ ] Enlace a repositorio (puede ser privado)
- [ ] Vídeo de respaldo
- [ ] Declaración de herramientas IA usadas y cómo encaja con Axie Core

**Criterios de evaluación:**
| Criterio | Peso |
|---|---|
| Axie Core | **35%** — Las partes del cuerpo son el dado. Sin partes no hay juego. |
| Gameplay | 25% — Jugable, divertido, se entiende en 1 minuto |
| Visión de producto | 20% — Modelo económico, roadmap, diferenciación |
| Viabilidad | 10% — Se puede construir en Ronda 2 |
| Calidad de prototipo y documentación | 10% — Limpio, documentado, funcional |

---

## 18. FECHAS CLAVE

| Hito | Fecha |
|---|---|
| Ronda 1 (prototipo jugable + visión) | 8–21 sep 2026 |
| Finalistas anunciados | 29 sep |
| Ronda 2 (producción) | 4–31 oct |
| Demos finales y ganadores | 5 nov |

---

## 19. NOTA SOBRE LA IA EN EL PROYECTO

Este prototipo se está desarrollando con IA. Hay que declararlo en la entrega.
Lo que la IA hace bien:
- Generar código de lógica de juego (turnos, combate, dados)
- Implementar mecánicas complejas (zona de control, escudo, perforante)
- Crear UI y systems de datos

Lo que la IA no puede hacer sola:
- Arte 3D de Axies (hay que usar los toolkits oficiales de Sky Mavis)
- Diseño de niveles/terreno (hay que seguir los 3 mapas del documento)
- Test de balance (hay que hacer playtest real)

---

## 20. ARCHIVOS ADJUNTOS

Este briefing debe acompañarse de:
1. `MVP1vinculodelunacia.md` — Documento de diseño completo (fuente de verdad)
2. `CLAUDE.md` — Contexto del proyecto y decisiones ya tomadas
3. `src/axie.js` — Datos de las 12 partes, clases, dados (en JavaScript, hay que traducirlo a C#/ScriptableObjects)
4. `src/assets/deseables/campo_combate.png` — Boceto visual del tablero
5. Repositorios de Sky Mavis en GitHub para los toolkits de Unity
