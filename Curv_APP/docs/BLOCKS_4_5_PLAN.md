# Plan técnico — Bloques 4 y 5

## Decisión para la presentación

Los Bloques 4 y 5 quedan en fase de diseño técnico. No se migra ningún PDF en este avance.

El Bloque 6 puede operar de forma independiente con las herramientas y los exportadores actuales. Las demos precargan datos reales de cada herramienta y conservan su exportación vigente; por tanto, esta decisión no bloquea la galería, el tour, el reinicio ni la duplicación de demos.

La consecuencia conocida es visual: hasta completar los Bloques 4 y 5, los PDF generados desde una demo mantienen el estilo actual y todavía no aplican de forma uniforme toda la identidad configurada en el Bloque 3.

## Bloque 4 — Motor documental común

### Objetivo

Crear una única capa de tema y composición para documentos, conectada al perfil de marca existente, y probarla en un PDF piloto antes de ampliar el cambio.

### Arquitectura propuesta

1. Definir `DocumentTheme` como contrato estable y agnóstico de cada herramienta.
   - Identidad: logo seguro, nombre comercial y datos de contacto.
   - Tipografía: familias, pesos y escalas para título, subtítulo, cuerpo y notas.
   - Color: primario, acento, texto, fondos, bordes y estados.
   - Geometría: márgenes, espaciado, radios, densidad y tamaños de página.
   - Metadatos: versión del tema y valores de respaldo deterministas.
2. Mantener un único adaptador `BrandProfile -> DocumentTheme`.
   - Normalizar colores y tipografías antes de renderizar.
   - Resolver valores faltantes con el tema CURV por defecto.
   - Evitar que cada PDF lea o interprete directamente el perfil de marca.
3. Crear componentes documentales compartidos.
   - Página, encabezado, pie y numeración.
   - Portada, bloque de identidad y metadatos del proyecto.
   - Secciones, tablas, métricas, alertas, firmas y saltos de página.
   - Reglas para logo ausente, texto largo y tablas multipágina.
4. Migrar un solo documento piloto: la propuesta de honorarios.
   - Tiene suficiente variedad visual para validar portada, tablas, totales y notas.
   - Mantener el mismo contenido y cálculo; cambiar únicamente la presentación.
5. Comparar el PDF anterior y el piloto con datos representativos.
   - Vista previa en pantalla y exportación final.
   - Formatos A4, textos largos, montos, logo y ausencia de logo.
   - Contraste, cortes de página, encabezados repetidos y legibilidad de impresión.

### Entregables previstos

- Contrato tipado `DocumentTheme`.
- Adaptador único desde el perfil de marca.
- Primitivas documentales compartidas.
- Propuesta de honorarios migrada como piloto.
- Pruebas del adaptador y una matriz de revisión visual del PDF.

### Criterio de salida

El piloto debe reproducir todos los datos y cálculos actuales, aplicar la identidad de manera segura y exportar sin recortes ni regresiones. Solo entonces se inicia la migración masiva del Bloque 5.

## Bloque 5 — Migración del catálogo de PDF

### Objetivo

Llevar todos los documentos al motor común sin modificar su lógica de negocio.

### Orden de migración propuesto

1. Documentos de diseño:
   - Calculadora de honorarios.
   - Matriz de entregables.
   - Exclusiones.
   - Cronograma por etapas.
2. Documentos de construcción:
   - Cotización de obra.
   - Cronograma de obra.
   - Brief y programa.
3. Documentos de seguimiento:
   - Valorización.
   - Orden de cambio.
4. Documento combinado:
   - Propuesta consolidada, cuando todos sus documentos fuente ya usen el tema común.

### Método por documento

1. Congelar una muestra de entrada y un PDF de referencia.
2. Separar el modelo de datos del código de presentación si aún están acoplados.
3. Reemplazar estilos locales por componentes y tokens de `DocumentTheme`.
4. Verificar paridad de contenido, cálculos y orden de secciones.
5. Revisar visualmente los casos normal, extenso y sin logo.
6. Activar el documento migrado sin cambiar los demás exportadores.

### Controles transversales

- El PDF recibe un tema ya normalizado; nunca datos crudos de configuración.
- El logo se consume únicamente desde la ruta segura del Bloque 3.
- Ningún documento debe depender del estado de otro proyecto o demo.
- Los valores monetarios, fechas y unidades conservan la configuración del proyecto.
- Cada migración mantiene una vía de comparación con el exportador anterior hasta su aceptación.

### Criterio de salida

Todos los PDF deben compartir identidad, jerarquía y componentes; conservar el contenido y los cálculos actuales; y superar revisión visual con las tres demos del Bloque 6 como conjunto de regresión.

## Puente mínimo utilizado por el Bloque 6

Para la presentación solo se necesita que cada demo:

- hidrate los datos ya aceptados por las herramientas actuales;
- abra las herramientas y sus vistas de documento existentes;
- permita exportar con los mecanismos actuales;
- mantenga sus datos aislados de proyectos reales y de la sincronización;
- pueda reiniciarse y duplicarse de forma determinista.

No se introducen dependencias temporales con `DocumentTheme`, ni se modifica el contenido o la lógica de los PDF. Al ejecutar los Bloques 4 y 5, las demos se reutilizarán como fixtures de validación visual y no requerirán una segunda carga de datos.

## Riesgos y mitigaciones

| Riesgo | Mitigación prevista |
| --- | --- |
| Diferencias visuales entre PDF durante la migración | Migración gradual y comparación por documento. |
| Ruptura de cálculos al refactorizar | Separar datos y presentación; conservar fixtures de entrada. |
| Logo o tipografía inválidos | Normalización central y valores de respaldo. |
| Tablas largas o contenido variable | Casos de prueba multipágina antes de activar cada documento. |
| Acoplar las demos al motor futuro | Mantener el Bloque 6 sobre contratos de herramienta existentes. |
