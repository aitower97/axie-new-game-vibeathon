# /handover — Traspaso del proyecto al cliente

Documenta todo lo que el cliente (o el equipo que reciba el proyecto)
necesita para mantenerlo sin depender de quien lo construyó. Se guarda
en `handover.md`.

## Por qué existe

Un proyecto entregado sin traspaso genera dependencia indefinida: cada
cambio menor requiere volver a llamar a quien lo construyó, y si esa
persona no está disponible, el cliente se queda bloqueado con un
sistema que no entiende. Este documento es lo que convierte una entrega
en una entrega real.

Es distinto de `plan-implantacion.md` (cómo se despliega) y de
`plan-proyecto.md` (cómo se gestionó el proyecto): esto es **cómo se
vive con el resultado** una vez el proyecto termina.

## Qué captura `handover.md`

```markdown
# Traspaso: <nombre del proyecto>

## Accesos y credenciales
<QUÉ accesos existen y QUIÉN los tiene — nunca los valores reales aquí.
Ej: "cuenta de hosting: titular es el cliente, gestionada desde
<proveedor>"; "API keys: almacenadas en <gestor de secretos>, acceso
concedido a <roles>">

## Titularidad
<a nombre de quién están: dominio, hosting, cuentas de servicios
externos. Si algo está a nombre de la agencia/desarrollador y debería
pasar al cliente, indícalo explícitamente como pendiente>

## Cómo hacer los cambios más habituales
<los 3-5 cambios que el cliente va a querer hacer solo: cambiar un
texto, añadir contenido, actualizar un dato de contacto. Paso a paso,
sin dar por sabido nada>

## Qué NO debe tocarse sin ayuda técnica
<archivos de configuración, migraciones, variables de entorno — con una
frase de por qué>

## Cómo saber si algo va mal
<dónde ver los errores registrados (`observability`), qué alertas
existen y a quién llegan>

## Qué hacer si algo se rompe
<orden de actuación: qué revisar primero, cómo hacer rollback si
aplica, a quién contactar y con qué información>

## Mantenimiento recurrente
<lo que hay que hacer periódicamente aunque nadie lo pida: actualizar
dependencias, revisar backups, renovar certificados/dominios y cuándo
vencen>

## Contactos
<quién es responsable de qué, por parte del cliente y por parte de
quien lo construyó, mientras dure el soporte acordado>
```

## Regla clave: ningún secreto en este documento

`handover.md` acaba compartido por email, en un drive, o impreso.
Documenta DÓNDE están las credenciales y QUIÉN tiene acceso, nunca los
valores. Si el proyecto no usa un gestor de secretos, esa es la primera
recomendación del traspaso.

## Modo POC
No suele aplicar — un POC/demo no se traspasa. Sáltate este comando
salvo que el POC se quede en manos del cliente de forma indefinida.

## Modo Producción
Obligatorio antes de dar el proyecto por cerrado, junto a la aceptación
formal de `plan-proyecto.md`. Un proyecto "aceptado" pero sin traspaso
no está realmente entregado.

## Salida
`handover.md` en la raíz del proyecto, al final, revisado con el
cliente (no solo enviado).
