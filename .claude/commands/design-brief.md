# /design-brief — Fase intermedia: UI/UX Design Brief (a nivel de proyecto)

Eleva la "pasada 1" de diseño que `agents/frontend.md` hace por página a
un documento único de proyecto: `design-brief.md`. Se genera UNA vez,
antes de que `frontend` construya la primera pantalla, y todas las
páginas posteriores heredan de él en vez de reinventar paleta/tipografía
cada vez.

## Por qué existe

Sin esto, cada página que construye `frontend` podría (en teoría)
proponer su propia paleta o tipografía en su pasada 1, y el resultado
final no seria un producto coherente sino un collage de pantallas que no
parecen del mismo proyecto.

## Qué captura `design-brief.md`

```markdown
# Design Brief: <nombre del proyecto>

## Sector y audiencia
<del spec.md — para qué el diseño debe sentirse creíble>

## Sistema de color
<4-6 hex con rol de cada uno: base, acento, texto, superficies...>

## Tipografía
<familia(s) elegida(s) y jerarquía: h1/h2/h3/body/label>

## Principio de diseño del proyecto
<qué hace que este producto no sea intercambiable con cualquier otro de
su sector — 1-2 frases>

## Componentes base y su estilo
<Button, Card, Input, Modal — cómo se ven por defecto, para que
`frontend` no los reinvente por pantalla>

## Librería de componentes (referencia viva, se actualiza)
<lista de componentes ya creados con una línea de qué hace cada uno y
dónde vive el archivo — `frontend` la consulta antes de crear un
componente nuevo, para reutilizar en vez de duplicar con variaciones
ligeras>

## Tells a evitar (recordatorio, ver agents/frontend.md)
<lista corta de qué NO hacer, específica a este proyecto si aplica>
```

## Regla clave
Cada página que construya `frontend` a partir de aquí NO repite la
"pasada 1" completa de `agents/frontend.md` — solo confirma que encaja
con `design-brief.md` y añade, como mucho, el principio específico de
ESA pantalla si lo necesita.

## Modo POC
Versión reducida: color + tipografía + 1 frase de principio. Los
componentes base se definen sobre la marcha en la primera pantalla que
los necesite.

## Modo Producción
Documento completo, y `frontend` no empieza ninguna pantalla sin que
`design-brief.md` exista y esté confirmado por el usuario.

## Salida
`design-brief.md` en la raíz, antes de la primera delegación a
`frontend`.
