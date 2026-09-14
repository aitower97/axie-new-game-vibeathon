# /proyecto — Documentación de gestión de proyecto

Genera y mantiene la documentación de proceso que un cliente enterprise
suele exigir por contrato, separada de la documentación técnica. Se
guarda en `plan-proyecto.md`.

## Qué captura `plan-proyecto.md`

```markdown
# Gestión de Proyecto: <nombre del proyecto>

## Charter (una vez, al principio)
- Patrocinador/responsable por parte del cliente
- Objetivo de negocio en una frase
- Fecha de inicio, fecha objetivo de entrega
- Qué NO entra en este proyecto (fuera de alcance, explícito)

## Política de revisión de código (SDLC)
- Toda tarea de un subagente que toque código pasa por revisión antes
  de mergear a la rama principal
- Convención de ramas/commits de este proyecto

## Log de estado (se actualiza, no se reescribe)
| Fecha | Qué se completó | Bloqueos | Próximo paso |
|---|---|---|---|

## Lecciones aprendidas (se añade al final de cada hito)
- <qué funcionó bien>
- <qué se haría distinto>

## Aceptación formal
- [ ] El cliente ha revisado el MVP/entregable
- [ ] Confirmación explícita de aceptación (email, documento)
- [ ] Fecha de aceptación
```

## Modo POC
Solo charter + log de estado. Sin política de revisión formal.

## Modo Producción
Documento completo. La aceptación formal es obligatoria antes de cerrar
el proyecto.

## Salida
`plan-proyecto.md` en la raíz, vive durante todo el proyecto.
