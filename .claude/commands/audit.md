# /audit — Fase alternativa: revisar una web ya existente

Usa este comando en vez de `/specify` cuando la web NO es nueva — ya
está lanzada y quieres revisarla o mejorar su posicionamiento/rendimiento.

## Cuándo usarlo

- El cliente pide "revisa nuestro SEO" / "por qué no posicionamos" /
  "mejora la velocidad" sobre una web que ya existe.
- Vas a retomar un proyecto antiguo sin `spec.md`/`plan.md` previos.

## Flujo

1. El coordinador delega en `agents/audit.md` con el alcance de la
   revisión (todo, o un foco concreto: SEO técnico, contenido,
   performance).
2. `audit` produce `findings.md` — solo lectura.
3. El coordinador convierte los hallazgos en entradas de `tasks.md`,
   asignadas al subagente que corresponda (`seo-technical`,
   `content-seo`, `frontend`, `performance`, `fixer`...).
4. A partir de ahí, el flujo normal de delegación continúa igual que en
   un proyecto nuevo.

## Diferencia con `/specify`

`/specify` parte de cero. `/audit` parte de lo que ya existe. Si tras la
auditoría el cliente pide páginas o funcionalidad nueva además de
arreglos, crea un `spec.md`/`plan.md` adicional para esa parte —
`audit` no sustituye la especificación de trabajo nuevo.

## Salida
`findings.md` en la raíz del proyecto, y `tasks.md` actualizado con las
tareas derivadas de la auditoría.
