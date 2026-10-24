# Lectura especializada de cotizaciones de obra en español

## Cambio
La herramienta Cotización de Obra ofrece **Importar cotización**. Usa Mistral Document AI / OCR 4.1 con un esquema y prompt de obra en español. Lee las páginas digitales y escaneadas del mismo PDF. La lectura local anterior sigue disponible.

El nuevo flujo conserva capítulos, códigos, metrados, unidades, precio ofertado, parcial y evidencia de página. Los datos ausentes permanecen vacíos. Los separadores ambiguos requieren corrección. Cada partida debe contrastarse y marcarse como revisada antes de añadirla.

El precio ofertado se guarda como precioUnitarioFijo. No se asigna a materiales ni recibe utilidad y riesgo otra vez. El cálculo de la cotización y el resumen del proyecto usan el mismo criterio. Los porcentajes generales permanecen visibles y editables, y se aplican a toda la cotización. El documento final conserva la identidad del estudio.

## Probar el PR
1. Abrir la preview, entrar en un proyecto o en un recorrido demo y abrir Construcción / Cotización de Obra.
2. Pulsar Importar cotización y Probar con ejemplo. Este ejemplo es ficticio y no llama a Mistral.
3. Contrastar y marcar las dos partidas. Confirmar precios sin IGV, GG 0%, supervisión 0% e IGV 18%. El total seleccionado debe ser S/ 3.540,00.
4. Confirmar selección y agregar. Comprobar las dos partidas, precio ofertado y referencia de origen. Una segunda importación del mismo archivo queda bloqueada mientras existan partidas de ese archivo.
5. Abrir Documento final. Verificar precios, totales e identidad. Recargar y comprobar persistencia y resumen del proyecto. Usar un proyecto vacío para comparar con el total original.
6. En móvil, verificar desplazamiento, edición y acciones del diálogo. Escape o Cerrar cancelan la espera del cliente.

## Activar lectura real en Preview
Configurar **MISTRAL_API_KEY** como variable exclusiva del servidor en Vercel Preview y redeployar la rama. Nunca usar prefijo VITE_. El endpoint reutiliza las credenciales Firebase Admin del servidor (FIREBASE_SERVICE_ACCOUNT_JSON o FIREBASE_SERVICE_ACCOUNT_B64).
No requiere publicar Cloud Functions ni modificar las reglas Firestore. Para desarrollo con API usar vercel dev, o probar la preview: vite solo sirve la interfaz.

La lectura requiere un usuario Firebase con estudio activo y membresía activa admin, owner o editor. Viewer no puede consumir el servicio. La cuota inicial por estudio es 20 solicitudes o 200 páginas al día UTC, reservadas mediante transacción antes de llamar al proveedor. Los fallos también consumen la reserva para limitar reintentos. La colección privada quotationImportUsage solo almacena contadores y fecha. No registra contenido ni claves.

Límites del piloto: PDF de 2,5 MB, 30 páginas y 500 partidas. Para documentos mayores, dividir el PDF. Timeout al proveedor: 90 segundos. Cancelar en el navegador no garantiza cancelar una solicitud que ya llegó al proveedor.

El PDF se envía al proveedor al seleccionarlo, según el aviso en pantalla. Este endpoint no lo almacena. Se conservan las partidas revisadas, hash, nombre y evidencia textual dentro de cot.partidas, con la sincronización existente. Confirmar región y condiciones de tratamiento de datos antes de usar documentos sensibles.

## Verificación
Las pruebas cubren estructura del proveedor, cobertura multipágina, errores y ausencias, idioma y semántica del precio, IGV, autenticación, permisos, cuota, cálculos y compatibilidad de snapshots. La evidencia de ejecución y la preview se registran en el PR. Una prueba con respuesta simulada no demuestra precisión del proveedor. La aceptación con PDF real requiere la clave de Preview y un corpus representativo.

## Fuentes técnicas
- https://docs.mistral.ai/models/ocr-4-1
- https://docs.mistral.ai/api/endpoint/ocr
- https://docs.mistral.ai/studio/document-processing/annotations


## Resultado de la verificación de esta rama
- Suite completa: 518 pruebas aprobadas en 76 archivos.
- TypeScript y ESLint de los archivos TypeScript/React modificados: aprobados.
- Compilación de producción: aprobada. Conserva el aviso de tamaño del bundle existente.
- Navegador local, herramienta real montada sin sesión de cliente: ejemplo de dos páginas, revisión por partida, importación de precios ofertados, subtotal S/ 3.000, IGV S/ 540, total S/ 3.540, documento final y recarga persistente. Se comprobó el bloqueo de una segunda importación del mismo archivo.
- Mistral: contrato HTTP y respuesta simulada probados. No se ejecutó una llamada real: MISTRAL_API_KEY no figura en el inventario de variables de Preview consultado. No se atribuye precisión OCR al ejemplo.

