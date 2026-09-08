# Investigación de mercado + análisis estratégico (ecosistema Axie)

**Fecha:** 8 de septiembre de 2026
**Alcance:** (1) tendencias de mercado 2026, (2) análisis del hilo de @MukeGaming

> **Nota:** este documento se escribió antes de leer el proyecto. Su sección 3 original
> proponía tres direcciones de producto a ciegas y **está superada**: la decisión tomada
> está en `docs/decision-de-producto.md` y resumida en `CLAUDE.md`. Se conserva aquí la
> sección 3 al final, marcada como descartada, porque explica qué alternativas se
> valoraron y por qué se eligió esta.

---

## 1. Tendencias de mercado 2026

### 1.1 Foto global

| Métrica | 2026 | Variación |
|---|---|---|
| Mercado total de videojuegos | 213.900 M USD | +6,1 % interanual |
| Móvil | 121.100 M USD | +6,8 % |
| PC | 45.900 M USD | +5,3 % |
| Asia-Pacífico | 100.700 M USD (47 % del total) | +6,0 % |
| Latinoamérica | 9.300 M USD | +7,9 % |
| Oriente Medio y África | 8.500 M USD | +10,3 % (la región que más crece) |

Fuente: previsión Newzoo 2026 (informe completo publicado el 10 de septiembre de 2026).

Por primera vez en años, **móvil es el segmento que lidera el crecimiento**, y no por captar jugadores nuevos sino por monetizar mejor a los que ya están, más la expansión internacional de editores chinos y los canales D2C (venta directa fuera de las tiendas).

### 1.2 El dato más importante: se acabó el crecimiento por volumen

Sensor Tower, primer semestre de 2026 (móvil):

- Descargas: **24.000 M, –11,9 %** interanual.
- Ingresos IAP: **40.000 M USD, –2,0 %**.
- Tiempo jugado: 221.000 M horas, plano respecto a H1'25.
- Resultado: **ingreso por descarga +11 %**.

Traducción práctica: el mercado ya no premia captar usuarios, premia **retener y profundizar**. Las descargas caen ~12 % en *todos* los géneros y en *todas* las regiones grandes. Un juego nuevo en 2026 no compite por instalaciones, compite por horas y por profundidad de sesión.

### 1.3 Qué géneros funcionan y cuáles no (móvil, H1'26)

**Ingresos IAP por género:**

| Género | H1'26 | Tendencia |
|---|---|---|
| Estrategia | 9.270 M USD | –5 % (líder, pero cayendo) |
| Puzzle | 8.070 M USD | **+~20 %** |
| RPG | 6.120 M USD | en horas bajas, MMORPG especialmente mal |
| Casino | ~5.000 M USD | –648 M solo en EE. UU. (mucho es migración a D2C) |

**Horas jugadas por género:** Simulación 44.140 M h > Puzzle 39.330 M h > Estrategia 33.370 M h > Shooter 32.690 M h.

**Instalaciones:** Estrategia solo ~1.000 M frente a Puzzle 5.070 M, Simulación 4.570 M, Arcade 4.520 M. Es decir, estrategia monetiza brutalmente bien con muy poca gente.

Datos concretos que conviene tener en la cabeza:

