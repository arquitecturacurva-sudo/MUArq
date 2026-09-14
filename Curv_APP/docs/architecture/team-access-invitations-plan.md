# Plan de implementacion: invitaciones de Equipo y acceso

Fecha de cierre: 2026-09-14.
Estado: plan pendiente de implementacion. No confundir con una feature operativa.
Base publicada: PR #10, merge a536d44acb79f4cf58e1394942927ef113cd21b3.
Contrato normativo: [tenant-access-ux.md](../contracts/tenant-access-ux.md).

## Objetivo y criterio de terminado

Un administrador invita a una persona real, comparte el enlace, la persona acepta
con su cuenta y entra al estudio con el rol y los proyectos correctos en produccion.
Un boton visible o una invitacion pendiente no bastan para considerar terminado el trabajo.

## Estado real al cerrar

- Equipo y acceso esta integrado en la navegacion principal y lee el estudio activo,
  sus miembros y limites reales desde Firebase para administradores y editores activos.
- No existe backend de invitaciones. El boton productivo sigue oculto; las mutaciones
  estan deshabilitadas. El prototipo independiente solo simula cambios en memoria.
- Firestore y Storage bloquean escrituras directas de membresias, incluso para admins.
- Los Viewers solo tienen permiso de lectura de proyectos asignados en las reglas;
  el frontend todavia necesita consultas acotadas y un resumen de estudio sin billing.
- Identidad y el nombre del estudio solo los modifica el propietario activo.
  Guardar Identidad sincroniza companyName y clients.name en una transaccion.
- Ser administrador no implica ser propietario ni permite transferir la propiedad.

## Decisiones propuestas, aun por confirmar

- Primera version con enlace para copiar y compartir, sin correo automatico.
- Vencimiento de siete dias.
- Las invitaciones pendientes y vigentes reservan plaza.
- El correo autenticado debe estar verificado y coincidir con el correo invitado.

El usuario pidio guardar el plan; no confirmo expresamente enlace frente a correo
ni el plazo de siete dias. Retomar esa decision antes de implementar el flujo final.
No hay una estimacion de entrega comprometida.

## Modelo propuesto

Separar clients/{tenantId}/invitations/{invitationId} de members/{uid}.
Cada invitacion registra correo normalizado, rol, proyectos, creador, fechas,
estado (pending/accepted/cancelled/expired) y datos de aceptacion necesarios.
El esquema exacto se decide al revisar el backend; estas rutas son propuestas.

El enlace lleva un token aleatorio de alta entropia. Guardar solo su hash; nunca
registrar el token en logs ni exponerlo en listados. No incluir correo en la URL.
Definir normalizacion conservadora del correo, sin reinterpretar puntos o aliases.
La caducidad se comprueba en el servidor aunque no haya corrido una tarea de limpieza.

## Operaciones nuevas de servidor

1. Crear invitacion: comprobar actor admin activo, tenant, rol, proyectos pertenecientes
   al estudio y plazas. Rechazar duplicados sin reservar otra plaza. Generar enlace.
2. Listar invitaciones: solo administradores autorizados; nunca devolver hashes/tokens.
3. Aceptar: validar token, estado, vencimiento, correo verificado, vigencia del estudio
   y permisos actuales del invitador. Revalidar proyectos y reserva de plaza.
4. Cancelar: comprobar administrador activo, invalidar enlace y liberar reserva una vez.
5. Renovar: invalidar token anterior, emitir otro y aplicar la misma politica de cuotas.

La aceptacion debe ser atomica e idempotente: crear la membresia, consumir la reserva,
marcar la invitacion aceptada y actualizar los estudios del usuario sin perder los previos.
Un miembro existente no cambia de rol silenciosamente al aceptar otro enlace.

La concurrencia de la ultima plaza se debe serializar en una transaccion sobre un
estado comun del tenant, no mediante contar documentos y escribir fuera de transaccion.
Definir contabilizacion compatible con los limites existentes antes de codificar.
Agregar limites de solicitudes y controles de abuso para creacion y aceptacion.

