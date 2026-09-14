# /proyecto — Documentación de gestión de proyecto

Genera y mantiene la documentación de proceso que un cliente enterprise
suele exigir por contrato, separada de la documentación técnica
(`spec.md`/`plan.md`). Se guarda en `plan-proyecto.md`.

## Por qué existe

`spec.md`/`plan.md`/`tasks.md` documentan QUÉ se construye. Este
documento documenta CÓMO se gestiona el proyecto como proceso: quién
decide qué, qué se acordó, qué se aprendió, y quién dio el visto bueno
final — preguntas que ningún otro documento de este hub responde.

## Qué captura `plan-proyecto.md`

```markdown
# Gestión de Proyecto: <nombre del proyecto>

## Charter (una vez, al principio)
- Patrocinador/responsable por parte del cliente
- Objetivo de negocio en una frase (mismo que spec.md, aquí como referencia rápida)
- Fecha de inicio, fecha objetivo de entrega
- Qué NO entra en este proyecto (fuera de alcance, explícito)

## Política de revisión de código (SDLC)
- Toda tarea de un subagente que toque código pasa por revisión antes
  de mergear a la rama principal (aunque la revisión sea el propio
  desarrollador humano leyendo el diff, no solo confiar en el subagente)
- Convención de ramas/commits que sigue este proyecto

## Log de estado (se actualiza, no se reescribe)
| Fecha | Qué se completó | Bloqueos | Próximo paso |
|---|---|---|---|

## Lecciones aprendidas (se añade al final de cada hito, no al final del proyecto)
- <qué funcionó bien>
- <qué se haría distinto>

## Aceptación formal
- [ ] El cliente ha revisado el MVP/entregable
- [ ] Firma o confirmación explícita de aceptación (email, documento)
- [ ] Fecha de aceptación
```

## Modo POC
Solo el charter (una frase de objetivo + alcance) y el log de estado.
Sin política de revisión formal todavía — para una demo no hace falta.

## Modo Producción
Documento completo. La aceptación formal es OBLIGATORIA antes de
considerar el proyecto cerrado — sin esto, no hay constancia de que el
cliente aprobó lo entregado.

## Cuándo se actualiza
- El charter se escribe una vez, al principio.
- El log de estado se actualiza en cada sesión relevante (no hace falta
  una entrada por cada tarea de `tasks.md`, sí por cada hito).
- Las lecciones aprendidas se añaden progresivamente, no se dejan para
  el final — para entonces ya se olvidó el detalle.

## Salida
`plan-proyecto.md` en la raíz, vive durante todo el proyecto (no es una
fase que se genera una vez y se abandona, como sí lo son `spec.md`/
`plan.md`).
