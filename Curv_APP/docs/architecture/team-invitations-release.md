# Invitaciones: implementacion y operacion

Fecha: 2026-09-21. Base: origin/master a536d44acb79f4cf58e1394942927ef113cd21b3.

## Flujo

1. Un administrador abre Equipo y acceso > Invitar al equipo.
2. Indica correo, rol y, para Viewer, al menos un proyecto real del estudio.
3. Crea la invitacion y copia el enlace para compartirlo. No se envia correo automatico.
4. La persona inicia sesion o crea su cuenta, verifica su correo y confirma estudio y rol.
5. La aceptacion activa la membresia y selecciona el estudio sin crear otro tenant.
6. Un Viewer entra en una vista de lectura de los proyectos asignados.

Los enlaces duran siete dias. Renovar invalida el anterior; cancelar libera la reserva.
El token solo aparece una vez en la respuesta y en el fragmento del enlace. Firestore
almacena SHA-256; el listado no devuelve tokens ni hashes. Un reintento de creacion con
el mismo requestId no reserva otra plaza y requiere renovar si se perdio el enlace.

## Limites y autorizacion

El servidor consulta Auth y membresia activa en cada llamada. Admin/owner puede invitar;
editor y viewer no. La aceptacion exige correo verificado coincidente, enlace vigente,
creador todavia administrador, proyectos existentes y capacidad del plan almacenado.
Las transacciones comparten teamRevision para serializar reservas y cambios concurrentes.
Las reservas pendientes vigentes cuentan contra las plazas; las vencidas no.
No se transforma una membresia existente ni se transfiere la propiedad por invitacion.

Limites por cuenta y hora: 30 creaciones, 60 renovaciones/cancelaciones, 60 intentos
combinados de consulta del enlace y aceptacion. Los tokens invalidos consumen intento.
Los contadores no son editables por el navegador. No hay envio externo ni dependencias nuevas.

## Dependencias

UI -> InvitationGateway -> Firebase callable -> invitationService -> Auth/Firestore.
ViewerWorkspace -> lector de proyecto asignado -> Firestore rules.
TeamSessionGate -> resumen sin billing -> selector de estudio / App / ViewerWorkspace.
El monolito runtime.tsx no recibe features ni cambia su contrato o almacenamiento.

## Verificacion reproducible

- npm test; npm run lint; npm run typecheck; npm run build.
- npm test --prefix functions.
- npm run test:rules (Java 21).
- npm run test:invitations (Auth, Firestore, Storage y Functions emulados).
- scripts/seed-invitations-qa.mjs solo admite demo-curv-team-access y emuladores.
- CI ejecuta ambas suites de emuladores ademas de las comprobaciones del frontend.

Las pruebas cubren permisos, correo incorrecto/no verificado, vencimiento, rotacion,
idempotencia, concurrencia por ultima plaza, cancelar frente a aceptar, alcance Viewer,
invitador degradado, proyecto eliminado, privacidad y aprovisionamiento sin duplicados.

## Orden de despliegue y recuperacion

Publicar primero Firestore rules/indices y las Functions de invitaciones, sesion,
plazas y ensureTenant. Confirmar indices listos antes de publicar frontend.
Despues validar CI y preview, integrar la rama y verificar el despliegue de Vercel.
El frontend anterior es compatible con estas Functions; ante regresion de UI puede
restaurarse el despliegue anterior sin borrar invitaciones ni membresias aceptadas.
No revertir reglas a una version que permita escrituras directas de membresias.

## Limites pendientes

- No hay correo automatico, cambio de rol, revocacion de membresias ni transferencia de propietario.
- No hay limpieza programada de invitaciones vencidas; se conservan para seguimiento.
- Viewer muestra datos publicados de herramientas en lectura, sin los editores operativos.
- Mantener una prueba de aceptacion con cuentas reales antes de anunciar disponibilidad comercial.
- Functions usa Node 20 existente; actualizar antes de su retiro el 2026-10-30.

## Evidencia de cierre

- PR #12: https://github.com/arquitecturacurva-sudo/MUArq/pull/12.
- 303 pruebas frontend, 14 Functions, 20 reglas y 12 integracion: correctas.
- Lint, typecheck y build: correctos. Se conserva el aviso de bundle grande de Vite.
- CI y preview Vercel del commit 601bc51: SUCCESS (2026-09-21).
- Navegador local: administrador crea enlace Viewer, destinatario confirma estudio y rol,
  acepta y entra a Casa Ladera QA; proyecto privado ausente y sin controles de escritura.
  Sin errores del navegador; vista movil revisada.
- Firebase curv-app-ce938: nueve Functions nuevas y ensureTenant presentes el 2026-09-23.
  Las diez rechazan solicitudes anonimas con 401 UNAUTHENTICATED.
- Reglas Firestore activas identicas al archivo probado; indices de grupo members.uid
  e invitations.email en estado READY (verificados el 2026-09-23).
- El merge y despliegue frontend final se registran en el PR. Aceptacion con cuentas
  reales de clientes pendiente; no se crearon usuarios ficticios en produccion.
- La revision automatica quedo temporalmente bloqueada por cuota el 21 de septiembre;
  se retomo sin saltar controles el 23 de septiembre.
