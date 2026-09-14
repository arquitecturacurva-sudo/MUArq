# Contrato UX: tenants, miembros y viewers

**Estado:** aprobado  
**Fecha:** 2026-09-12  
**Alcance:** sector **Equipo y acceso** y cualquier flujo que cambie membresías, roles o acceso a proyectos.

## Modelo visible para el usuario

- Un **tenant** representa el estudio o workspace.
- Un **miembro** pertenece al tenant y puede operar según su rol.
- Un **viewer** es un invitado de lectura con acceso únicamente a los proyectos que tenga asignados.
- La interfaz no debe presentar un viewer como si tuviera acceso general al tenant.

## Contexto persistente

- Las superficies muestran la jerarquía `Tenant / sección / proyecto` cuando los tres niveles existan.
- Si una persona pertenece a más de un tenant, la interfaz ofrece un selector de tenant.
- Antes de confirmar una acción sensible, la interfaz muestra el nombre del tenant afectado.
- Cambiar de tenant actualiza de forma conjunta miembros, límites, proyectos, roles y permisos visibles.
- El cambio de contexto no conserva selecciones pertenecientes al tenant anterior.

## Formularios

- Todo control tiene `name` e `id` estables.
- Cada etiqueta usa `htmlFor` para señalar su control.
- Los errores aparecen junto al campo correspondiente y se relacionan mediante `aria-describedby`.
- Al enviar un formulario inválido, el foco se mueve al primer campo con error.
- El resumen o resultado global se anuncia mediante una región `aria-live`.
- Durante una operación asíncrona, la acción principal muestra estado de carga y evita envíos duplicados.
- Después de un error recuperable, los datos ingresados permanecen disponibles.

## Roles y consecuencias

- El selector de rol explica las capacidades y restricciones de cada opción antes de confirmar.
- La confirmación identifica persona, rol anterior, rol nuevo y tenant.
- El rol visible coincide con el permiso efectivo devuelto por el servidor.
- Los viewers seleccionan al menos un proyecto antes de recibir una invitación activa.
- Un viewer no puede editar contenido, administrar miembros, cambiar identidad ni acceder a facturación.

## Seguridad

- Retirar acceso requiere confirmación explícita.
- El propietario no puede ser eliminado mediante el flujo ordinario de miembros.
- El último administrador efectivo no puede ser eliminado ni degradado.
- La interfaz explica el motivo cuando una acción está bloqueada.
- Las acciones reversibles ofrecen undo cuando la reversión sea segura y el servidor pueda garantizarla.
- Los controles del frontend no sustituyen la autorización del servidor ni las reglas de Firestore.

## Diálogos y drawers

- El contenedor usa semántica modal y `aria-modal="true"` cuando bloquea la superficie de fondo.
- El foco inicial llega al primer control útil o al encabezado de error correspondiente.
- Tab y Shift+Tab permanecen dentro del diálogo mientras esté abierto.
- Escape cierra el diálogo cuando no haya una operación irreversible en curso.
- Al cerrar, el foco vuelve al elemento que abrió la superficie.
- El contenido de fondo queda `inert` mientras la superficie modal esté activa.
- En móvil, el cuerpo tiene scroll interno y conserva una safe area inferior.
- El encabezado, el mensaje de contexto y las acciones de confirmación permanecen accesibles sin ocultar campos.

## Comportamiento responsive

- Desktop usa una tabla semántica para colecciones de miembros e invitaciones.
- La tabla conserva encabezados, captions accesibles y acciones operables por teclado.
- Móvil transforma cada registro en una tarjeta o elemento de lista con la misma información y acciones.
- El cambio de presentación no altera el orden de lectura ni oculta tenant, rol, alcance o estado.
- Ninguna acción depende de hover o de desplazamiento horizontal no anunciado.

## Feedback y recuperación

- Éxitos como “Invitación enviada” y “Acceso retirado” se anuncian mediante `aria-live`.
- Cada mutación contempla estados idle, loading, success y error.
- Los errores recuperables ofrecen una acción concreta de reintento.
- Si el servidor rechaza una mutación por conflicto o autorización, la interfaz refresca el estado efectivo antes de permitir otro intento.
- Los mensajes no exponen tokens, identificadores internos innecesarios ni datos de otros tenants.

## Sistema visual y accesibilidad

- El texto operativo usa un tamaño mínimo de 14 px.
- El texto de 12 px se reserva para información secundaria y conserva contraste suficiente.
- Los controles interactivos tienen un objetivo táctil cercano a 44 x 44 px.
- Toda la aplicación comparte un único patrón visible de `focus-visible`.
- Las transiciones respetan `prefers-reduced-motion`.
- Los iconos decorativos usan `aria-hidden="true"`.
- Los iconos que representan una acción tienen un nombre accesible mediante texto visible o `aria-label`.
- El color nunca es la única señal para rol, estado, error o selección.

## Criterios de cierre

El sector no está listo para producción hasta demostrar:

1. Navegación completa con teclado, incluido cambio de tenant, tabla, tarjetas y diálogos.
2. Lectura coherente con un lector de pantalla en desktop y móvil.
3. Interfaz utilizable con zoom del navegador al 200 % sin pérdida de contenido ni acciones.
4. Presentación correcta en viewports móviles con safe area y teclado virtual.
5. Bloqueo en frontend y servidor de eliminación del propietario y del último administrador.
6. Aislamiento de viewers: únicamente pueden leer proyectos asignados dentro del tenant correcto.
7. Restauración del foco y del contexto después de éxito, cancelación y error.
8. Evidencia de estados loading, success, error, reintento y undo cuando corresponda.
9. Ausencia de clipping, scroll atrapado y controles menores al objetivo táctil acordado.

