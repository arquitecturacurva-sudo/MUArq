# Curv OCR: lector propio de cotizaciones de obra

Fecha de verificación: 24 de octubre de 2026, America/Lima.

## Comportamiento

Importar cotización procesa PDFs de hasta 20 MB, 30 páginas y 500 partidas en el navegador. PDF.js conserva texto y coordenadas; Tesseract reconoce español e inglés en páginas/regiones escaneadas. Cada página se evalúa por separado; un PDF mixto no pierde escaneos porque otra página tenga texto. Un logo pequeño no activa OCR por sí solo. Las páginas se rasterizan secuencialmente hasta 10 megapíxeles, con progreso y cancelación.

Curv reconstruye filas, columnas, encabezados y descripciones. Extrae capítulo, código, unidad, metrado, precio unitario y parcial; mano de obra/materiales solo si están explícitos. Las cifras ambiguas permanecen vacías en revisión. Un precio ofertado no se convierte en materiales ni recibe margen de nuevo. Los impuestos y la moneda requieren confirmación cuando el documento no los declara. El total sirve para contrastar, no para inventar valores faltantes.

El modo de segmentación automática puede omitir celdas aisladas. Si la reconstrucción presenta filas incompletas, el lector hace una segunda pasada con segmentación de bloque y añade palabras únicamente en regiones sin reconocer. No calcula la cantidad a partir del parcial.

## Sin servicios OCR externos

Se eliminó el endpoint que enviaba PDFs a Mistral y su variable de entorno. El lector no pide credenciales ni utiliza APIs de IA. REA y el SDK público de Mistral se usaron únicamente durante investigación; no son dependencias de producción.

Worker, WASM y modelos se sirven desde quotation-ocr en el mismo despliegue de Curv. Los modelos spa/eng están versionados; worker/core se copian desde las dependencias bloqueadas con npm run prebuild o predev. El manifiesto verifica versiones, tamaños y SHA-256 y conserva procedencia/licencias. La preparación funciona sin descargar modelos durante el build. La primera lectura descarga recursos estáticos de Curv al dispositivo y las siguientes aprovechan caché. No hay tarifa por documento; sigue existiendo el alojamiento y transferencia habitual del SaaS.

El PDF queda en memoria del navegador y se libera al cerrar. Solo las partidas confirmadas, nombre, hash, página, región y evidencia textual acotada se guardan en cot.partidas y usan la sincronización habitual. Se preservan precios y metadatos de importaciones históricas. No se modifica la fachada runtime.

## Prueba reproducible

1. Abrir la preview en /tests/quotation/index.html (datos ficticios locales), o entrar en Cotización de Obra desde un proyecto de la app.
2. Pulsar Importar cotización y Descargar PDF de prueba. Seleccionar ese mismo archivo con el control de carga. Ver ejemplo de revisión es solo una demostración de edición y no sustituye esta prueba.
3. Esperar dos partidas: página digital 01.01 Limpieza y trazo del terreno, M2, 100 × 10 = 1000; página escaneada 02.01 Concreto en cimentación, M3, 5 × 400 = 2000.
4. Mantener precios sin IGV, GG 0%, supervisión 0%, IGV 18%. Marcar ambas revisiones. La selección debe mostrar subtotal 3000, IGV 540 y total 3540 PEN.
5. Cambiar temporalmente la cantidad de concreto a 6: debe aparecer diferencia con el parcial original y bloquear su revisión. Volver a 5 y confirmar. Agregar partidas revisadas conserva cualquier partida previa.
6. El proyecto QA trae un Muro de prueba. Para comparar el documento final con los 3540 del PDF, eliminar solo esa fila ficticia. Abrir Documento final y recargar: las dos partidas y el total deben mantenerse.
7. Un PDF ya importado queda bloqueado mientras permanezcan partidas con ese hash. Cerrar durante lectura cancela sin guardar datos parciales.

El PDF y su JSON esperado están en public/examples. El generador reproducible es npm run ocr:fixtures. La segunda página no contiene texto PDF, solo una imagen; obliga a ejecutar reconocimiento real.

## Evidencia y alcance

- REA analizó el artefacto oficial del SDK publicado; ver [investigación, hashes y matriz de capacidades](curv-ocr-rea-research.md).
- Pruebas de dominio: geometría, columnas reordenadas, encabezados repetidos, ausencias, decimales, costos desglosados, capítulos y advertencias.
- Pruebas del lector: páginas mixtas, regiones escaneadas junto a texto, límites, fallos, cancelación y liberación. Una regresión simula la celda omitida y exige recuperarla sin subir el archivo.
- Navegador: carga real del PDF mixto, segunda pasada recuperando metrado, corrección con validación, revisión, guardado, documento final y persistencia tras recarga.
- Los mocks verifican contratos y manejo de errores; no demuestran precisión OCR. El PDF ficticio demuestra ese recorrido concreto, no precisión general ni equivalencia con Mistral. Los PDFs de proveedores con diseños distintos requieren validación y ampliación del corpus. Escritura manuscrita fuera de esta versión.

Los resultados finales de suite, compilación y preview se registran en el PR #45.

## Resultado de esta actualización

- 544 pruebas aprobadas en 79 archivos; ESLint y TypeScript aprobados.
- Compilación de preview aprobada; conserva el aviso existente de chunks grandes.
- Recursos OCR, PDF y entrada QA servidos correctamente desde la compilación.
- Recorrido real en navegador aprobado hasta documento final y recarga. La conexión de automatización se perdió después; no se atribuye verificación visual de móvil ni de la preview desplegada.
