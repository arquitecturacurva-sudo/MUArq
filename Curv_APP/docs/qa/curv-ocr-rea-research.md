# Investigación REA para el OCR propio de Curv

Fecha: 24 de octubre de 2026, America/Lima.

## Qué se investigó realmente

Se ejecutó **REA 6.7.0** sobre un subconjunto del artefacto JavaScript distribuido oficialmente como **`@mistralai/mistralai@3.2.0`**. El objetivo fue reconstruir el contrato público del procesamiento documental: entrada PDF, páginas, tablas, regiones, confianza y anotaciones estructuradas. No se llamó a Mistral, no se usaron credenciales y no se generaron consumos de API.

Se siguió el workflow `reverse-engineer-anything` incluido en `rea-agents`: analizar un artefacto publicado, conservar evidencia y distinguir observaciones, inferencias y desconocidos. REA aporta herramientas a los agentes de desarrollo; no forma parte del motor OCR que ejecutará el usuario de Curv.

**Límite:** el SDK contiene validadores, serialización y llamadas HTTP, no los pesos ni el código del reconocimiento remoto. Este análisis no recupera el modelo privado, no observa una ejecución de OCR y no demuestra precisión comparable. La lectura complementaria del JavaScript publicado confirma detalles del contrato; no se atribuyen al analizador relaciones dinámicas que quedaron desconocidas.

## Identidad y resultado de la ejecución

| Dato | Valor comprobado |
|---|---|
| Procedencia npm | `https://registry.npmjs.org/@mistralai/mistralai/-/mistralai-3.2.0.tgz` |
| Repositorio declarado por npm | `https://github.com/mistralai/client-ts.git` |
| SHA-256 del archivo descargado | `b2cffe1d5ef24cbf73ce41f8bef18e99b40396fab768cea2e7db7f5bc019be86` |
| Integridad npm, verificada contra los bytes | `sha512-1R+c+oHZ5xjKpHOali2sZpx1OnSXYsst/CNWrlJiU5syFxW1UTDlZ4jhilvapSyrJvbBDe7PuEOniHPh4n0A/w==` |
| SHA-256 del contenedor seleccionado, según REA | `17eb7da44c8783002abca66236ea99b97578e5d8f95a50539d348354e9a6f30e` |
| Evidence ID | `ev_f71967d143775a02fd00424e517f08075836dfb7231b6b14d461aad557c50e37` |
| Application graph ID | `jag_d927e542c8473f0ee633e44eceb0441216cce14f2eba70e6a4fc8a201b8334c1` |
| Salida conservada localmente | `node_modules/.cache/curv-rea/rea-mistral-sdk-3.2.0.json`, 3.687.007 bytes |
| SHA-256 de esa salida exacta | `8a8f59ffcfe38db7d2f42a4546abc94fee3c25bc68cc05b0e2deaec58375cb2c` |
| Cobertura del subconjunto | 13 archivos relevantes, 12 JavaScript analizados, 23.799 bytes de texto, 2.267 nodos AST visitados, 0 fallos de análisis |

El grafo de artefactos informó cobertura completa **del subconjunto** y ninguna contradicción de integridad. La cobertura semántica global fue **`unknown`**, sin truncamiento ni nodos/relaciones omitidos por límites. Hay dependencias fuera del subconjunto e invocaciones dinámicas no resueltas. Esto no es un análisis completo del SDK ni del servicio de Mistral. La salida completa permanece en caché ignorada; este informe versionado conserva identidad, límites y receta para reproducirla. El hash de la salida y sus identificadores describen esta ejecución concreta, no un resultado portable garantizado entre entornos.

## Hallazgos y aplicación independiente

Las referencias E1–E5 pertenecen al Evidence ID anterior. Se revisaron los módulos que REA identificó y sus bytes publicados:

| Referencia | Módulo del artefacto | SHA-256 del módulo |
|---|---|---|
| E1 | `esm/funcs/ocrProcess.js` | `de20be559f55d7d9893a41cd5a7596803736df9911cd1b97da37166c09969a46` |
| E2 | `esm/models/components/ocrrequest.js` | `3dd857d75de9b774d131146074ba70d12262ca6ff2e924182f0750e4e553c917` |
| E3 | `esm/models/components/ocrpageobject.js` | `5ab60990952a76a2fba493e55082991c2ac07bf9aab0f819f8a2a6e1d4624f92` |
| E4 | `esm/models/components/ocrtableobject.js` | `098bb713c6e9506cdb34ae78cbf57f952b1e0bea750829010f6df9aec41ce015` |
| E5 | `esm/models/components/ocrresponse.js` | `cc07654cc1e8ae1523ae8261ffc59d4049b8ca29f7c4748592a5be344623999e` |

