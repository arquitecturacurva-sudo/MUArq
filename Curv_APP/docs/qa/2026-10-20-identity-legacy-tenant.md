# Identidad: rechazo de guardado en un estudio antiguo

Fecha: 20 de octubre de 2026 (Lima). Base: master `c159613`.

## Diagnóstico

El product owner reporta `Missing or insufficient permissions` al guardar Identidad y al subir un logo. La subida primero guarda el perfil; ese guardado actualiza en una sola operación el nombre del estudio y `settings/brand`. Por tanto, un rechazo al actualizar el estudio también impide iniciar la subida.

La consulta de solo lectura al estudio afectado confirma propietario y membresía de administrador válidos, ausencia de `clients/{clientId}.id` y ausencia de un perfil de marca previo. Las reglas activas de Firestore coinciden con las del repositorio. La regla de actualización del estudio exige `request.resource.data.id == clientId`; al faltar el campo heredado, el guardado se rechaza aunque la cuenta tenga el rol correcto.

No es un fallo del archivo de imagen ni una razón para ampliar permisos. Se conserva el ID de la ruta, los roles, proyectos, facturación y reglas existentes.

## Reparación delimitada

Completar únicamente el campo `id` del documento afectado con el ID de su propia ruta, mediante una operación administrativa condicionada a una lectura vigente. Comprobar nuevamente propietario, membresía activa y ausencia del campo; abortar si existe otro identificador o cambian los datos leídos. Verificar después que ningún otro campo del estudio cambió.

No se guardan contactos o identificadores de la cuenta afectada en este informe. El script operativo temporal y sus consultas no se incluyen en el repositorio. La comprobación autenticada en el navegador queda para el product owner después de reparar el dato.

## Prevención y pruebas

- La auditoría de estudios detecta ahora un `id` ausente, vacío o de tipo incorrecto. Antes solo detectaba un string distinto del ID de la ruta.
- Pruebas de auditoría: 10 correctas, incluidas cuatro variantes del campo ausente/inválido.
- Prueba de reglas añadida: reproduce el rechazo en un estudio sin `id`, comprueba que no se crea un perfil parcial, rechaza la reparación desde navegador, completa solo `id` con acceso administrativo y verifica que el mismo guardado funciona. Usuarios ajenos siguen sin poder editar.
- Esta prueba se ejecuta exclusivamente contra emuladores de demo; no escribe datos de clientes. Su resultado se registra en CI antes de aplicar la reparación operativa.

## Resultado operativo

La prueba de reglas del run [39458651461](https://github.com/arquitecturacurva-sudo/MUArq/actions/runs/39458651461), revisión `6df1df4`, pasó antes de la reparación. El primer intento de CI detectó una importación ausente en la prueba nueva; se corrigió y se repitió la validación.

Después se completó únicamente `id` en el estudio afectado mediante una transacción administrativa. Se volvieron a leer usuario, propietario y membresía dentro de la transacción y se exigió la versión vigente del documento. La verificación posterior confirmó que el identificador coincide con la ruta y que todos los otros campos del estudio son idénticos a los anteriores. No se cambiaron reglas, roles, proyectos ni facturación.

Una segunda ejecución de comprobación devolvió `alreadyCanonical: true`, sin escrituras. No se creó un perfil de marca en nombre del usuario ni se subió un logo: el product owner debe reintentar Guardar cambios y la subida desde su sesión para cerrar la aceptación funcional.