## Reglas y autorizacion

El navegador no crea ni modifica invitaciones ni membresias directamente.
Las Functions usan Admin SDK y deben verificar las reglas de negocio explicitamente.
No conceder acceso a proyectos mientras la invitacion este pendiente.
Mantener owner -> admin y observer -> viewer en lectura legacy, sin inferir proyectos.
Preservar bloqueo del propietario, ultimo administrador y aislamiento entre tenants.
No cambiar reglas de facturacion ni permisos de las nueve herramientas por conveniencia.

## Integracion frontend y Auth

- Habilitar Invitar solo con backend conectado; mostrar exito tras confirmacion real.
- Formulario: correo, rol y al menos un proyecto si es Viewer; errores tipados y reintento.
- Mostrar pendientes, copiar enlace, cancelar y renovar con confirmacion apropiada.
- Crear pantalla de aceptacion que sobreviva al inicio de sesion sin filtrar el token.
- Revisar ensureTenant y el bootstrap: registrar una cuenta desde invitacion no debe
  crear automaticamente otro estudio. Mantener idempotencia y estudios existentes.
- Conectar selector de estudios reales y persistir el estudio activo autorizado.
- Completar consultas de proyectos Viewer y resumen seguro del tenant sin billing.
- Probar recarga, cierre de sesion y cambio de estudio sin mezclar datos locales.
- Mantener los dialogs accesibles compartidos; no introducir otro sistema visual.

## Secuencia de trabajo al retomar

1. Fetch origin/master, revisar working tree y crear rama nueva desde master actualizado.
2. Leer este plan, contrato UX y los servicios/Functions actuales; confirmar decisiones abiertas.
3. Definir esquema y reglas puras, errores, cuotas e idempotencia con pruebas.
4. Implementar Functions y pruebas con Auth/Firestore emulados; conservar membresias legacy.
5. Conectar crear/listar/cancelar/renovar y aceptar, junto con el bootstrap de invitado.
6. Completar selector de estudios y recorrido Viewer antes de habilitar invitaciones Viewer.
7. Verificar end-to-end con dos cuentas de prueba autorizadas y dos estudios.
8. Revisar PR y CI. Desplegar backend/reglas compatibles antes de habilitar interfaz.
9. Verificar produccion y documentar rollback. No declarar terminado sin aceptacion real.

## Pruebas de aceptacion obligatorias

- Administrador autorizado puede invitar; editor, Viewer y usuario externo no pueden.
- Viewer sin proyectos o con proyectos de otro estudio es rechazado.
- Correo distinto/no verificado, token invalido, vencido o cancelado no activan membresia.
- Dos aceptaciones/reintentos no duplican miembros ni plazas.
- Competencia por ultima plaza, duplicados y cancelar/aceptar simultaneamente son consistentes.
- Invitador revocado/degradado no permite aceptar con permisos obsoletos.
- Miembro existente conserva sus otros estudios y no recibe un cambio de rol silencioso.
- Invitado nuevo no crea un estudio extra por el bootstrap.
- Viewer accede solo a proyectos asignados; no edita, administra ni lee facturacion.
- Propietario y ultimo administrador conservan protecciones.
- Reglas reales en emuladores, pruebas Functions, npm test, lint, typecheck y build.
- Navegador desktop/mobile: crear -> compartir -> aceptar -> entrar -> permisos correctos.

## Referencias y pendientes de mantenimiento

- [Estado del proyecto](../PROJECT_STATUS.md).
- [Despliegue Firebase realizado](team-access-preview-rollout.md).
- src/application/tenant/tenantAccessService.ts y src/domain/tenant/tenantRepository.ts.
- src/infrastructure/tenant/firebaseTeamReader.ts: lectura productiva, no invitaciones.
- src/composition/ConnectedTeamAccess.tsx: composicion actual.
- functions/src/tenant/ensureTenant.ts: revisar antes de modificar alta por invitacion.
- Node.js 20 de Functions debe actualizarse antes del 2026-10-30.
