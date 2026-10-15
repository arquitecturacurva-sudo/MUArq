# Conflictos: usar la version local en el mismo proyecto

Fecha: 15 de octubre de 2026. Base: master `014f16af6103130e80d5162e3c4080099d1ab8bb`.

## Problema y comportamiento

El product owner reporta cinco proyectos visibles en Chrome y uno en Edge. En un proyecto antiguo, Reintentar revela Conflicto de versiones. Los proyectos nuevos y Guardar copia recuperada funcionan segun su comprobacion. El dato disponible no demuestra la causa individual de todos los proyectos ausentes.

Hasta ahora solo se podia usar la nube o conservar la copia local bajo otro ID. Se solicita usar la version local para sustituir la nube en el proyecto original.

Se agrega **Usar mi version** a los conflictos de revision. El usuario confirma que sus datos locales sustituiran a los de nube en el mismo proyecto y que la nube anterior no se podra recuperar con esta accion. La operacion no crea un duplicado y solo se ofrece mientras existe un conflicto de revision. No permite resucitar un proyecto eliminado: para ese caso sigue disponible Conservar ambas como copia nueva.

Usar nube continua reemplazando la copia local. Esta mejora no incorpora Deshacer ni reconstruye una copia local que ya fue descartada anteriormente. Conservar ambas mantiene su comportamiento.

Despues de Usar nube se limpian conflicto/error locales y se actualiza la revision de referencia, la huella del contenido y el indicador de guardado. Se solicita una reconciliacion para reabrir el guardado normal si una lectura previa habia dejado cerrado el gate global. La siguiente edicion permanece en el mismo proyecto y se guarda contra la revision de nube recien cargada. No se marca el conjunto de proyectos como sincronizado solo por cargar uno.

## Integridad

- La lectura remota debe coincidir con la revision del conflicto confirmado.
- La escritura exige nuevamente esa revision dentro de la transaccion de Firestore y la existencia del padre; protege incluso una eliminacion concurrente de un proyecto legacy con revision cero.
- Si la nube cambia, el usuario conserva sus datos locales y debe revisar/confirmar nuevamente. No se reintenta automaticamente una sobrescritura.
- Se comprueban sesion, estudio, proyecto, revision local y propiedad del lease antes de escribir.
- Se limpia el conflicto solo tras un commit confirmado. Cambios locales durante la escritura quedan pendientes de guardado; una revision remota posterior no se revierte.
- No cambian reglas Firebase, claves de almacenamiento, contrato de snapshot, sidebar ni calculos.

Durante la revision se detecto que Usar nube y Conservar ambas aplicaban directamente una entrada de metadatos. Para proyectos migrados con snapshotIndex y datos separados en toolData, faltaba reconstruir el snapshot antes de reemplazar el almacenamiento local. Ahora ambas opciones cargan los datos completos; si falla su reconstruccion se aborta la resolucion y se conserva la copia local.

## Validacion local

- Suite frontend tras la ampliacion de Usar nube: 476 pruebas en 71 archivos, correctas; incluye el ciclo nube → edicion local → guardado.
- TypeScript, lint y build: correctos.
- Casos añadidos: misma identidad de proyecto y datos completos; revision cambiada antes o durante la transaccion; proyecto ausente/eliminado; cambio de sesion/revision local; snapshot de otro estudio; fallo de lectura; conservacion de ediciones durante la escritura; revision posterior protegida; reconstruccion de toolData, compatibilidad legacy y fallo de reconstruccion.
- El test runner requirio ejecucion fuera del aislamiento por EPERM al renombrar sus temporales. El fallo de entorno inicial no se contabiliza como resultado de las pruebas.
- Revision React: accion opcional, callbacks del consumidor, botones deshabilitados durante la operacion, estados por texto y controles de conflicto con salto de linea en pantallas estrechas. Sin dependencias nuevas.

## Aceptacion pendiente con dos sesiones QA

1. Crear un conflicto de revision en un proyecto QA con datos distinguibles.
2. Cancelar la confirmacion de Usar mi version: ninguna copia debe cambiar.
3. Confirmar: se mantiene el ID original; la otra sesion debe recibir los datos locales publicados; no aparece copia recuperada adicional.
4. Volver a editar en la otra sesion antes de confirmar: se rechaza la revision obsoleta y se pide revisar nuevamente.
5. Eliminar remotamente: la copia local se conserva y Usar mi version deja de ofrecerse.
6. Probar Usar nube y Conservar ambas en un proyecto con datos migrados a toolData; verificar datos de las herramientas y su exportacion.
7. Revisar los tres controles a 390 px y con teclado. No utilizar proyectos de clientes para estas comprobaciones.
8. Tras Usar nube, comprobar Guardado en la nube; editar un campo, esperar el nuevo guardado y verificar en la segunda sesion los datos anteriores de nube y el nuevo campo, sin duplicar el proyecto.

La validacion de navegador autenticado, el despliegue y la resolucion de los proyectos reales del video no se declaran ejecutados con este cambio. El punto dos de Beta permanece abierto hasta completar su matriz.