| Capacidad de referencia | Evidencia observada | Equivalente propio de Curv | Comprobación requerida |
|---|---|---|---|
| Separar cliente y reconocimiento | E1 prepara `POST /v1/ocr`, seguridad y respuesta; no ejecuta un motor local | PDF.js y Tesseract abiertos en el dispositivo; assets servidos por Curv | Subir un PDF sin clave y sin solicitudes a proveedores OCR |
| Conservar páginas y contexto | E3 declara índice, texto, dimensiones, encabezado, pie y bloques; E5 contiene un arreglo de páginas | Recorrido de todas las páginas, con origen digital/OCR y referencia individual | PDF digital, escaneado y mixto; ninguna página omitida por encontrar texto en otra |
| Reconstruir tablas | E2 solicita formato de tabla; E4 describe ID, contenido y formato; `ocrtableblock.js` declara coordenadas | Agrupar palabras por posición, detectar encabezados y columnas, unir descripciones multilínea | Columnas reordenadas, encabezados repetidos, páginas continuadas y filas sin bordes |
| Obtener datos estructurados | E2 admite formato y prompt de anotación; E5 admite anotación documental | Esquema propio de capítulos, códigos, unidades, metrado, PU, parcial y desglose explícito | No asignar PU a materiales; ausencias vacías, códigos intactos y resumen fuera de las partidas |
| Mantener evidencia y marcar incertidumbre | E2 admite granularidad de confianza; E3 y E4 contienen campos de confianza | Página, texto y región de origen; advertencias de lectura, ambigüedad y diferencias numéricas | Contrastar cada fila con el documento y revisar antes de guardar; confianza OCR no equivale a costo correcto |
| Continuidad de partidas entre páginas | El contrato E3 ofrece identidad de página; **no demuestra** cómo Mistral une partidas | Continuidad de tabla/capítulo y unión de texto solo con evidencia suficiente | Partida multilínea cortada al cambiar de página, sin duplicar ni combinar códigos iguales |

Las reglas de impuestos, moneda, precios ofertados y costos son decisiones del dominio de Curv. No se deducen del SDK. La documentación oficial explica que las anotaciones documentales combinan OCR con un modelo multimodal; sustituir esa función por reglas especializadas es una implementación independiente cuya calidad necesita medirse, no una copia de esa arquitectura.

## Reproducción sin API

Desde la raíz de `Curv_APP`, con Node.js compatible con REA 6.7.0 y PowerShell:

```powershell
New-Item -ItemType Directory -Force node_modules/.cache/curv-rea/sdk-ocr-subset | Out-Null
npm pack @mistralai/mistralai@3.2.0 --ignore-scripts --silent --pack-destination node_modules/.cache/curv-rea
tar -xf node_modules/.cache/curv-rea/mistralai-mistralai-3.2.0.tgz -C node_modules/.cache/curv-rea/sdk-ocr-subset package/package.json package/LICENSE package/esm/sdk/ocr.js package/esm/funcs/ocrProcess.js package/esm/models/components/ocrrequest.js package/esm/models/components/ocrresponse.js package/esm/models/components/ocrpageobject.js package/esm/models/components/ocrtableobject.js package/esm/models/components/ocrtableblock.js package/esm/models/components/ocrblockconfidencescores.js package/esm/models/components/ocrpagedimensions.js package/esm/models/components/responseformat.js package/esm/models/components/documenturlchunk.js package/esm/models/components/imageurlchunk.js
npm exec --yes --package=rea-agents@6.7.0 -- rea analyze-javascript-application node_modules/.cache/curv-rea/sdk-ocr-subset/package --max-semantic-nodes 20000 --max-semantic-nodes-per-file 5000 --analysis-timeout-ms 60000 --format json | Out-File -Encoding utf8 node_modules/.cache/curv-rea/rea-mistral-sdk-3.2.0.json
```

Usar un directorio de subconjunto nuevo o conservar exactamente la selección indicada. No se importa ni ejecuta el SDK de Mistral: REA analiza sus archivos como texto inerte. No requiere registrar MCP, instalar un descompilador nativo ni cambiar la configuración global de los agentes. El paquete de Mistral y la herramienta REA permanecen fuera de las dependencias de producción de Curv.

## Fuentes y límites de aceptación

- [REA oficial y workflow de investigación](https://github.com/morluto/rea).
- [Paquete publicado analizado](https://www.npmjs.com/package/@mistralai/mistralai/v/3.2.0) y [repositorio oficial del SDK](https://github.com/mistralai/client-ts).
- [Capacidades documentadas del OCR](https://docs.mistral.ai/studio/document-processing/basic_ocr).
- [Anotaciones documentales y uso de un modelo multimodal](https://docs.mistral.ai/studio/document-processing/annotations).

Esta investigación acredita inspección estática del contrato público. Las comprobaciones de la matriz son criterios para el lector de Curv; no se registran aquí como pruebas aprobadas del producto. La evidencia de implementación y ejecución se documenta en la QA del PR. Un ejemplo ficticio correcto no acredita exactitud sobre cotizaciones reales ni paridad con Mistral.
