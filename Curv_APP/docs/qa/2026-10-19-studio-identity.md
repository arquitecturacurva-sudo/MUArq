# Identidad del estudio — 19 de octubre de 2026

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

Abrir `/qa/identity.html` con el servidor de desarrollo y seleccionar **Identidad**. La revisión usa los componentes de presentación reales con datos en memoria; no escribe en Firebase y pierde los cambios al recargar.

Esta revisión no acredita una nueva prueba de guardado autenticado contra Firestore/Storage ni la salida del diálogo nativo de impresión. El flujo de persistencia existente se conserva; debe comprobarse en el preview autenticado antes de integrar.
