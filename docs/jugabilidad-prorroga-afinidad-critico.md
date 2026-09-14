# Jugabilidad 2026-09-14: muerte súbita (prórroga), afinidad de clases y crítico genético

**Rama:** `feat/jugabilidad-prorroga-afinidad-critico` (desde `542975c`, tras VFX + inventario).
**Estado:** implementado, build + lint limpios, verificado en vivo (CDP 9333) para timer, afinidad y crítico.

Tres mecánicas pedidas por el usuario para que la partida se sienta decidida por el jugador y no por suerte larga, más un reloj para que el PVP no se agarroche.

---

## 1. Afinidad de clases (triángulo oficial)

Aplica el **triángulo oficial de Axie** (Plant/Reptile/Dusk > Aqua/Bird/Dawn > Beast/Bug/Mech) traído a las 4 clases del MVP1:

| Atacante | Gana a (×1.15) | Pierde con (×0.85) |
|---|---|---|
| Beast | Plant | Aqua, Bird |
| Plant | Aqua, Bird | Beast |
| Aqua | Beast | Plant |
| Bird | Beast | Plant |

- **×1.15 a favor / ×0.85 en contra, con `Math.floor`** — el float muestra el multiplicador real aplicado (ej. "Afinidad x1.15").
- Aplica a **todos los ataques entre unidades**: especial, básico y contragolpe, en los 4 resolutores (especial/básico/Impulso/contragolpe comparten `terrainRangeBonus` como única fuente de verdad).
- Contra el **Lord es neutro** (no tiene clase → `affinityMult` devuelve 1).
- Aqua↔Bird y las parejas sin relación quedan neutras (comparten grupo en el triángulo oficial).
- El contragolpe **mira desde el defensor que contesta** (`affinityMult(defender.klass, attacker.klass)`).

**Código:** `AFFINITY_STRONG`/`AFFINITY_WEAK`/`AFFINITY`/`affinityMult()` en `src/App.jsx` (L120-135). El multiplicador viaja en `computeUnitAttack`/`computeCounterHit` → float `variant:'relation'` + chip en `ActionPad`.

## 2. Crítico genético

La probabilidad y el multiplicador salen de la **clase del Axie (su genoma)** más **la parte tirada** — la cara que ataca aporta +5 % de ráfaga y +0.25 al multiplicador sobre la base de clase.

| Clase | Prob. base | Multiplicador |
|---|---|---|
| Beast | 20 % | ×2.0 |
| Bird | 25 % | ×2.5 |
| Aqua | 15 % | ×3.0 |
| Plant | 5 % | ×1.5 |

- La **parte tirada** aporta **+5 % y +0.25** (ej. Aqua con cola tirada → 20 % ×3.25). El golpe **básico** (sin parte atacando) solo lleva la base de clase.
- **Tirado en el resolutor real** (`applyUnitAttackLocal`/`applyCounterLocal` con `rollCrit`), **nunca en la preview**: la preview (`describeExchange`) muestra la estadística vía `critFor` con números **deterministas**.
- El contragolpe usa la clase de **quien contesta** (`rollCrit(defender, rolled)`).
- El Lord no tiene crítico (sin clase ni partes).
- Float "CRITICO xN" (`variant:'crit'`, verde) y chip "Critico N% xM" en el ActionPad. **Bug encontrado en la verificación en vivo**: el chip pintaba el % multiplicado por 100 ("Critico 3000%") porque `rate` ya venía en porcentaje — corregido a `Math.round(exchangeCrit.rate)`.

**Código:** `CLASS_CRIT`/`critFor()`/`rollCrit()` en `src/App.jsx` (L145-159).

## 3. Muerte súbita / prórroga (solo PVP)

Al agotar las **8 rondas** en una arena PVP:

- **+2 casillas de movimiento** a cada unidad de ambos bandos (`OVERTIME_MOVE`).
- **+50 % de daño** a unidades y a los dos Lords (`OVERTIME_DMG`).
- **2 rondas extra** = 4 medios-turno (`OVERTIME_ROUNDS`/`OVERTIME_EXTRA`), techo de reloj dinámico `16 + 4`.
- Después, **tiebreak por vida de Lord** igual que hoy (`clockTiebreak`).
- El **PVE no entra en prórroga**: corta en la ronda 8 como siempre.
- Activación al **inicio de `passTurn`** (antes del corte), con log "MUERTE SUBITA (PVP): prorroga de 2 rondas…" y un impacto VFX sobre ambos Lords (`klass:'lord', effect:'overtime'`, fallback al slash genérico si el clip no existe).
- UI: pastilla **"MUERTE SUBITA"** en el Hud y contador de rondas que pasa de `X/8` a `X/10` durante la prórroga; el ActionPad avisa del bonus (+2 casillas / +50 %) para las unidades (no para el Lord).

**Código:** `OVERTIME_*`/`OVERTIME_ACTIVE`/`effectiveMove()` en `src/App.jsx` (L167-174), aplicado en `computeUnitAttack`, `computeCounterHit`, `reachableCells`, `unitCanAct`, `lordAttack` y `passTurn`.

## 4. Timer de turno PVP (20 s)

- **20 segundos** por medios-turno **jugable** del jugador (`PVP_TURN_MS`) en las arenas PVP. El turno rival se reproduce con pausa y no consume reloj.
- Al agotarse: **tirada automática** (solo si aún no ha tirado) + **pase de turno sin mover ni atacar**.
- Sin timer en PVE (mapa base y campaña).
- Countdown vía `setInterval` de 1 s que escritora en `turnSecondsRef` (sin re-render por segundo); el estado `turnSecondsLeft` se actualiza igual y solo re-renderiza la cifra. `autoPassRef` enlaza `passTurn`/`rollDice` vivos cada render (evita la captura de funciones obsoletas que exigía el lint de deps y re-crear el interval cada segundo).
- UI: chip `⏱ Ns` en `Controls` (rojo con pulso ≤ 5 s); solo visible en PVP con turno jugable.
- Se resetea al volver el turno al jugador y en `resetMatch`.

**Código:** `PVP_TURN_MS` (L179), efecto timer en `App.jsx` (~L2560), chip en `Controls.jsx`.

## 5. Verificación en vivo (CDP 9333, drivers propios)

Drivers Node CDP en `C:\Users\PC\AppData\Local\Temp\opencode\`: `cdp-feature-check.mjs` (v1) → `cdp-attack3.mjs` (v3, barre las 3 unidades, las mueve por su summon-zone hacia el rival y lanza el ataque cuando hay in-range).

- **Timer:** en cuenta regresiva real (17→16 s), reaparece en 19/20 s tras el auto-pase por tiempo agotado.
- **Auto-pase por timeout** confirmado (el turno pasa solo y el reloj se reinicia).
- **Afinidad/crítico:** chips de preview `Afinidad x1.15` y `Critico N% xM` visibles al pasar el cursor; floats `CRITICO` y `Afinidad` en combate real; **cero errores de consola y cero excepciones** en las partidas.
- **Bug del chip 3000 %** detectado y corregido en la misma sesión.

**Pendiente de verificación en vivo:** la prórroga exige llegar a la ronda 9 con el Lord propio vivo; con la IA ganando en ~4 rondas si el jugador no defiende, el driver no la alcanza. Lógica revisada por código (activación al inicio de `passTurn`, techo dinámico, cortes post-cap, tiebreak). Para probarla a mano: aguantar 8 rondas en una arena PVP.