- **Puzzle aportó ~1.300 M USD de crecimiento, en torno al 70 % de toda la ganancia absoluta del mercado.** Es el único motor real de crecimiento del sector móvil ahora mismo.
- **El 4X está en declive: dos trimestres consecutivos a la baja** tras tocar techo en 3.090 M USD en Q4'25. Last War: Survival y Whiteout Survival juntos ingresaron 370 M USD menos que un año antes. Los sustitutos (Kingshot +461 %, Last Z +328 %) son 4X más ligeros y más rápidos de entrar.
- **Match Merge 2 casi duplicó** hasta 1.910 M USD (impulsado por Gossip Harbor +135 %); Match Swap está en meseta (1.810 M en Q2'26).
- **Hybrid casual crece, casual aguanta, mid-core pierde ingresos.** Hypercasual es lo que más descargas pierde.
- Segmento en alza puntual: **deportes +7 % IAP** por el Mundial; 8 de 13 eventos temáticos en juegos *no* deportivos usaron una mecánica de apuestas/pronósticos.

**Retención de referencia** (estimaciones Sensor Tower, cohorte enero 2026): Royal Match D1 60,9 % / D7 31,5 % / D30 17,8 %; Block Blast! D7 33,4 % y D180 7,93 %. En el otro extremo, los 4X: Whiteout Survival D30 5,57 %, Last War D30 3,82 %. **Los juegos de estrategia pesada retienen mal y lo compensan con ARPU muy alto.**

### 1.4 PC / Steam

Menos rigurosa que la data móvil (las fuentes de tracking abierto son más flojas), pero la señal es consistente:

- El término **"cozy" es la etiqueta que más ha crecido en Steam en cinco años (+675 % de uso como keyword)**, y ya engloba desde farming sims hasta survival-craft.
- Siguen fuertes los **extraction shooters** (ARC Raiders con ~400.000 jugadores diarios de media en enero) y resurge el survival horror.
- El patrón de diseño dominante es **híbrido**: survival + progresión RPG, shooter + economía de extracción, roguelite + cooperativo, estrategia + estructura de eventos en vivo.

### 1.5 Web3 / gaming cripto: el dato honesto

Este es el apartado donde hay que tener más cuidado, porque circulan cifras infladas. Lo verificable:

**DappRadar / Blockchain Game Alliance, Q3 2025** (último informe trimestral oficial publicado; a fecha de hoy no hay informes Q1/Q2 2026 en su blog):

- **4,66 M de wallets activas diarias** en gaming, –4,4 % trimestral. Venía de 5,8 M en Q1'25. Interanual está prácticamente plano (4,44 M en Q3'24): **el sector está estancado, no creciendo**.
- Pese a la caída, **gaming es la categoría dominante de Web3: el 25 % de todas las wallets activas** (frente al 20,1 % en Q2'25).
- **Inversión: 129 M USD en Q3'25**, el mejor trimestre de un año malo (293 M en los tres primeros trimestres de 2025, frente a más de 1.800 M en todo 2024). Solo el 53 % fue a juegos; el resto a infraestructura.
- **NFTs de gaming: 135 M USD de volumen**, menos del 10 % de los 1.600 M del total NFT. Metaverso: 17 M USD, –55 % trimestral.
- Más de 300 dapps de gaming quedaron inactivas en un solo trimestre (Q2'25), ~8 % del total listado.

**El dato de diseño más útil de todo el informe** — transacciones por wallet en 30 días:

| Juego | Txs/wallet |
|---|---|
| Alien Worlds | 598,7 |
| Off the Grid | 124,3 |
| **Axie Infinity** | **22** |
| Lumiterra | 15,1 |
| World of Dypians | 12,8 |
| Token Tails | 5,1 |
| Kawaii Puzzle | 3,4 |

La inmensa mayoría de juegos Web3 tienen 2–5 transacciones por wallet: la wallet entra, hace login, reclama y se va. Los que destacan (Alien Worlds, Off the Grid) son los que dejan **fabricar, minar o consumir dentro del juego**. Axie, con 22, está muy por encima de la media pero muy por debajo de los líderes. **Ahí hay hueco.**

⚠️ Circulan cifras de "7 millones de wallets diarias en Q1 2026" y similares. Vienen de agregadores SEO (SQ Magazine, CoinLaw, PlayerCounter) sin metodología publicada y **contradicen la serie histórica de DappRadar**. No se han usado.

### 1.6 Ronin y Axie: estado a septiembre de 2026

- **Ronin completó su migración a Layer 2 de Ethereum sobre OP Stack en mayo de 2026** (hard fork el 12 de mayo, ~10 h de caída). Ya no es una sidechain independiente.
- **Inflación de RON: de más del 20 % anual a menos del 1 %.** Es el mayor ajuste de tokenomics de una chain de gaming activa en 2026.
- **Comisiones de marketplace al tesoro: del 0,5 % al 1,25 %.**
- **Axie Infinity Classic cerró el 24 de junio de 2026.** Sky Mavis consolida en Origins, Axie Den of Mysteries y el resto de la librería de Mavis Hub. No es salida de la franquicia, es racionalización de producto.
- **Trung Nguyen, cofundador, se retiró del día a día** a principios de 2026.
- **bAXS (Bonded AXS)**: versión no transferible del token que hay que "desbloquear" o reinvertir, diseñada para romper el ciclo farmear-y-vender. AXS queda cada vez más como token de gobernanza y staking.
- **Programa de grants "Proof of Distribution": 5 M RON** para juegos que demuestren demanda real de jugadores.
- Ronin creció un 55 % en wallets activas diarias en Q3'25, hasta 419.000.
- El ecosistema Axie declara >100.000 wallets activas diarias y >1 M de transacciones on-chain al día (cifra del propio ecosistema, no auditada por terceros).

**Lectura estratégica:** el ecosistema está en un momento raro pero favorable para un dev pequeño. Está **contraído pero saneado** (menos inflación, más tesoro, menos competencia zombi, grants activos, y Sky Mavis buscando activamente juegos nuevos vía Vibeathon). Es peor momento para captar especuladores y mejor momento para captar jugadores.

### 1.7 El Axie Vibeathon

- Ronda 1: **8–21 de septiembre**. Finalistas anunciados el 29. Ronda 2: 4–31 de octubre. Ganadores: 5 de noviembre.
- Premio: 20.000 bAXS (~18.000 USD) + 250 USDC de soporte de herramientas IA para cada finalista de Ronda 2. Bonus "Promising Prototype" de 500 bAXS.
- Entrega: juego jugable alojado por ti, enlace, thumbnail, controles, repo (puede ser privado), vídeo de respaldo.
- **Criterios de puntuación de la Ronda 1:**

| Criterio | Peso |
|---|---|
| **Axie Core** | **35 %** |
| Gameplay | 25 % |
| Visión de producto | 20 % |
| Viabilidad | 10 % |
| Calidad de prototipo y documentación | 10 % |

El 35 % en "Axie Core" es la señal más fuerte del brief: **un juego genérico con Axies pegados encima puntúa mal**. Lo que puntúa es que la identidad Axie (partes del cuerpo, clases, genética, colección) sea *inseparable* de la mecánica. "Ganadores pueden convertirse en juegos independientes o integrarse en el ecosistema" — es una vía real de producción, no solo premio.

---

## 2. Análisis del hilo de @MukeGaming

**Enlace:** https://x.com/mukegaming/status/2095295837131681952 — publicado el 2–3 de septiembre de 2026, ~2.700 reproducciones, 18 respuestas.

**Acceso:** se pudo leer el hilo completo (7 tweets) sin iniciar sesión. **Dos limitaciones declaradas:** el tweet 6 aparece truncado en "Pay to fast," con un botón "Mostrar más" que no se pudo expandir sin cuenta, y solo se pudo ver **una** respuesta (de @Psycheout86, preguntando cuántos créditos haría falta y sugiriendo que el ecosistema lo financie). El resto de respuestas está tras el muro de login. No se ha inventado nada de lo que no se pudo ver.

### 2.1 Qué propone

Muke.ron dice explícitamente que **no** entra al Vibeathon (los créditos de IA cuestan dinero y no tiene recursos), pero publica el diseño completo igualmente. La propuesta es un **RTS donde los ejércitos están comandados por Axies**:

1. **Por qué RTS:** gestión de recursos, construcción de base, decisiones rápidas. Argumento clave: los jugadores de Web2 ya gastan dinero real todos los días en este género en packs y aceleradores que nunca podrán revender.
2. **Estructura de ejército:** un Axie coleccionable (el comandante, que lleva buffs y habilidades) + una pila de Axies comunes. El comandante sube de nivel con AXP.
3. **El sink** (lo que él mismo señala como "la parte que nadie hace"): los comandantes no mueren, quedan heridos y cuesta recursos curarlos; **los Axies comunes tienen probabilidad de destrucción permanente (burn)**. Cada combate cuesta algo de verdad.
4. **Raids = Risk To Earn:** atacas otra ciudad, pierdes Axies, robas hasta el 20 % de lo que tenga. Con salvaguardas: escudo de 4 h tras perder una defensa, ventana de protección para cuentas nuevas, zonas cerradas por nivel (la geografía *es* el matchmaking).
5. **Clanes por territorio:** mantener una zona una semana da AXS y objetos raros, el líder reparte. **Ese AXS sale de los ingresos por suscripción. Sin token nuevo: solo AXS y RON. El juego solo paga lo que realmente ingresa.**
6. **Monetización sin vender poder:** suscripción de 10 USDC/mes para poder acuñar tus objetos como NFT (+ más listados, más inventario), 1 % de comisión de marketplace, cosméticos y battle pass, packs de recursos y aceleradores. El free-to-play sigue pudiendo comerciar objetos del juego.
7. **Prototipo mínimo:** una batalla, tres unidades, un recurso y el sistema de riesgo Axie en pantalla.

### 2.2 Qué ideas son realmente aprovechables

Ordenadas por valor y por independencia del género:

**★★★ La suscripción para acuñar.** Separar "objeto de juego" de "NFT" y cobrar 10 USDC/mes por el derecho a tokenizar es la mejor idea del hilo. Resuelve tres cosas a la vez: los free-to-play juegan sin fricción de wallet, hay ingreso recurrente predecible que no es venta de poder, y solo se pone on-chain lo que alguien valora lo suficiente como para pagar por ello. Es **agnóstica de género**.

**★★★ Pagar solo lo que se ingresa.** "El juego solo paga lo que realmente gana" es la única regla que impide que se repita el colapso de 2021–22. Encaja con hacia dónde va Ronin (bAXS no transferible, Proof of Distribution, inflación de RON al mínimo) y con lo que la data confirma: los juegos sin sinks reales dependen de dinero nuevo y son estructuralmente frágiles.

**★★★ Estructura de dos capas: un coleccionable + consumibles fungibles.** Es la solución elegante al coste de entrada: solo necesitas *un* activo caro, el resto es material desechable.

**★★ Las salvaguardas antes que el PvP.** Escudo post-derrota, protección de cuentas nuevas, zonas por nivel. Que las liste *dentro* del pitch, no como parche posterior, es señal de buen criterio de diseño.

**★★ Combate como sumidero, no como grifo.** Que pelear cueste recursos en vez de generarlos invierte la lógica del P2E clásico y es lo que la data pide a gritos.

**★ El argumento de mercado.** "Ya gastan en packs y aceleradores que no pueden revender" es cierto y es buen gancho de pitch, pero **la data H1'26 no lo respalda del todo**: el 4X lleva dos trimestres cayendo y retiene fatal. El género que Muke elige como campo de batalla es justo el que se está enfriando.

### 2.3 Qué NO copiar

- **El RTS como género.** Es de las cosas más caras de construir bien (pathfinding, IA de unidades, balance de economía de base) en una ventana de dos semanas. Choca con "Viabilidad" y, peor, con "Gameplay 25 %": un RTS mal ejecutado se nota en treinta segundos.
- **Robar el 20 % en raids.** Con el mid-core perdiendo ingresos y las descargas cayendo un 12 %, un PvP depredador es una máquina de expulsar jugadores nuevos, por muchos escudos que le pongas.
- **El diseño completo.** Es su idea, está publicada y datada, y el hilo tiene tracción en la comunidad. Los principios económicos (suscripción-para-acuñar, pagar-lo-que-ingresas, dos capas de activos) son patrones de industria y son de uso libre; la propuesta concreta "RTS de comandantes Axie con raids del 20 %" es suya.

---

## 3. (Descartado) Las tres direcciones que se valoraron a ciegas

> Esta sección se escribió antes de leer el proyecto y **no es la recomendación vigente**.
> Se conserva porque explica el razonamiento y porque la Dirección A acabó absorbida
> dentro del juego existente. Ver `docs/decision-de-producto.md`.

**Dirección A — El genoma como reglamento.** Un puzzle competitivo asíncrono donde las seis partes del cuerpo no dan estadísticas, sino que reescriben las reglas del tablero. Encaja con que puzzle sea el único motor de crecimiento real y con la mejor retención documentada del sector. **Es la que se acabó aplicando**, no como juego separado sino como la pieza que le faltaba al táctico: las seis caras del dado son las seis partes.

**Dirección B — Ecosistema, no granja.** Simulación *cozy* de gestión de hábitat con control indirecto: no controlas a los Axies, controlas las condiciones. Encaja con que simulación lidere en horas (44.140 M h) y con el +675 % de "cozy" en Steam. Descartada: es un juego distinto, tiraría el código existente y es la más difícil de hacer divertida en dos semanas.

**Dirección C — Scouting.** Draft semanal de Axies reales puntuados por su rendimiento posterior en la ladder de Origins; la habilidad es evaluar genomas, no pelear. Es la más literal en Axie Core y la más barata de construir. Descartada para Ronda 1 porque no aprovecha nada del código existente y depende de verificar que la Origins API dé resultados por Axie. **Guardada como posible modo secundario a largo plazo.**

---

## Fuentes

**Mercado general y móvil**

- [Newzoo: The Gaming Market in 2026 (resumen, GameDev Reports)](https://gamedevreports.substack.com/p/newzoo-the-gaming-market-in-2026)
- [Sensor Tower: The Gaming Market in H1'26 (resumen, GameDev Reports)](https://gamedevreports.substack.com/p/sensor-tower-the-gaming-market-in)
- [Sensor Tower — State of Gaming 2026](https://sensortower.com/report/state-of-gaming-2026)
- [Sensor Tower: State of Gaming 2026 (resumen, GameDev Reports)](https://gamedevreports.substack.com/p/sensor-tower-state-of-gaming-2026)

**PC / Steam**

- [Outlook Respawn — el "cozy" como keyword dominante de 2026 en Steam](https://respawn.outlookindia.com/gaming/gaming-news/steam-vibe-shift-why-cozy-is-the-most-dominant-keyword-of-2026)
- [Cheat Code Central — los juegos más jugados de Steam en 2026](https://www.cheatcc.com/articles/the-most-played-games-on-steam-for-2026-so-far/)

**Web3 / blockchain gaming**

- [DappRadar × BGA — State of Blockchain Gaming Q3 2025](https://dappradar.com/blog/state-of-blockchain-gaming-q3-2025)
- [DappRadar — State of Blockchain Gaming Q2 2025](https://dappradar.com/blog/state-of-blockchain-gaming-in-q2-2025)
- [DappRadar — State of Blockchain Gaming Q1 2025](https://dappradar.com/blog/state-of-blockchain-gaming-in-q1-2025)
- [CoinDesk — el ajuste brutal en el gaming Web3](https://www.coindesk.com/web3/2025/07/11/web3-gaming-faces-ongoing-turmoil-market-metrics-reveal-persistent-decline)
- [crypto.news — la inversión en juegos Web3 cae un 71 %](https://crypto.news/investor-funding-in-web3-games-drops-71-amid-macro-headwinds-dappradar/)

**Axie / Ronin**

- [Play2Moon — Ronin Network en 2026: migración L2 completada, Axie reorganizado](https://play2moon.com/ronin-network-2026-roundup-l2-migration-axie-pixels-fishing-frenzy/)
- [Play2Moon — cierre de Axie Infinity Classic, junio 2026](https://play2moon.com/axie-infinity-classic-shutdown-june-2026/)
- [Play2Moon — Ronin asigna 5M RON a los grants Proof of Distribution](https://play2moon.com/ronin-network-5m-ron-proof-of-distribution-grants/)
- [BYDFi — Axie Infinity 2026: bAXS y la evolución Risk-to-Earn](https://www.bydfi.com/en/cointalk/axie-infinity-axs-2026-economic-update)

**Vibeathon**

- [The Lunacian (blog oficial de Axie) — The Axie Vibeathon is LIVE!](https://blog.axieinfinity.com/p/the-axie-vibeathon-is-live)
- [Sitio del Vibeathon](https://vibeathon.axieinfinity.ai/)
- [BlockchainGamer.biz — Axie Vibeathon, 18.000 USD en premios](https://www.blockchaingamer.biz/news/42865/axie-vibeathon-1st-september-18000-usd-prize-pool/)
- [EGamers.io — cobertura del Vibeathon](https://egamers.io/axie-vibeathon-kicks-off-build-ai-powered-axie-games-for-a-20000-baxs-prize-pool/)

**Documentación técnica de Sky Mavis**

- [Mavis Docs](https://docs.skymavis.com/)
- [Axie generator tool kit](https://docs.skymavis.com/axie/gtk/overview)
- [Axie Experience Points](https://docs.skymavis.com/axie/axp/overview)

**Post analizado**

- [@MukeGaming — hilo del RTS de Axies (2–3 sep 2026)](https://x.com/mukegaming/status/2095295837131681952)

---

### Nota de fiabilidad

- Las cifras de **Newzoo y Sensor Tower** son estimaciones de mercado publicadas por firmas de análisis reconocidas, no cifras auditadas. Las de retención son explícitamente estimaciones de Sensor Tower.
- Los datos de **DappRadar** más recientes disponibles son de **Q3 2025**; no hay informe trimestral Q1/Q2 2026 publicado en su blog a fecha de hoy. Las cifras de 2026 sobre wallets Web3 que circulan en agregadores SEO no se han usado por falta de metodología.
- Las fuentes de **Steam** son las más flojas del documento; trátalas como dirección, no como dato.
- **Play2Moon** es prensa especializada de nicho; los hechos citados (fecha de la migración L2, inflación de RON, cierre de Classic) coinciden con lo que reporta el resto de fuentes consultadas.
