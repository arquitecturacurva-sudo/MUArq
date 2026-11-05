# OCR local y comparación con NVIDIA

## Cambio

El lector local ahora reconoce encabezados centrados y partidos (P. UNITARIO / P. TOTAL), filas sin código ni unidad, capítulos de baños y resúmenes colocados junto a condiciones de pago. Conserva los valores ausentes para revisión. Una segunda pasada de texto disperso se compara con la inicial; se elige una pasada completa sin mezclar celdas de dos OCR.

Las filas con solo parcial ofrecen una acción explícita para confirmar importe global (GLB, cantidad 1). No se añaden automáticamente utilidad, maquinaria ni otros recargos como si fueran supervisión.

El botón NVIDIA exige consentimiento para enviar todas las páginas y conserva los borradores locales si falla. El resultado alternativo solo sustituye la revisión al pulsar «Usar lectura NVIDIA y reiniciar revisión». Volver a local también reinicia la revisión. Los PDFs y sus imágenes no se guardan en el servidor.

## Proveedor y límites

- Modelo fijado: `nvidia/nemotron-parse-2.0`, API alojada de NVIDIA. La ficha 3.5 publicada no acredita disponibilidad de ese modelo en la API usada; no se presenta 2.0 como 3.5.
- La prueba exploratoria anterior consiguió las 15 partidas con 2.0, pero omitió el resumen; otras llamadas devolvieron servicio degradado o respuestas vacías. No se garantiza disponibilidad ni precisión general.
- Solo se interpretan tablas Markdown o LaTeX `tabular`; otros formatos se rechazan. El texto recibido nunca se ejecuta ni se presenta como HTML.
- Imágenes por página hasta 1664 × 2048; máximo 30 páginas, petición 3 MB y espera de proveedor 45 s. Respuestas vacías, truncadas o sin tabla no sustituyen resultados locales.
- Requiere Firebase ID token válido, membresía admin/editor y clave `NVIDIA_API_KEY` en servidor. Cuota transaccional de 60 páginas/día por usuario, independiente del estudio, en `quotationOcrUsage/{uid}`. Solo guarda fecha y contador; las reglas actuales no exponen esta colección a clientes.
- Nunca configurar la clave con prefijo `VITE_`. Para esta evaluación, limitarla al entorno Preview y rama `codex/ocr-local-nvidia`.

Referencias: [ficha Parse 2.0](https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-parse-2_0), [ficha 3.5](https://build.nvidia.com/nvidia/nemotron-3.5-parse/modelcard).

## Validación

- 562 pruebas / 83 archivos aprobados; ESLint, TypeScript y build de preview aprobados.
- Regresiones sintéticas para celdas vacías, encabezados centrados en dos líneas, cambios de escala, código ausente, capítulos y resumen junto a texto lateral.
- Pruebas del endpoint: autenticación, autorización, cuota, límite de tamaño, URLs rechazadas, respuesta vacía/truncada y ausencia de datos del proveedor en errores.
- PDF privado probado en navegador con los modelos locales distribuidos: 15 partidas, seis cantidades/precios unitarios y total de origen identificados. Algunos códigos y letras iniciales requieren corrección; unidades ausentes permanecen vacías.
- Se confirmó e importó una partida global en el proyecto QA local; persistió tras recargar. Un intento NVIDIA sin configuración conservó la revisión local. No se incluyen documentos privados en el repositorio.
- Prueba real adicional de NVIDIA: HTTP 200 en 4,16 s, finalización `stop`. El adaptador comprobó las 15 partidas con sus códigos e importes, incluida la columna combinada ITEM/DESCRIPCIÓN; el proveedor omitió el resumen y se muestra la advertencia correspondiente. Respuesta privada excluida de Git.
- El usuario autorizó y se configuró `NVIDIA_API_KEY` como secreto exclusivo de Preview/rama del PR. También está en `.env.local` ignorado por Git. Firebase autentica y autoriza el endpoint; la clave no se guarda en Firestore.
- Pendiente: validar el recorrido NVIDIA con una sesión Curv editor/admin en la preview. El navegador disponible está conectado a una cuenta de Vercel sin acceso al equipo; la protección se mantiene. El CI del primer commit pasó, incluidas reglas y Cloud Functions.

## Probar

1. Abrir `/tests/quotation/index.html` en la preview para probar OCR local con datos ficticios; pulsar «Importar cotización» y seleccionar el PDF.
2. Revisar las 15 partidas, corregir códigos/unidades ausentes y confirmar los importes globales que correspondan. Revisar IGV y recargos antes de agregar.
3. Para NVIDIA, abrir la aplicación principal, iniciar sesión como editor/admin y abrir Cotización de Obra. Con la clave habilitada, seleccionar el PDF, autorizar el envío y pulsar «Leer también con NVIDIA».
4. Comparar la cantidad de partidas y el original antes de elegir el resultado alternativo. La aprobación del PR y su merge son posteriores a esta prueba.
