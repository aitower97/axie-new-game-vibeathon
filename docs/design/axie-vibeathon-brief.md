# Brief — Axie Vibeathon (Ronda 1)

## Concepto
- **Estilo**: táctico por casillas con retratos de personaje y consecuencias permanentes por unidad, combinado con una mecánica de invocación por dados de duelo (versión ligera: cada unidad tiene su propio dado con caras de invocación y de ataque).
- **Progresión**: sistema real de Axie Core — AXP ganado en combate/exploración → Ascensión → Evolución de parte. Simulado localmente, sin transacciones on-chain reales (las bases del Vibeathon dicen que usar API/NFTs/datos on-chain es opcional en fase de prototipo).
- **Pitch de una frase (borrador)**: "Un táctico de casillas donde cada combate alimenta el sistema real de progresión de Axie Core — tus axies se invocan por dados, y evolucionan de verdad."

## Visión del juego completo (solo se redacta, no se construye ahora)
- Mundo abierto explorable en Lunacia, centrado en la aventura y el vínculo con criaturas.
- Gestión de colonia y recursos, alimentada por los axies vinculados en combate.

## Loop del prototipo (esto sí se construye)
1. Mapa pequeño explorable — una escena, ~20-30 casillas, 2-3 puntos de encuentro con axies salvajes.
2. Equipo inicial: 1 axie propio (opcional reclutar un 2º a mitad de la demo).
3. Combate por turnos, tablero pequeño y fijo:
   - Cada axie tiene su propio dado (caras de invocación + caras de ataque).
   - Tirada de 2-3 dados por turno; combinación de invocación mete a ese axie en juego.
   - Una vez invocado, movimiento y ataque por turnos con posicionamiento táctico.
4. Progresión (Axie Core real):
   - Combatir/explorar otorga AXP.
   - Al cruzar un umbral de AXP: Ascensión (ritual visual, simulado).
   - Tras ascender: elegir 1 parte a evolucionar — cambia stat/habilidad y mejora las caras del dado de ese axie.
5. Condición de victoria de la demo: bajar a 0 los puntos de vida del "Lord" rival.
6. Cierre de la demo: pantalla de perfil (axie antes/después de evolucionar) tras 2-3 combates encadenados.

## Fuera de alcance para el prototipo
- Mundo abierto real.
- Gestión de colonia/recursos.
- Reglas completas de un sistema de dados de duelo complejo (habilidades de vuelo/túnel, tablero grande, construcción de camino losa a losa).
- Integración on-chain real, wallet, NFTs o API de Sky Mavis.

## Stack sugerido
- SPA — React/Vite, Canvas o SVG para tablero y dados.
- Sin backend necesario para el prototipo.
- Hosting: Vercel o GitHub Pages.
- Assets: usar los del Builder Resource Kit (2D/3D ya preparados). Evitar el Three.js Axie Mixer — está en beta y avisan de inestabilidad.

## Checklist de entrega (Ronda 1)
- [ ] Título del proyecto + pitch de una frase
- [ ] Descripción corta y descripción larga
- [ ] Thumbnail
- [ ] Enlace jugable (hosteado por ti)
- [ ] Instrucciones de controles / primeros pasos
- [ ] Enlace al repositorio (puede ser privado, compartido con los organizadores)
- [ ] Vídeo de respaldo (fallback demo)
- [ ] Documentación de qué herramientas de IA se usaron
- [ ] Declaración de encaje con Axie Core: el gameplay alimenta el sistema real de AXP/Ascensión/Evolución del ecosistema, no una mecánica inventada.

## Fecha límite
Ronda 1 cierra el **21 de septiembre**.
