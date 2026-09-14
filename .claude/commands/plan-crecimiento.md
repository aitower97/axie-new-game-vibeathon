# /plan-crecimiento — Fase posterior al lanzamiento: plan de 90 días

`plan-implantacion.md` cubre "antes de lanzar". Este comando cubre lo
que pasa DESPUÉS: qué se hace en los primeros meses para que el
posicionamiento mejore de forma medible, con KPI concreto por mes — no
solo "vamos mejorando el SEO poco a poco". Se guarda en
`plan-crecimiento.md`.

## Por qué existe

Sin esto, el proyecto se considera "terminado" al lanzar, y el
posicionamiento real (que tarda semanas/meses en moverse) no tiene
seguimiento estructurado. Un cliente que contrata SEO espera saber qué
se hace mes a mes y cómo se mide el avance.

## Qué captura `plan-crecimiento.md`

```markdown
# Plan de Crecimiento (90 días): <nombre del proyecto>

## Mes 1 — Cimientos
Objetivo: reforzar la base SEO sin tocar lo que ya funciona.
Acciones:
- <ej. cierre técnico: sitemap limpio, indexación en Search Console>
- <ej. optimización on-page de las páginas clave>
KPI: <medible, ej. "todas las páginas indexadas en Search Console",
"puntuación Lighthouse SEO sube de X a Y">

## Mes 2 — Crecimiento
Objetivo: aparecer en las búsquedas que de verdad traen clientes.
Acciones:
- <ej. contenido nuevo dirigido a keywords secundarias>
- <ej. citaciones locales / directorios relevantes, si aplica>
KPI: <medible, ej. "al menos N keywords objetivo suben de posición en
Search Console", nunca prometas un puesto concreto sin evidencia previa>

## Mes 3 — Consolidación
Objetivo: convertirse en referencia del sector/zona, no solo aparecer.
Acciones:
- <ej. estrategia de reseñas, autoridad temática con más contenido>
KPI: <medible>

## Cómo se mide el avance
<qué herramienta/fuente se usa cada mes — Search Console, Lighthouse,
lo que ya se usó en la auditoría inicial — para que el mes 2 se compare
contra el mes 1 con la MISMA fuente, no una distinta>

## Cadencia de reporte
<mensual, o "cuando haya datos suficientes" — decide con el cliente, no
por defecto>
```

## Regla clave: KPI medible, no promesa de resultado

"Subir al puesto 1 en Google" no es un KPI que se pueda prometer de
forma honesta. "Al menos 3 keywords objetivo suben ≥5 posiciones" sí lo
es, porque es verificable con la misma herramienta cada mes. Todo KPI
de este documento debe ser de la segunda forma.

## Modo POC
No suele aplicar — un POC/demo no lleva plan de crecimiento de 90 días.
Sáltate este comando salvo que el cliente ya haya aprobado seguir tras
la demo.

## Modo Producción
Documento completo, confirmado con el cliente antes de empezar el
Mes 1 — las expectativas de KPI se acuerdan ANTES, no se ajustan
después para que cuadren con lo que pasó.

## Salida
`plan-crecimiento.md` en la raíz, se usa como referencia en cada
`client-report` mensual para comparar avance real contra lo prometido.
