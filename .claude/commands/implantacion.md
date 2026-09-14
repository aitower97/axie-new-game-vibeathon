# /implantacion — Fase final: Plan de Implantación

Documenta cómo se despliega y lanza el proyecto — algo que hasta ahora
ningún subagente cubría. Se guarda en `plan-implantacion.md`. Se genera
al final, cuando `tasks.md` ya está mayormente completado, no al
principio (no tiene sentido planear el despliegue de algo que aún no
existe).

## Qué captura `plan-implantacion.md`

```markdown
# Plan de Implantación: <nombre del proyecto>

## Hosting
<dónde se despliega: Vercel, Netlify, servidor propio...>

## Variables de entorno en producción
<lista de las que necesita el .env.example, con quién las gestiona —
nunca los valores reales aquí>

## Proyecto Supabase de producción
<¿es el mismo proyecto que en desarrollo, o uno separado? Recomendado:
separado, con sus propias migraciones aplicadas>

## Dominio y DNS
<si aplica>

## Checklist de lanzamiento
- [ ] Migraciones de Supabase aplicadas en el proyecto de producción
- [ ] RLS verificada en el proyecto de producción (no solo en local)
- [ ] Variables de entorno cargadas en el hosting
- [ ] Build de producción verificado (`npm run build`)
- [ ] Dominio apuntando correctamente (si aplica)
- [ ] Backup/snapshot inicial de la base de datos
- [ ] Backup recurrente programado (no solo el snapshot inicial) —
      confirma la política de retención de Supabase o un backup propio
- [ ] CDN activo para assets estáticos si la app sirve muchas
      imágenes/archivos (no siempre necesario, pero decídelo
      explícitamente, no por omisión)

## Páginas legales (si la app maneja datos personales de usuarios)
- [ ] Política de privacidad
- [ ] Términos de uso
- Ver `compliance` para el checklist completo de GDPR antes de marcar
  esto como hecho.

## Checklist de seguridad (antes de abrir al público)
- [ ] RLS activa y probada en TODAS las tablas (no solo las "obvias")
- [ ] Rate limiting en Edge Functions/rutas de API propias, no solo el
      límite por defecto de Supabase
- [ ] Validación de inputs en servidor (no solo en el frontend) para
      todo formulario o endpoint que reciba datos de un cliente
- [ ] TLS activo en el dominio propio (si el proyecto usa uno) — Supabase
      ya lo sirve por defecto, pero el hosting del frontend hay que
      confirmarlo aparte
- [ ] Login social (Google u otros) probado en el entorno de producción,
      no solo en local — las `redirect_url` suelen romperse al cambiar
      de entorno

## Checklist de pruebas y observabilidad
- [ ] Suite de tests corriendo en verde
- [ ] CI configurado (los tests corren solos en cada push, no solo
      manualmente)
- [ ] Error tracking configurado (`observability`) y probado con un
      error forzado
- [ ] Alertas activas hacia un canal real (no solo un dashboard que nadie
      mira) — el objetivo es que el equipo se entere antes que el cliente

## Checklist de onboarding (si hay registro de usuarios)
- [ ] Un usuario nuevo entiende qué hacer en los primeros 60 segundos
      sin ayuda externa
- [ ] Estados vacíos (sin datos todavía) tienen una llamada a la acción,
      no una pantalla en blanco

## Plan de rollback
<qué se hace si algo falla tras el lanzamiento — volver a la versión
anterior, o desactivar una feature concreta>

## Modo
<POC | Producción>
```

## Modo POC
Versión mínima: hosting + variables de entorno + un checklist de 3-4
puntos. Un POC normalmente no necesita plan de rollback formal.

## Modo Producción
Documento completo, con plan de rollback explícito y confirmación del
usuario antes de ejecutar el lanzamiento.

## Quién ejecuta lo que aquí se documenta
Este comando solo genera el documento. Si quieres que Claude Code
también ejecute los pasos (no solo los documente), delega al subagente
`deploy` (ver `agents/deploy.md`) usando este documento como guía.

## Salida
`plan-implantacion.md` en la raíz, normalmente hacia el final del
proyecto.
