# /tasks — Fase 3: Descomposición en tareas delegables

A partir de `plan.md`, el coordinador genera la lista de tareas a
delegar, una por subagente, en orden. Se guarda en `tasks.md`.

## Formato de `tasks.md`

```markdown
# Tareas: <nombre del proyecto>

- [ ] (scaffolding) Montar proyecto Next.js + Tailwind
- [ ] (frontend) Página <home> con estructura semántica
- [ ] (frontend) Página <servicio X>
- [ ] (seo-technical) Metadata + schema.org de <home>
- [ ] (seo-technical) Sitemap.xml + robots.txt
- [ ] (content-seo) Jerarquía de encabezados y copy de <página>
- [ ] (integration) Conectar <blog> con <fuente de datos>
- [ ] (performance) Optimizar imágenes/fuentes de <página>
- [ ] (testing) Lighthouse + validación de datos estructurados
```

## Por qué esto mejora el hub

`tasks.md` es la fuente de verdad persistida: retomar el proyecto en
otra sesión (u otro equipo) es leer el fichero, no reconstruir contexto
de memoria. En proyectos SEO esto importa especialmente porque el
trabajo de keywords/estructura de páginas no debe rehacerse cada vez.

## Modo POC
`tasks.md` corto: scaffolding, páginas principales, metadata básica,
sitemap. Sin tarea dedicada de performance salvo que algo vaya muy lento.

## Modo Producción
Añade una tarea de `seo-technical`/`content-seo` por cada página del
plan (no se agrupan "todas las páginas" en una sola tarea), y una tarea
de `performance` explícita antes del cierre del proyecto.

## Salida
`tasks.md` en la raíz. Se actualiza (no se reescribe desde cero) según
avanza el trabajo.
