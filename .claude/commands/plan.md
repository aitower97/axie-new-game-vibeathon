# /plan — Fase 2: Plan técnico (Technical Requirement Document)

A partir de `spec.md`, el coordinador traduce el QUÉ en un CÓMO técnico,
concreto para el stack de este hub (React + Tailwind + Supabase). Se
guarda en `plan.md` — cumple el rol de **Technical Requirement Document
(TRD)**.

## Qué captura `plan.md`

```markdown
# Plan técnico: <nombre del proyecto>

## Schema de datos (borrador)
<tablas, columnas clave, relaciones — esto lo refinará backend-supabase>

## Vistas/rutas principales
<lista de pantallas, qué subagente frontend construirá cada una>

## Auth
<qué proveedor, qué roles>

## Dependencias entre piezas
<qué debe existir antes de qué — ej: schema antes de integration>

## Modo
<POC | Producción>
```

## Regla clave
`plan.md` es lo que el coordinador usa para decidir el ORDEN de
delegación a los subagentes (`scaffolding`, `backend-supabase`,
`frontend`, `integration`, `testing`). No se delega nada de `/tasks` sin
que este documento exista.

## Modo POC
Plan breve, puede caber en 10-15 líneas. Suficiente para no perder el
hilo entre subagentes, no para justificar decisiones ante un comité.

## Modo Producción
Incluye explícitamente los puntos de riesgo (ej: "RLS granular necesaria
en tabla X porque hay datos sensibles") para que el coordinador sepa
dónde activar los gates de `CLAUDE.md`.

## Salida
`plan.md` en la raíz, commiteado junto a `spec.md`.
