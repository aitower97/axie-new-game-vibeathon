# INSTRUCCIONES PARA LA IA DE PAGO — PROMPT ÚNICO PARA CONSTRUIR EL JUEGO EN PHASER

> **Copia TODO esto y pégalo como primer mensaje a tu IA de pago.**
> Adjunta también estos 3 archivos del repo (o pega su contenido):
> 1. `BRIEFING-UNITY-3D.md` — el diseño completo
> 2. `src/axie.js` — datos de las 12 partes, clases, dados
> 3. `src/axieMixer.js` — puente con @axieinfinity/mixer (hay que adaptarlo a Phaser)

---

**ERES UN DESARROLLADOR SENIOR DE JUEGOS WEB. Vas a construir el prototipo completo de un táctico por turnos en Phaser 3 + React + @axieinfinity/mixer, replicando exactamente el stack y estilo visual del juego "Axie Infinity: Terrariums" de Sky Mavis (que también está hecho en Phaser 3 + Spine + mixer + React).**

## EL JUEGO

**"Vínculo de Lunacia"** — Un táctico por turnos sobre rejilla en el navegador donde el dado de cada Axie está hecho de las partes de su cuerpo. Cada bando tiene un Lord inmóvil (la torre) y 3 Axies móviles. Ganas reduciendo a 0 la vida del Lord rival.

Diseño completo en el archivo `BRIEFING-UNITY-3D.md`. **LÉELO ENTERO y NO inventes nada que no esté ahí.** El diseño es la fuente de verdad absoluta.

## REGLAS DE ORO

1. **Usa Phaser 3** como motor de juego (recrea la escena de combate, tablero, unidades, cámaras, animaciones). Usa **React** solo para la UI overlay (menús, cartas, inventario, botones, barras de recursos) — como hace Terrariums con su `#react-root`.
2. **Renderiza los Axies con `@axieinfinity/mixer`** (el archivo `src/axieMixer.js` ya tiene la lógica `getAxieSprite` y `getClassSprite` adaptada a PixiJS — hay que migrarla a Phaser 3 con el plugin `phaser3-rex-plugins` para spine o el adapter oficial de spine-phaser, igual que Terrariums usa `spine-phaser`).
3. **El tablero es una LOSA MACIZA** (no cubos sueltos): un solo rectángulo con rejilla dibujada encima, grosor visible, degradado de luz. Sigue el boceto `src/assets/deseables/campo_combate.png`.
4. **Estilo visual:** verde menta pastel dominante (hierba), marrón cálido (estructuras), viñeteado que centra en el tablero, árboles/setas/vallas dispersos alrededor. Estilo tierno "cute" de Axie. NO oscuro ni abstracto.
5. **Colores de clase:** plant=#71c14b, beast=#f0a04b, bird=#ef6f9c, aqua=#3fa9e0.
6. **El dado debe animarse** (girar 0.5s) cada tirada, mostrar la cara clara, sonido por tipo.
7. **La carta de Axie es prioridad máxima:** arriba el chasis (clase/HP/movimiento/alcance/ataque básico), abajo el dado con las 6 partes coloreadas por clase de la parte, afinidad resaltada. Debe entenderse en 5 segundos sin leer nada.
8. **No uses TypeScript** salvo que la IA lo prefiera fuertemente; el repo es JS puro. No añadas dependencias innecesarias.
9. **Sin blockchain, sin PVP en MVP1, sin token.** Solo el juego como está diseñado.

## LO QUE TENGO YA HECHO (NO lo rehagas, intégralo/adapta)

- `src/axie.js`: la lógica de partes, clases, dados, genoma y efectos ya está escrita y validada. **Tráela/complétala** para Phaser.
- `src/axieMixer.js`: el puente con `@axieinfinity/mixer` para renderizar Axies. Migra la parte de render a Phaser.
- El `@axieinfinity/mixer` es npm v1.4.9 con deps `pixi.js@7.2.4` y `pixi-spine@4.0.3`.
- Assets de entorno (CC0 de Kenney) en `src/assets/kenney-3d/` y `src/assets/backdrop/`.

## LO QUE TIENES QUE CONSTRUIR (orden estricto, no pasar al siguiente sin cerrar el anterior)

1. Tablero 8×7 en Phaser, colocación de Lord y 3 móviles, turnos alternos
2. Movimiento por chasis + **ZONA DE CONTROL** (la regla más importante: entrar a casilla adyacente a enemigo vivo termina el movimiento)
3. Ataque básico, vida, muerte, victoria por Lord a 0
4. Terreno: piedra, zona lenta, agua (solo Aqua), obstáculo bajo
5. Dados de unidad (3 y 5 caras) y las 12 partes con sus efectos
6. Afinidad de clase (+1)
7. Escudos y guardias sin gasto de acción
8. Dado del Lord (6 caras), invocación, reserva de 3
9. Reloj de 12 turnos y desempate por % de vida
10. IA enemiga (4 prioridades: rematar herido → ir al Lord → avanzar ruta más corta → atacar al bloqueador)
11. Los 3 mapas (El Corredor, Los Bajíos, La Ciénaga)
12. Habilidades del Lord + desbloqueo con Esencia
13. Base: Cuartel y Santuario
14. Territorio PVE de 5 nodos con botín y desbloqueo de partes
15. Pulido: Axies animados (idle/attack con mixer), VFX, sonido, dados animados

## LO QUE TIENES QUE VERIFICAR AL TERMINAR

- [ ] Corre el juego en navegador y se puede jugar una partida completa de principio a fin
- [ ] No hay fallos de reglas (zona de control, escudo, perforante, guardia, afinidad)
- [ ] La carta de Axie se entiende en 5 segundos
- [ ] El tablero se ve como la losa maciza del boceto y con estilo Terrariums
- [ ] Los 3 mapas se sienten distintos
- [ ] Se puede ganar Y perder (IA funciona)
- [ ] No hay memoria visual rota (las unidades y el tablero se pintan bien, sin bugs de z-order/pintado)

**Empieza leyendo `BRIEFING-UNITY-3D.md` completo, luego `src/axie.js` y `src/axieMixer.js`. Después proponme tu plan técnico de arquitectura Phaser (escenas, sistemas, estructura de carpetas) ANTES de escribir código.**
