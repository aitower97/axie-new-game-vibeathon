# /retro — Retrospectiva que mejora el HUB, no solo el proyecto

Se ejecuta al cerrar un proyecto (o al terminar un hito grande). A
diferencia de la sección de "lecciones aprendidas" de
`plan-proyecto.md` — que se queda en ese proyecto y muere con él —
este comando produce **cambios propuestos al hub** para que el
siguiente proyecto empiece mejor.

Esto es lo que convierte el hub en algo que evoluciona en vez de
envejecer.

## Qué hace el coordinador

1. **Relee** `tasks.md`, `findings.md` (si existe) y el log de estado
   de `plan-proyecto.md` de ESTE proyecto.
2. **Busca patrones**, no anécdotas:
   - ¿Qué tarea tardó mucho más de lo esperado, y por qué?
   - ¿Qué error tuvo que arreglar `fixer` que no está en su chuleta de
     errores típicos?
   - ¿Qué instrucción de un `agents/*.md` resultó ambigua o hubo que
     interpretar sobre la marcha?
   - ¿Qué se hizo repetidamente a mano que podría ser un hook, un
     comando o una sección de un subagente?
   - ¿Algún subagente se quedó corto de alcance, o se solapó con otro?
3. **Contrasta contra la regla de oro** de `docs/aprendizajes.md`:
   solo entra lo que ha pasado más de una vez, costó tiempo real, o
   contradice lo que el hub afirma hoy.
4. **Propone cambios concretos al hub**, en este formato:

```markdown
## Retro: <proyecto> — <fecha>

### Para anotar en docs/aprendizajes.md
- <entrada, con la tabla donde va>

### Cambios propuestos a archivos del hub
| Archivo | Qué cambiar | Por qué |
|---|---|---|
| agents/fixer.md | Añadir a la chuleta: <error> | Apareció en este proyecto y en <otro> |

### Descartado (no cumple la regla de oro)
- <cosa que pasó pero fue puntual de este cliente>
```

5. **NO aplica los cambios automáticamente.** Te los propone y tú
   decides. Un hub que se auto-modifica sin revisión acumula ruido
   rápido, y el ruido en un harness es peor que un hueco: hace que
   futuros subagentes sigan instrucciones que nadie validó.

## Cómo aplicar lo aprobado

Los cambios van al **repo del hub**, no al del proyecto:

```bash
cd ~/hub-<el que sea>     # el repo del hub, no el proyecto
# aplica los cambios aprobados
git commit -m "retro <proyecto>: <qué se aprendió>"
git tag v<n>              # ver docs/versionado.md
git push --tags
```

Los proyectos existentes NO reciben el cambio hasta que actualices su
submodule a propósito — eso es intencionado, ver `docs/versionado.md`.

## Modo POC
Si el proyecto fue un POC descartado, la retro sigue siendo útil — a
veces lo más valioso se aprende de lo que no salió. Pero sé más estricto
con la regla de oro: un POC descartado tiene mucho ruido.

## Modo Producción
Ejecútalo siempre antes de `/handover`. Un proyecto entregado sin retro
es experiencia perdida.

## Salida
Un bloque de retro que tú revisas, y —si apruebas— entradas nuevas en
`docs/aprendizajes.md` del hub y cambios en sus `agents/*.md`.
