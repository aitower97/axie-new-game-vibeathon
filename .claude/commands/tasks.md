# /tasks — Fase 3: Descomposición en tareas delegables

A partir de `plan.md`, el coordinador genera la lista concreta de tareas
que va a delegar, una por subagente, en orden. Se guarda en `tasks.md`
como checklist.

## Formato de `tasks.md`

```markdown
# Tareas: <nombre del proyecto>

- [ ] (scaffolding) Montar proyecto Vite + Tailwind + cliente Supabase
- [ ] (backend-supabase) Schema de <entidad> + RLS
- [ ] (backend-supabase) Schema de <entidad> + RLS
- [ ] (frontend) Vista de <pantalla> con datos mock
- [ ] (frontend) Vista de <pantalla> con datos mock
- [ ] (integration) Conectar <vista> con <tabla>
- [ ] (testing) Smoke test / suite de <flujo>
```

Cada línea es una delegación atómica (una llamada al Task tool). El
coordinador marca `[x]` cuando el subagente confirma el criterio de
"hecho" de su propio `agents/<nombre>.md`.

## Por qué esto mejora el hub

Sin `tasks.md`, el coordinador reconstruye mentalmente en cada turno qué
falta por delegar — con conversaciones largas eso se degrada. Con
`tasks.md` como fuente de verdad persistida, retomar el proyecto en otra
sesión (u otro equipo) es leer el fichero, no reconstruir contexto.

## Modo POC
`tasks.md` puede ser tan corto como 4-5 líneas. Solo lo justo para no
perder el hilo de dependencias (schema antes de integration, etc.).

## Modo Producción
Añade una línea por cada punto de riesgo detectado en `plan.md` (ej. una
tarea explícita de `testing` para el flujo de RLS).

## Salida
`tasks.md` en la raíz. Se actualiza (no se reescribe desde cero) según
avanza `/implement`.
