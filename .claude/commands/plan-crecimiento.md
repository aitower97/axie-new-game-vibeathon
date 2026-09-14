# /plan-crecimiento — Fase posterior al lanzamiento: plan de 90 días

`plan-implantacion.md` cubre "antes de lanzar". Este comando cubre lo
que pasa DESPUÉS: qué se hace en los primeros meses de vida real de la
app, con KPI concreto por mes. Se guarda en `plan-crecimiento.md`.

## Por qué existe

Sin esto, el proyecto se considera "terminado" al lanzar — pero una app
recién lanzada es cuando más información útil genera (usuarios reales
usándola de formas que nadie previó). Ese periodo necesita plan, no
solo reaccionar a lo que se rompa.

## Qué captura `plan-crecimiento.md`

```markdown
# Plan de Crecimiento (90 días): <nombre del proyecto>

## Mes 1 — Estabilización
Objetivo: que lo lanzado funcione bien para usuarios reales.
Acciones:
- <ej. revisar errores reales registrados por `observability`>
- <ej. corregir fricciones detectadas en el onboarding>
KPI: <medible, ej. "tasa de error por debajo de X", "N% de usuarios
completan el onboarding">

## Mes 2 — Mejora sobre datos reales
Objetivo: mejorar lo que los datos digan, no lo que supongamos.
Acciones:
- <ej. optimizar las pantallas más usadas>
- <ej. funcionalidad pedida por usuarios reales, priorizada>
KPI: <medible>

## Mes 3 — Consolidación
Objetivo: que la app se sostenga sin intervención constante.
Acciones:
- <ej. automatizar mantenimiento recurrente>
- <ej. completar cobertura de tests en los flujos críticos>
KPI: <medible>

## Cómo se mide el avance
<qué fuente se usa cada mes — la MISMA cada vez, para poder comparar>

## Cadencia de reporte
<mensual, o cuando haya datos suficientes — acordar con el cliente>
```

## Regla clave: KPI medible, no promesa de resultado

"Que la app tenga éxito" no es un KPI. "El 70% de usuarios registrados
completan el onboarding" sí lo es, porque es verificable con la misma
fuente cada mes.

## Modo POC
No suele aplicar. Sáltate este comando salvo que el POC pase a uso real.

## Modo Producción
Documento completo, acordado con el cliente antes de empezar el Mes 1 —
los KPI se acuerdan ANTES, no se ajustan después para que cuadren.

## Salida
`plan-crecimiento.md` en la raíz, usado como referencia en cada
`client-report`.
