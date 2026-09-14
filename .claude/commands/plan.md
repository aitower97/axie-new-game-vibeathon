# /plan — Fase 2: Plan técnico + estrategia SEO (Technical Requirement Document)

A partir de `spec.md`, el coordinador traduce el QUÉ en un CÓMO técnico
Y en una estrategia de posicionamiento concreta. Se guarda en `plan.md`
— cumple el rol de **Technical Requirement Document (TRD)**. En este
hub, la parte SEO del plan NO es opcional.

## Qué captura `plan.md`

```markdown
# Plan técnico: <nombre del proyecto>

## Arquitectura de páginas (sitemap conceptual)
<jerarquía de URLs: /, /servicios, /servicios/x, /blog, /blog/slug...>

## Palabras clave objetivo por página
<tabla: página → keyword principal → keywords secundarias>

## Estrategia de renderizado
<qué páginas son estáticas (SSG), cuáles necesitan ISR/revalidación,
cuáles SSR puro — depende de si el contenido cambia>

## Datos estructurados necesarios (schema.org)
<ej: Organization, LocalBusiness, Article, Product, FAQPage...>

## Fuente de datos
<CMS headless, Supabase, MDX en el repo, mezcla>

## Modo
<POC | Producción>
```

## Regla clave
`plan.md` es lo que usa el coordinador para decidir el ORDEN de
delegación. `seo-technical` y `content-seo` no se delegan hasta que la
tabla de keywords por página exista, aunque sea en borrador.

## Modo POC
Plan breve: arquitectura de páginas + keyword principal por página (sin
secundarias todavía) + qué es estático vs dinámico.

## Modo Producción
Incluye investigación de keywords más completa, y explícitamente qué
páginas compiten por qué términos (para evitar canibalización SEO entre
páginas del mismo sitio).

## Salida
`plan.md` en la raíz, commiteado junto a `spec.md`.
