# /design-brief — Fase intermedia: UI/UX Design Brief (a nivel de proyecto)

Eleva la pasada 1 de diseño de `agents/frontend.md` (por página) a un
documento único de proyecto: `design-brief.md`. Se genera una vez, antes
de construir la primera página.

## Qué captura `design-brief.md`

```markdown
# Design Brief: <nombre del proyecto>

## Sector y audiencia
<de spec.md>

## Sistema de color
<4-6 hex con rol de cada uno>

## Tipografía
<familia(s) y jerarquía h1-h6>

## Principio de diseño del proyecto
<qué hace que este sitio no sea intercambiable con cualquier otro>

## Componentes base
<Button, Card, Nav, Footer — estilo por defecto>

## Librería de componentes (referencia para todo el proyecto)
<lista de componentes reutilizables ya creados, con una línea de qué
hace cada uno y dónde vive el archivo — para que `frontend` reutilice
en vez de recrear un botón/card ligeramente distinto en cada página.
Se actualiza según se van creando, no se rellena de golpe al principio>

## Tells a evitar
<recordatorio corto, ver agents/frontend.md>
```

## Regla clave
Cada página que construya `frontend` confirma que encaja con
`design-brief.md` en vez de repetir la pasada 1 completa.

## Modo POC
Color + tipografía + 1 frase de principio.

## Modo Producción
Documento completo, confirmado por el usuario antes de construir la
primera página.

## Salida
`design-brief.md` en la raíz, antes de la primera delegación a
`frontend`.
