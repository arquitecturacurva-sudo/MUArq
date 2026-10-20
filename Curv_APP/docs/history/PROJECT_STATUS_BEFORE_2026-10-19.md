# Curv App — Project Status

**Actualizado:** 12 de octubre de 2026 (America/Lima).
**Master verificado en GitHub:** `94444a0398a51c1459f4fd79f83276533a42c77c`.
**Producto:** Curv App, workspace comercial y tecnico para estudios de arquitectura, interiorismo y construccion.
**Estado:** pre-Beta avanzada; Fase 4 pendiente de cierre de aceptacion y publicacion.
**Preparacion estimada vigente:** **7,2/10**. **Captacion:** **5/10 estudios fundadores (50%)**.

## 1. Resumen vigente

Curv dispone de nueve herramientas, ficha compartida, documentos con identidad del estudio, demos, autenticacion, sincronizacion de proyectos y un flujo de invitaciones con acceso Viewer. Las herramientas ya estan separadas del antiguo monolito. CI, pruebas unitarias, reglas y pruebas de invitaciones existen en master.

El product owner confirmo el 10 de octubre la validacion de los recorridos de las nueve herramientas y del aislamiento de permisos. La sincronizacion con dos sesiones sigue pendiente, con cierre previsto para esta semana, del 12 al 18 de octubre. Tambien quedan la preparacion comercial del cobro y los ajustes de marca/personalizacion antes de publicar la version validada.

Este documento sustituye las conclusiones antiguas que describian ausencia de pruebas, CI, invitaciones o separacion de herramientas. Fusionar codigo no acredita por si solo una version probada en produccion.

## 2. Master y procedencia

| Referencia | Estado comprobado |
|---|---|
| Master remoto | `94444a0398a51c1459f4fd79f83276533a42c77c`, consultado el 12 de octubre |
| Ultimo cambio | PR #32: actualizacion documental del estado de Fase 4 |
| Fecha de ese commit en Lima | 11 de octubre de 2026, 19:21 |
| Master anterior | `0b229ff0e769e0406aa6a611c0655defa9b88357` |
| Diferencia respecto al anterior | Un commit; solo cambia `Curv_APP/docs/PROJECT_STATUS.md` |
| Integracion funcional previa | PR #29: integracion Fase 4; PR #30: sistema visual; PR #31: dashboard centrado |
| Produccion | No se verifico en este pase que el despliegue live ejecute este SHA |
| Ejecucion de pruebas en este pase | Revision documental y lectura de fuentes de master; no nueva ejecucion de suites ni QA autenticada |

La copia local tiene codigo anterior a master y sus comandos Git no pueden resolver el directorio del repositorio en esta sesion. Por eso la fuente tecnica de esta revision es el SHA remoto fijo, no los archivos locales de aplicacion. Solo se actualiza documentacion; no se resetea ni reemplaza codigo local.

