# /audit — Fase alternativa: revisar un proyecto ya existente

Usa este comando en vez de `/specify` cuando el proyecto NO es nuevo —
ya está lanzado en producción y quieres revisarlo o mejorarlo.

## Cuándo usarlo

- El cliente pide "revisa mi app" / "por qué falla X" / "mejora el
  rendimiento" sobre un proyecto que ya existe.
- Vas a retomar un proyecto antiguo del que no tienes `spec.md`/`plan.md`
  previos (por ejemplo, se construyó antes de tener este hub).

## Flujo

1. El coordinador delega en `agents/audit.md` con el alcance de la
   revisión (todo, o un foco concreto).
2. `audit` produce `findings.md` — solo lectura, sin tocar código.
3. El coordinador convierte los hallazgos de `findings.md` en entradas
   de `tasks.md`, cada una asignada al subagente que corresponda
   (`frontend`, `backend-supabase`, `integration`, `fixer`...).
4. A partir de ahí, el flujo normal de delegación continúa igual que en
   un proyecto nuevo.

## Diferencia con `/specify`

`/specify` parte de cero: qué se va a construir y por qué. `/audit` parte
de lo que ya existe: qué hay, qué falla, qué mejorar. Si tras la
auditoría el cliente pide funcionalidad nueva además de arreglos, sí crea
un `spec.md`/`plan.md` adicional para esa parte nueva — `audit` no
sustituye la especificación de trabajo nuevo, solo la de trabajo de
revisión.

## Modo POC vs Producción en auditoría
- **POC** (proyecto piloto que quieres revisar antes de decidir si
  sigue adelante): `audit` se centra en riesgos críticos únicamente
  (seguridad, algo que rompe el flujo principal).
- **Producción** (ya lanzado, con usuarios reales): `audit` cubre el
  alcance completo descrito en `agents/audit.md`.

## Salida
`findings.md` en la raíz del proyecto, y `tasks.md` actualizado con las
tareas derivadas de la auditoría.
