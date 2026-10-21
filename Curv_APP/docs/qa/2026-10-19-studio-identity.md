# Identidad del estudio — 19 de octubre de 2026

Estado posterior: el product owner aprobo la pantalla y la correccion de logo/nombre; PR #37 integrada en master `c1596135a0dbe92a375e72e3235c4e3ae622a570`. El CI final de la revision `c27cb57` aprobo 482 pruebas frontend en 72 archivos, ademas de las suites backend y emulador. Falta comprobar persistencia tras recarga y propuesta/PDF real en produccion; los resultados locales siguientes conservan su alcance original.

## Alcance

La pantalla autenticada conserva sus servicios de carga, guardado y gestión del logo. La presentación se comparte con la revisión local de identidad: datos del estudio, información fiscal opcional, colores, tipografía, posición del logo, firma de Curv y vista previa del documento.

Los controles usan los componentes de CURV APP. La personalización se aplica al documento; la marca del producto permanece independiente. No se migran perfiles existentes ni se cambian sus valores guardados.

## Verificación

- Compilación de producción y lint: correctos. Se mantiene la advertencia existente de tamaño del paquete.
- Suite completa: 72 archivos y 479 pruebas correctas, incluidas tres pruebas nuevas de límites de edición (solo lectura y bloqueo durante operaciones pendientes).
- Navegador, revisión local: nombre y correo de prueba, carga y retirada del SVG propio de CURV, colores, tipografía editorial, alineación derecha, pie de página y desactivación de la firma reflejados en la vista previa.
- Simulación de guardado: estado guardado y botón deshabilitado; una nueva edición permite guardar otra vez. Un color hexadecimal inválido muestra error y puede corregirse.
- Adaptación móvil a 390 × 844: formulario en una columna, campos dentro del ancho disponible, controles y acciones del logo ajustados, sin desbordamiento horizontal.
- Escritorio: formulario y documento visibles en columnas. Se retiró la configuración temporal del tamaño del navegador tras la comprobación.

## Reproducción y límites

### Corrección: logo y nombre comercial

La cabecera conserva siempre el nombre comercial junto al logo, tanto en la vista previa como en el encabezado real y en las copias preparadas para exportar. Mantiene las tres alineaciones y permite que el contenido se ajuste en varias líneas.

Verificación de la corrección: 30 pruebas de identidad y branding correctas, build y lint correctos; comprobación visual local con logo y nombre visibles simultáneamente. Las pruebas cubren las tres alineaciones de la vista previa y el nombre en la cabecera real con logo.

Abrir `/qa/identity.html` con el servidor de desarrollo y seleccionar **Identidad**. La revisión usa los componentes de presentación reales con datos en memoria; no escribe en Firebase y pierde los cambios al recargar.

Esta revisión no acredita una nueva prueba de guardado autenticado contra Firestore/Storage ni la salida del diálogo nativo de impresión. El flujo de persistencia existente se conserva; debe comprobarse en el preview autenticado antes de integrar.