Fuentes: [master verificado](https://github.com/arquitecturacurva-sudo/MUArq/commit/94444a0398a51c1459f4fd79f83276533a42c77c), [comparacion con el master anterior](https://github.com/arquitecturacurva-sudo/MUArq/compare/0b229ff0e769e0406aa6a611c0655defa9b88357...94444a0398a51c1459f4fd79f83276533a42c77c).

## 3. Evaluacion de preparacion

Se mantiene la evaluacion solicitada para la primera semana de octubre, elaborada el 10 de octubre con avances documentados hasta el dia 9 y confirmaciones del product owner del dia 10. La revision del 12 confirma que el nuevo master solo incorpora documentacion: no justifica subir las notas.

Son estimaciones razonadas de preparacion, no porcentajes de funcionalidades completadas. Media simple de seis dimensiones: 43/6, redondeada a **7,2/10**. El indicador no sustituye las puertas criticas de salida. El 5,3/10 de agosto es historico y no documentaba una formula de agregacion comparable.

| Dimension | Agosto, historico | Octubre, vigente | Fundamento / limite |
|---|---:|---:|---|
| Cobertura funcional | 8/10 | **8/10** | Nueve herramientas y recorridos validados por el product owner. Tramitologia sigue siendo futura. |
| Coherencia de experiencia | 6/10 | **8/10** | Sistema visual alineado y dashboard centrado. Branding e Identidad pendientes. |
| Continuidad de datos | 5/10 | **6/10** | Snapshots, revisiones, conflictos, reintentos y listener de proyectos implementados. Matriz de dos sesiones pendiente. |
| Seguridad y permisos | 6/10 | **7/10** | Permisos validados por el product owner y cobertura de reglas/invitaciones. Asociacion del pago al estudio pendiente de confirmacion. |
| Publicacion y calidad | 3/10 | **6/10** | CI y suites documentadas; falta cierre del artefacto, tiempos de navegador y comprobacion final en produccion. |
| Capacidad de evolucion | 4/10 | **8/10** | Nueve herramientas separadas; runtime es una fachada. App sigue concentrando orquestacion y subsiste compatibilidad legacy. |
| **Preparacion global** | **5,3/10** | **7,2/10** | **Pre-Beta avanzada, condicionada al cierre de pendientes.** |

## 4. Puertas de salida a Beta cerrada

| Puerta | Estado al 12 de octubre | Trabajo restante |
|---|---|---|
| 1. Recorridos de nueve herramientas | **Validada por el product owner el 10 de octubre** | Adjuntar version y evidencia al registro de aceptacion. |
| 2. Sincronizacion, conflictos y recuperacion | **Pendiente; prevista del 12 al 18 de octubre** | Probar dos sesiones, recarga, cambios concurrentes, ambas resoluciones de conflicto, offline y eliminacion/recuperacion. |
| 3. Permisos y aislamiento | **Validada por el product owner el 10 de octubre** | Adjuntar version, perfiles y evidencia de backend al cierre. |
| 4. Oferta y cobro | **Precios mensuales definidos; recorrido comercial sin confirmacion de cierre** | Alinear oferta y planes del proveedor; verificar pago → estudio → acceso, webhook, cancelacion y reintentos. |
| 5. Preparacion y publicacion | **Pendiente** | Retirar branding de Curva Arquitectura del Dashboard, retocar Identidad, medir rendimiento, publicar el artefacto probado y comprobar produccion/recuperacion. |

Las matrices versionadas aun contienen casillas de aceptacion desplegada pendientes. Se conserva la distincion entre validacion comunicada por el product owner y evidencia incorporada al repositorio; no se atribuye una nueva ejecucion de QA a esta actualizacion. Cualquier fallo critico de perdida de datos, acceso indebido o cobro incorrecto impide el cierre.

Fuentes de aceptacion:
- [Curv_APP/docs/qa/2026-10-07-phase-4-integration-preview.md](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/docs/qa/2026-10-07-phase-4-integration-preview.md).
- [Curv_APP/docs/qa/2026-07-26-firestore-snapshot-sync.md](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/docs/qa/2026-07-26-firestore-snapshot-sync.md).
- [Curv_APP/docs/qa/2026-10-07-phase-4-access-evidence.md](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/docs/qa/2026-10-07-phase-4-access-evidence.md).

## 5. Producto disponible y limites

| Familia | Herramientas actuales |
|---|---|
| Diseño | Honorarios, matriz de entregables, exclusiones y supuestos, cronograma por etapas |
| Construccion | Cotizacion de obra, cronograma de obra, programa arquitectonico |
| Seguimiento | Valorizacion de avance, orden de cambio |
| PRO futuro | Tramitologia: notificaciones a partir de un calendario; no implementada ni exigida para la Beta BASE |

Capacidades transversales: proyectos con ficha compartida, monedas y documentos, importacion PDF/OCR con revision, demos, identidad del estudio y vistas de lectura para Viewer. El programa arquitectonico distingue resumen para cliente y detalle interno. La valorizacion muestra advertencias y distingue datos declarados de certificacion.

La ficha compartida no implica propagacion automatica de todos los calculos. Exportar una valorizacion no acredita cobro. Facturacion SUNAT, ERP, BIM, firma contractual y nuevos informes/actas no se presentan como capacidades probadas.

## 6. Arquitectura y deuda actual

| Capa | Responsabilidad vigente |
|---|---|
| `src/domain/` | Reglas, tipos y calculos puros de proyecto, herramientas y acceso |
| `src/application/` | Contratos y casos de uso; estado y operaciones de herramientas |
| `src/infrastructure/` | Adaptadores de persistencia y servicios externos |
| `src/composition/` | Conexion de vistas, contratos y adaptadores; registro de herramientas |
| `src/features/` | Experiencia, herramientas, UI compartida, documentos, branding y equipo |
| `src/features/runtime/runtime.tsx` | Fachada temporal de compatibilidad; **112 lineas fisicas** en el SHA revisado |
| `src/App.tsx` | Orquestacion de sesion, proyectos, sincronizacion, rutas y exportacion; **2.380 lineas fisicas** |
| `api/billing/` | Checkout y webhook con Firebase Admin y Mercado Pago |
| `functions/` | Aprovisionamiento canonico, invitaciones, sesion, plazas e identidad |
| `.github/workflows/` | Validacion de Team Access y publicacion desktop |

Las cifras de lineas se obtienen del texto del SHA verificado. Sustituyen el recuento anterior de 99 lineas para runtime; no indican por si solas un cambio funcional.

Se preservan claves legacy de localStorage y el contrato ProjectSnapshot. Persisten snapshots de documento completo y conflictos por revision, sin fusion de campos. El arranque hacia landing sigue presente en App. Mantener la fachada y reducir gradualmente la orquestacion de App son deuda posterior al cierre de Beta.

Stack revisado: React 19, TypeScript 5.9, Vite 8, Tailwind 4, Firebase Auth/Firestore/Storage/Functions, Mercado Pago, Electron 37, jsPDF/html2canvas y pdfjs/Tesseract. Functions declara Node 20, mientras CI usa Node 24: revisar la actualizacion y compatibilidad del runtime de Functions. No se ha revalidado en este pase la distribucion desktop ni standalone.

Fuentes: [Curv_APP/src/features/runtime/runtime.tsx](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/src/features/runtime/runtime.tsx), [Curv_APP/src/App.tsx](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/src/App.tsx), [Curv_APP/package.json](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/package.json), [Curv_APP/functions/package.json](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/functions/package.json).

## 7. Datos, proyectos y equipos

La sincronizacion incluye contenido de herramientas, revisiones, tombstones, reintentos y exclusion de escritores. La correccion de consistencia Live/Preview ya incorpora lectura confirmada por servidor y listener de cambios comprometidos; la afirmacion antigua de que no existe listener queda retirada. Los proyectos limpios ausentes en nube no deben recrearse; las copias con trabajo pendiente deben conservarse como conflicto recuperable.

Equipo y acceso ya incluye invitacion por enlace, renovacion/cancelacion, aceptacion con correo verificado, comprobacion de plazas y Viewer limitado a proyectos asignados. Los enlaces vencen en siete dias y se almacenan como hash. No hay envio automatico de correo. Cambio de rol, revocacion de membresias y transferencia de propietario siguen fuera del flujo operativo documentado; no confundirlos con cancelar una invitacion.

Hay evidencia historica del 23 de septiembre de Functions presentes, rechazo anonimo y reglas/indices comprobados. No se convierte esa comprobacion historica en una nueva verificacion del 12 de octubre.

Fuentes: [Curv_APP/docs/qa/2026-10-05-project-sync-consistency.md](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/docs/qa/2026-10-05-project-sync-consistency.md), [Curv_APP/docs/architecture/team-invitations-release.md](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/docs/architecture/team-invitations-release.md).

## 8. Branding e Identidad

El encabezado compartido aun renderiza `Brand` en master. La retirada del branding de Curva Arquitectura del Dashboard solicitada por el product owner permanece pendiente.

Identidad ya dispone de nombre/datos de contacto, logo, colores, presets de tipografia, vista previa, guardado y controles de contraste. Los retoques concretos de personalizacion aun deben definirse. Validar que su aplicacion a documentos conserva legibilidad y no altera calculos ni contenido.

Fuentes: [Curv_APP/src/features/layout/AppHeader.tsx](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/src/features/layout/AppHeader.tsx), [Curv_APP/src/features/branding/BrandSettingsView.tsx](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/src/features/branding/BrandSettingsView.tsx).

## 9. Oferta, estudios fundadores y validacion comercial

| Oferta aprobada por el product owner | Precio mensual |
|---|---:|
| Primeros diez estudios fundadores | **S/ 29,00** |
| BASE regular posterior | **S/ 59,90** |
| PRO | **S/ 89,90** |

**Captacion vigente:** cinco estudios de diez; faltan cinco. No se comunicaron nuevas altas desde el reporte del 10 de octubre. Duracion del beneficio fundador, plan incluido, impuestos y limites comerciales definitivos no estan especificados.

Estos precios sustituyen las alternativas anuales antiguas. El LandingView actual se divide en Hero, Problems, Solution y About; ya no corresponde atribuirle la antigua tabla de precios en ese mismo archivo. Falta cotejar el importe y frecuencia realmente configurados en Mercado Pago y alinear toda la oferta.

Posicionamiento vigente: ayudar al estudio a preparar propuestas, ordenar alcances y documentar valorizaciones y cambios desde una ficha de proyecto. Prioridad comercial: estudios pequenos de arquitectura/interiorismo con propuestas u obra activas. Lima sigue siendo el foco operativo propuesto del piloto.

No hay resultados nuevos documentados de pagos, retencion o rentabilidad. Medir por estudio primer documento real, segundo uso, ahorro de tiempo comparable, incidencias, minutos de soporte y pago confirmado. El analisis de mercado del 1 de octubre se conserva en el archivo historico local; sus fuentes externas y periodos no se actualizaron en este pase.

## 10. Cobro y escenarios economicos

El checkout exige token y membresia. El proveedor tiene firmas de webhook y controles de eventos duplicados, tardios y de suscripcion incorrecta. En el codigo revisado, la rama sin `cardTokenId` retorna un enlace al plan; la rama con token escribe `external_reference = clientId`. El input frontend no declara ese token. Por tanto sigue pendiente demostrar la asociacion efectiva del recorrido normal pago → estudio, sin afirmar que ya este resuelta.

Escenarios aritmeticos de ingreso mensual, suponiendo cuentas activas que pagan el precio indicado; no son ventas observadas ni beneficio:

| Escenario | Ingreso mensual bruto |
|---|---:|
| Cinco fundadores pagados | S/ 145 |
| Diez fundadores pagados | S/ 290 |
| Diez cuentas BASE regulares | S/ 599 |
| Diez cuentas PRO | S/ 899 |

No extrapolar los antiguos TAM/SAM/SOM, punto de equilibrio o ingresos anuales calculados a otros precios. Recalcularlos con mezcla de planes, impuestos, comisiones, soporte y costos reales antes de usarlos para una decision financiera. No hay datos suficientes para estimar CAC, LTV o renovacion.

Fuentes: [Curv_APP/api/_lib/billing/mercado-pago-provider.js](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/api/_lib/billing/mercado-pago-provider.js), [Curv_APP/src/lib/billing/billingService.ts](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/src/lib/billing/billingService.ts).

## 11. Calidad, rendimiento y release

Ultima evidencia combinada registrada en la integracion del 7 de octubre:

| Comprobacion | Resultado documentado |
|---|---:|
| Frontend unitario/integracion | 433 pruebas en 65 archivos |
| Functions | 14 pruebas |
| Reglas Firestore/Storage en emulador | 20 pruebas |
| Invitaciones en emuladores | 12 pruebas |
| Lint, TypeScript y build | Correctos |
| Navegador local | Landing renderiza; CTA de demo llega a login |

Estos resultados pertenecen a su ejecucion documentada, no a una suite ejecutada hoy. El workflow Team Access ejecuta frontend, Functions y ambas suites de emulador en PR hacia master. El workflow desktop existe; queda por comprobar un release desktop actual. La consulta de Actions por el SHA de master no devolvio ejecuciones asociadas; no se declara CI verde de ese SHA a partir de ello. La evidencia previa de PR #32 es de su revision, no automaticamente de master.

La medicion limpia de la integracion registra **1.782.465 bytes brutos / 518.316 gzip** de JS/CSS inicial enlazado desde HTML. El script de entrada sigue siendo grande. El baseline anterior era 518.618 gzip: no se atribuye una mejora perceptible a 302 bytes. Los tiempos de arranque, apertura e impresion/exportacion siguen pendientes de medicion con navegador y condiciones fijas.

No hay evidencia de una suite E2E completa de navegador ejecutada en CI para autenticacion, proyecto, recuperacion y retorno de checkout. Las pruebas de servicios/emulador no la sustituyen.

Orden de cierre: identificar Preview/SHA/Firebase/reglas, adjuntar aceptacion, completar sync y tiempos, revisar cobro, promover el mismo artefacto, comprobar produccion con proyecto QA desechable y dejar referencia de rollback. No usar proyectos de clientes para pruebas destructivas.

Fuentes: [Curv_APP/docs/qa/2026-10-07-phase-4-integration-preview.md](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/docs/qa/2026-10-07-phase-4-integration-preview.md), [Curv_APP/docs/qa/2026-10-07-phase-4-performance-baseline.md](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/docs/qa/2026-10-07-phase-4-performance-baseline.md), [.github/workflows/team-access.yml](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/.github/workflows/team-access.yml), [.github/workflows/release-desktop.yml](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/.github/workflows/release-desktop.yml).

## 12. Prioridades y responsables funcionales

| Prioridad | Responsable funcional | Resultado de cierre |
|---|---|---|
| Sincronizacion esta semana | Ingenieria + QA | Matriz de dos sesiones sin perdida de datos y con recuperacion comprobada |
| Marca e Identidad | Producto + frontend | Dashboard con marca acordada y personalizacion definida/probada |
| Oferta y cobro | Producto + comercial + backend | Precios coherentes y pago asociado al estudio correcto |
| Evidencia de release | Lider tecnico + QA | Version identificada, aceptacion adjunta, rendimiento, promocion y rollback |
| Piloto fundador | Comercial + soporte | Seguimiento de los cinco estudios actuales y captacion de cinco adicionales |

Tras estos cierres: decidir Beta cerrada, actualizar la nota con evidencia, medir uso recurrente y construir Tramitologia PRO con alcance definido (calendario, eventos, canales y preferencias de notificacion). No se fija una fecha de lanzamiento solo por la prevision de cierre de sync.

## 13. Variables y operacion

Cliente: configuracion Firebase `VITE_FIREBASE_*` y portal de billing `VITE_BILLING_PORTAL_URL`. Servidor: proveedor, token/secreto de Mercado Pago, IDs de planes BASE/PRO, credencial Firebase Admin y `APP_BASE_URL`. No copiar valores de secretos a documentacion ni asumir que Preview/produccion usan identica configuracion.

Web y API: Vercel. Identidad/datos/acceso: Firebase. Desktop: Electron/NSIS/portable. Standalone: artefacto HTML. Verificar cada superficie antes de declararla lista para Beta; esta revision no prueba todas las distribuciones.

## 14. Historial conservado

- [Copia local anterior a esta revision](history/PROJECT_STATUS_LOCAL_BEFORE_2026-10-12.md): conserva el analisis peruano, decisiones y evaluaciones anteriores de esta conversacion.
- [Project Status de master al SHA revisado](history/PROJECT_STATUS_MASTER_94444a0.md): conserva la secuencia de extracciones y notas de julio a octubre.
- Los archivos historicos conservan su contenido original; sus rutas relativas se interpretaban desde docs/ antes de archivarlos. Para navegar el master historico usar [la version inmutable original](https://github.com/arquitecturacurva-sudo/MUArq/blob/94444a0398a51c1459f4fd79f83276533a42c77c/Curv_APP/docs/PROJECT_STATUS.md).

Las conclusiones vigentes son las de este documento. Las cifras de mercado, fechas, resultados de pruebas y pendientes antiguos en los archivos historicos no se consideran revalidados ni automaticamente activos.
