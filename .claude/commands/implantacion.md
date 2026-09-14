# /implantacion — Fase final: Plan de Implantación

Documenta despliegue y lanzamiento. Se guarda en `plan-implantacion.md`.
Se genera al final, cuando `tasks.md` ya está mayormente completado.

## Qué captura `plan-implantacion.md`

```markdown
# Plan de Implantación: <nombre del proyecto>

## Hosting
<Vercel, Netlify... — importante para SSR/ISR de Next.js>

## Variables de entorno en producción
<lista, sin valores reales>

## Dominio y DNS
<dominio final, certificado SSL>

## Checklist de lanzamiento SEO
- [ ] Sitemap enviado a Google Search Console
- [ ] Robots.txt verificado en producción (no bloqueando por error)
- [ ] Redirects 301 configurados si hay URLs antiguas que cambian
- [ ] Verificación de propiedad en Search Console
- [ ] Analytics/medición configurada
- [ ] Build de producción verificado
- [ ] CDN activo para assets estáticos (imágenes, fuentes) — no solo el
      hosting del propio Next.js
- [ ] Backup del contenido (si hay CMS/base de datos propia) programado,
      no solo "confiamos en el hosting"

## Páginas legales (si el sitio trata datos personales o usa cookies)
- [ ] Política de privacidad
- [ ] Política de cookies + banner de consentimiento
- [ ] Términos de uso (si hay registro/cuenta)
- Ver `compliance` para el checklist completo de GDPR antes de marcar
  esto como hecho.

## Checklist de seguridad (si hay formularios o área de socios)
- [ ] Validación de inputs en servidor para todo formulario
- [ ] Rate limiting en el endpoint de envío de formularios
- [ ] TLS activo en el dominio de producción
- [ ] Login social (si existe) probado en producción, no solo en local

## Checklist de pruebas y observabilidad
- [ ] Suite de tests corriendo en verde (si el proyecto tiene tests)
- [ ] CI configurado para correr checks en cada push
- [ ] Error tracking configurado (`observability`) y probado
- [ ] Alertas activas hacia un canal real

## Plan de rollback
<qué hacer si algo falla tras el lanzamiento>

## Modo
<POC | Producción>
```

## Modo POC
Hosting + variables de entorno + checklist mínimo (sitemap + robots).

## Modo Producción
Documento completo, con plan de rollback y confirmación del usuario.

## Quién ejecuta lo que aquí se documenta
Este comando solo genera el documento. Para ejecutarlo, delega al
subagente `deploy` (ver `agents/deploy.md`).

## Salida
`plan-implantacion.md` en la raíz, hacia el final del proyecto.
