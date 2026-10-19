# Identidad CURV APP aplicada al UI

Fecha: 19 de octubre de 2026. Rama: `codex/curv-ui-identity`, basada en master `82ccf8b`.

Diseño aprobado: [Identidad y componentes en Figma](https://www.figma.com/design/ENuEPed1EBUqR2RclnQoab?node-id=8-265).

## Implementación

- Símbolo SVG original descargado desde Figma y servido localmente; wordmark en Montserrat Bold. Variante inversa mediante filtro de color, conservando el módulo dorado y el SVG original.
- Paleta tinta `#111C25`, marfil `#FAF9F6`, oro `#C7A565`; estados semánticos con fondos suaves y textos oscuros.
- Componentes existentes de botones, campos, selectores, tabs, tarjetas, estados de guardado y vacíos actualizados. Se conserva la fachada legacy.
- Cabecera con navegación activa; sidebar de 264/56 px con las mismas acciones; área de herramientas centrada hasta 1000 px.
- Matriz editable con controles del kit, cabeceras y textos legibles. Se conserva el documento y su selección de entregables.
- Pantalla Identidad alineada con el kit. Los perfiles guardados, colores y tipografías del estudio siguen controlando los documentos.
- Retiradas las referencias de placeholder a CURVA Arquitectos en marca compartida, firma de orden de cambio, programa y condiciones de matriz.
- Corregida la herencia global de `font` que anulaba las utilidades de tipografía. Las variantes dark del kit requieren un atributo explícito; el modo oscuro del sistema no altera la paleta light de la app.

## Validación

- `npm run build`: aprobado. Persiste el aviso de tamaño de bundles de Vite.
- `npm test`: 71 archivos, 476 pruebas aprobadas.
- `npm run lint` completo: aprobado, incluyendo la vista QA. Se separó su componente exportado del punto de arranque para cumplir la regla de Fast Refresh.
- Navegador: logo inverso sobre fondo oscuro; Dashboard; herramientas con sidebar expandido y colapsado; selección de matriz cambia inclusión y contador 9/9 → 8/9.
- Navegador: control de ejemplo medido a 14 px y fondo blanco, incluso con modo oscuro del sistema.
- Móvil de 390 px: sin desbordamiento horizontal de página; campos de herramientas a 16 px; sidebar completo y sin control de colapsado.
- Vista previa de documentos: cambiar nombre comercial actualiza el documento sin cambiar la marca de la cabecera.
- Se revisaron visualmente los tres controles de conflicto y el estado posterior a Usar nube en la simulación local. Esto no constituye una nueva prueba de sincronización con Firestore.

## Revisión local y límites

Con el servidor de desarrollo activo: `/qa/identity.html`. Solo se importa en modo DEV y no forma parte del build de producción. Usa un proyecto local exclusivo `qa-curv-ui-identity`, datos de la demo existente y estados simulados, sin sesión ni backend. No modifica `app.projects` ni proyectos del usuario.

La edición autenticada de Identidad y la sincronización de dos navegadores no se volvieron a ejecutar en este pase. Los servicios de persistencia, billing, permisos y sincronización no cambian. No se ha publicado ni promovido un despliegue de Vercel.
