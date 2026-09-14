# /specify — Fase 1: Especificación (Product Requirement Document)

Antes de delegar a cualquier subagente, el coordinador usa este comando
para fijar QUÉ se va a construir y POR QUÉ, en un documento persistente
(`spec.md` en la raíz del proyecto). Este documento cumple el rol de lo
que en otros flujos se llama **Product Requirement Document (PRD)** —
mismo contenido, este hub lo llama `spec.md` por consistencia con
`/specify → /plan → /tasks`.

## Propósito

Evitar "vibe coding": que la implementación se desvíe de lo que el cliente
realmente pidió porque la intención solo vivía en la conversación y se
perdió al delegar a un subagente sin memoria compartida.

## Qué captura `spec.md`

```markdown
# Spec: <nombre del proyecto>

## Problema / objetivo
<qué necesidad del cliente resuelve esta app>

## Usuarios y roles
<quién la usa, qué puede hacer cada rol>

## Entidades de datos
<lista de entidades principales, sin diseño técnico todavía>

## Alcance de esta fase
<qué SÍ entra ahora, qué se deja fuera explícitamente>

## Criterios de éxito
<cómo se sabe que esto está "hecho" desde el punto de vista del cliente>
```

## Modo POC
Versión reducida: solo "Problema/objetivo" + "Entidades de datos" + una
frase de alcance. No bloquees velocidad por documentación exhaustiva.

## Modo Producción
Documento completo. El coordinador no avanza a `/plan` sin que el usuario
confirme que `spec.md` refleja lo que quiere.

## Salida
Un fichero `spec.md` en la raíz del proyecto, commiteado en git antes de
tocar código.
