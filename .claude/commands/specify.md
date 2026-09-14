# /specify — Fase 1: Especificación (Product Requirement Document)

Antes de delegar a cualquier subagente, el coordinador fija QUÉ se va a
construir y POR QUÉ, en `spec.md` en la raíz del proyecto. Cumple el
rol de **Product Requirement Document (PRD)**.

## Qué captura `spec.md`

```markdown
# Spec: <nombre del proyecto>

## Problema / objetivo de negocio
<qué quiere conseguir el cliente con esta web: leads, ventas, autoridad>

## Sector y audiencia
<a quién se dirige la web, qué busca esa audiencia>

## Páginas principales
<home, servicios, blog, contacto... lo que aplique>

## Contenido dinámico
<¿hay blog/catálogo que crece con el tiempo? ¿quién lo gestiona?>

## Alcance de esta fase
<qué SÍ entra ahora, qué se deja fuera explícitamente>

## Criterios de éxito
<cómo se sabe que esto está "hecho" desde el punto de vista del cliente>
```

## Modo POC
Versión reducida: objetivo de negocio + lista de páginas + una frase de
alcance. No bloquees velocidad por documentación exhaustiva.

## Modo Producción
Documento completo. El coordinador no avanza a `/plan` sin que el
usuario confirme que `spec.md` refleja lo que quiere.

## Salida
`spec.md` en la raíz del proyecto, commiteado antes de tocar código.
