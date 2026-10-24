# CURV APP — Project Status

**Actualizado:** 19 de octubre de 2026 (America/Lima).

**Base técnica verificada:** `master` en `c1596135a0dbe92a375e72e3235c4e3ae622a570` (PR #37, integrado a las 19:15 de Lima).

**Producto:** workspace comercial y técnico para estudios de arquitectura, interiorismo y construcción.

**Estado:** pre-Beta avanzada; sincronización aceptada e identidad integrada. Beta cerrada pendiente de cobro y aceptación final del release.

**Preparación estimada:** **7,8/10** (antes: 7,2/10). **Captación:** **5/10 estudios fundadores, 50%; faltan 5**.

## 1. Resumen ejecutivo

CURV APP dispone de nueve herramientas, ficha compartida, documentos con identidad del estudio, demos, autenticación, sincronización de datos y equipo con invitaciones y acceso Viewer. Las herramientas están separadas del antiguo monolito y existe validación automatizada de frontend, Functions, reglas e invitaciones.

Desde el corte del 12 de octubre se integraron el centrado de las herramientas, la resolución de conflictos con la versión local, la recuperación del guardado después de Usar nube y la identidad CURV APP en interfaz y homepage. La pantalla Identidad del estudio ya permite configurar logo, nombre comercial, datos, colores y tipografías con vista previa. Logo y nombre se muestran juntos en las cabeceras.

El product owner aceptó los recorridos de herramientas y los permisos el 10 de octubre; confirmó el funcionamiento normal de la checklist HTML de sincronización el 19 de octubre y aprobó la pantalla Identidad y la corrección de logo/nombre antes de integrar el PR #37.

**Cierre de las cinco puertas:** tres validadas por el product owner, una parcial (preparación/publicación; marca e identidad terminadas) y una pendiente (cobro). La cuenta de puertas no equivale a un porcentaje de producto completado. La captación de cinco estudios adicionales es una meta comercial, no un requisito técnico para comenzar el piloto con los cinco actuales.

**Siguiente trabajo:** documento real hasta PDF, recorrido pago → estudio → acceso, comprobación de producción y seguimiento del piloto. No queda pendiente diseñar otra vez la marca ni repetir toda la aceptación de sincronización sin una incidencia nueva.

## 2. Fuente técnica e integraciones

| Referencia | Estado verificado |
|---|---|
| Master revisado | `c1596135a0dbe92a375e72e3235c4e3ae622a570` |
| PR #34 | Centrado de herramientas dentro del espacio disponible; sidebar conserva su funcionamiento |
| PR #35 · `82ccf8b` | Usar mi versión, carga completa de herramientas al resolver conflictos y continuidad de guardado tras Usar nube |
| PR #36 · `234bc4e` | Marca CURV APP, paleta, componentes, homepage e iconos; retirada de placeholders de Curva Arquitectura |
| PR #37 · `c159613` | Pantalla Identidad del estudio y logo junto al nombre comercial |
| CI del último PR | `validate` aprobado en la revisión `c27cb57eeda9236feb0f29ef737d270e06a95c54`; run `39344290499` |
| Preview del último PR | Despliegue Vercel aprobado; no equivale a comprobación funcional de producción |
| Producción | Falta documentar que el live ejecuta la revisión integrada y supera la comprobación final |

Esta revisión parte de un checkout limpio del master remoto en el clon de trabajo existente. Se actualiza documentación; no se altera código de aplicación ni datos de usuarios. La copia principal local se mantiene como espejo documental, sin sustituir su código antiguo.

Fuentes: [master revisado](https://github.com/arquitecturacurva-sudo/MUArq/commit/c1596135a0dbe92a375e72e3235c4e3ae622a570), [PR #35](https://github.com/arquitecturacurva-sudo/MUArq/pull/35), [PR #36](https://github.com/arquitecturacurva-sudo/MUArq/pull/36), [PR #37](https://github.com/arquitecturacurva-sudo/MUArq/pull/37), [CI aprobado](https://github.com/arquitecturacurva-sudo/MUArq/actions/runs/39344290499).

## 3. Evaluación de preparación

Las notas son estimaciones de preparación apoyadas en código, pruebas y aceptación comunicada; no porcentajes de funcionalidades terminadas. Se conserva la media simple de seis dimensiones: **(8 + 9 + 8 + 7 + 7 + 8) / 6 = 7,83**, redondeada a **7,8/10**. No representa el cierre automático de Beta.

| Dimensión | Corte del 10 de octubre | Vigente al 19 de octubre | Fundamento y límite |
|---|---:|---:|---|
| Cobertura funcional | 8/10 | **8/10** | Nueve herramientas y recorridos aceptados. Falta comprobar el documento real con la identidad final; Tramitología es futura. |
| Coherencia de experiencia | 8/10 | **9/10** | Marca propia, homepage, iconos, controles, herramientas centradas e Identidad integradas y aprobadas. Validación final del PDF pendiente. |
| Continuidad de datos | 6/10 | **8/10** | Checklist aceptada por el product owner; tres opciones de conflicto y reanudación del guardado implementadas. Falta adjuntar el detalle del entorno probado; no se afirma reparación individual de todos los proyectos antiguos. |
| Seguridad y permisos | 7/10 | **7/10** | Aceptación de permisos y suites de reglas/invitaciones aprobadas. La asociación efectiva del cobro al estudio sigue pendiente de evidencia. |
| Publicación y calidad | 6/10 | **7/10** | CI del último PR aprobado, 482 pruebas frontend y suites backend/emulador; preview disponible. Producción, PDF final, tiempos y rollback aún por registrar. |
| Capacidad de evolución | 8/10 | **8/10** | Herramientas separadas y componentes compartidos; App conserva mucha orquestación y compatibilidad legacy. |
| **Preparación global** | **7,2/10** | **7,8/10** | **Mejora sustentada en sincronización, identidad y evidencia de calidad.** |

La evaluación de agosto (5,3/10) y el corte de la primera semana de octubre se conservan como históricos. Se sustituye la nota vigente porque hay avances funcionales y aceptación posteriores, no por el mero paso del tiempo.

## 4. Puertas de salida a Beta cerrada

| Puerta | Estado vigente | Qué falta para cerrar o conservar evidencia |
|---|---|---|
| 1. Recorridos de nueve herramientas | **Validada por el product owner · 10/10** | Asociar la aceptación a versión/entorno y conservar evidencia. No reabrir sin una regresión. |
| 2. Sincronización, conflictos y recuperación | **Validada por el product owner · 19/10** | Adjuntar URL/ID del despliegue y resultados exportados de la checklist. La aceptación comunicada ya está registrada. |
| 3. Permisos y aislamiento | **Validada por el product owner · 10/10** | Completar trazabilidad de perfiles/versión. CI de reglas e invitaciones aprobado el 19/10. |
| 4. Oferta y cobro | **Pendiente de validación integral** | Precios mensuales aprobados. Cotejar planes del proveedor y probar pago → estudio correcto → acceso, webhook, cancelación y reintentos. |
| 5. Preparación y publicación | **Parcial; marca e Identidad completadas e integradas** | Verificar identidad guardada tras recarga, propuesta real/PDF, revisión final en producción, tiempos, versión de release y referencia de rollback. |

Un fallo crítico de pérdida de datos, acceso indebido o cobro incorrecto impide declarar Beta. Las casillas antiguas de las matrices son registros históricos; la aceptación más reciente del product owner prevalece como declaración funcional, sin inventar resultados individuales ni nueva ejecución independiente.

Referencias: [aceptación de sincronización](qa/2026-10-19-sync-acceptance.md), [checklist original de sincronización](qa/sincronizacion-beta-checklist.html), [aceptación de integración y herramientas](qa/2026-10-07-phase-4-integration-preview.md), [evidencia de acceso](qa/2026-10-07-phase-4-access-evidence.md).

## 5. Producto disponible y alcance de Beta

| Familia | Herramientas actuales |
|---|---|
| Diseño | Calculadora de honorarios, matriz de entregables, exclusiones y supuestos, cronograma por etapas |
| Construcción | Cotización de obra, cronograma de obra, programa arquitectónico |
| Seguimiento | Valorización de avance, orden de cambio |
| PRO futuro | Tramitología: notificaciones a partir de un calendario; no implementada ni necesaria para la Beta BASE |

Capacidades transversales: ficha de proyecto compartida, monedas, documentos, importación PDF/OCR con revisión, demos, identidad del estudio y vistas de lectura para Viewer. El programa arquitectónico distingue resumen para cliente y detalle interno. La valorización distingue datos declarados de certificación.

Límites: la ficha compartida no propaga automáticamente todos los cálculos; exportar una valorización no acredita cobro. No se presentan SUNAT, ERP, BIM, firma contractual, nuevos informes o actas como capacidades probadas. No ampliar estas familias antes de cerrar las puertas actuales.

## 6. Arquitectura y deuda técnica

| Capa | Responsabilidad vigente |
|---|---|
| `src/domain/` | Reglas, tipos y cálculos puros de proyecto, herramientas y acceso |
| `src/application/` | Contratos, casos de uso y operaciones de herramientas |
| `src/infrastructure/` | Adaptadores de persistencia y servicios externos |
| `src/composition/` | Conexión de vistas, contratos y adaptadores; registro de herramientas |
| `src/features/` | Herramientas, UI, documentos, branding y equipo |
| `src/features/runtime/runtime.tsx` | Fachada temporal de compatibilidad: **112 líneas físicas** |
| `src/App.tsx` | Sesión, proyectos, sincronización, rutas y exportación: **2.487 líneas físicas** |
| `api/billing/` | Checkout y webhook con Firebase Admin y Mercado Pago |
| `functions/` | Aprovisionamiento, invitaciones, sesión, plazas e identidad |
| `.github/workflows/` | Validación de PR y distribución desktop |

Recuentos del SHA de master indicado arriba. App sigue siendo el principal foco de orquestación; no se atribuye a la reducción de líneas una mejora funcional por sí sola. Se preservan claves legacy y ProjectSnapshot, con conflictos por revisión y snapshots completos, sin fusión automática de campos.

Stack de las dependencias revisadas: React 19, TypeScript 5.9, Vite 8, Tailwind 4, Firebase Auth/Firestore/Storage/Functions, Mercado Pago, Electron 37, jsPDF/html2canvas y pdfjs/Tesseract. Functions declara Node 20 y CI Node 24: queda revisar compatibilidad y actualización del runtime antes del cierre operativo correspondiente. No se revalidó desktop ni standalone en esta revisión.

Fuentes del código: rutas anteriores dentro del [master fijado](https://github.com/arquitecturacurva-sudo/MUArq/tree/c1596135a0dbe92a375e72e3235c4e3ae622a570/Curv_APP).

## 7. Datos, proyectos y equipos

La sincronización incluye contenido de herramientas, revisiones, listener de cambios confirmados, reintentos y tombstones. Los proyectos limpios ausentes en nube no deben recrearse; las copias con trabajo pendiente deben conservarse como conflictos recuperables.

Opciones vigentes:

- **Usar nube:** carga el contenido completo, actualiza revisión y estado de guardado y permite continuar editando el mismo proyecto.
- **Usar mi versión:** sustituye la versión remota en el ID original previa confirmación y comprobación transaccional de la revisión. Una nueva revisión remota requiere revisar el conflicto otra vez.
- **Conservar ambas:** preserva el trabajo local como copia recuperada. Sigue siendo la vía para recuperar contenido cuando el proyecto remoto está eliminado.

La carga reconstruye datos migrados a `toolData`; si falla, conserva el trabajo local y aborta la resolución. La confirmación del product owner cierra el punto 2 como aceptación funcional. No demuestra que todos los proyectos antiguos del video hayan sido recuperados individualmente.

Equipo incluye invitación por enlace, renovación/cancelación, correo verificado, control de plazas y Viewer limitado a proyectos asignados. Los enlaces vencen en siete días y se almacenan como hash. No hay envío automático de correo. Cambio de rol, revocación de membresías y transferencia de propietario siguen fuera del flujo operativo documentado; cancelar una invitación no sustituye esas acciones.

Fuentes: [consistencia de proyectos](qa/2026-10-05-project-sync-consistency.md), [resolución de conflictos](qa/2026-10-15-conflict-local-wins.md), [aceptación posterior del punto 2](qa/2026-10-19-sync-acceptance.md), [release de invitaciones](architecture/team-invitations-release.md).

## 8. Marca, interfaz e Identidad del estudio

**Completado e integrado:** sistema CURV APP aprobado en Figma; símbolo y wordmark propios, paleta tinta/marfil/oro, controles, tarjetas y estados compartidos; homepage e iconos de herramientas actualizados, incluida la interfaz simulada del portátil. Retirados placeholders de Curva Arquitectura en marca y documentos afectados.

La pantalla Identidad organiza datos del estudio, logo y datos fiscales opcionales; permite colores, presets tipográficos, posición del logo, firma Curv y vista previa. El documento muestra **logo y nombre comercial juntos**. Los perfiles guardados se conservan. Se respetan acceso de solo lectura y bloqueo durante operaciones pendientes; la interfaz mantiene la marca de producto independientemente del estudio.

El product owner aprobó la pantalla y la corrección final de la cabecera. La captura compartida muestra el estado Guardado; no constituye por sí sola una prueba de persistencia tras recarga ni de exportación final. **Pendiente acotado:** recargar una sesión real y exportar una propuesta para revisar logo, nombre, colores, contactos y pie de página en el PDF.

El desfase de centrado observado en Edge se resolvió con recarga forzada según el product owner; no se registra como defecto activo de layout. La QA local de identidad usa datos en memoria, no acredita guardado en Firebase.

Fuentes: [Figma aprobado](https://www.figma.com/design/ENuEPed1EBUqR2RclnQoab), [QA de identidad visual](qa/2026-10-19-curv-ui-identity.md), [QA de Identidad del estudio](qa/2026-10-19-studio-identity.md).

## 9. Oferta y estudios fundadores

| Oferta aprobada | Precio mensual |
|---|---:|
| Primeros diez estudios fundadores | **S/ 29,00** |
| BASE regular posterior | **S/ 59,90** |
| PRO | **S/ 89,90** |

**Cinco estudios fundadores conseguidos de diez; faltan cinco.** Se mantiene el último total comunicado, sin asumir nuevas altas, cuentas activas ni pagos confirmados. Duración del beneficio fundador, plan incluido, impuestos y límites comerciales definitivos no están especificados.

PRO incorporará Tramitología, una familia de herramientas de notificaciones a partir de calendario. No se promete como disponible. Confirmar alcance, canal y preferencias antes de construirla. No se cambia la oferta mensual aprobada ni se recuperan los antiguos precios anuales.

El piloto puede comenzar con los cinco estudios actuales: acompañar un proyecto y documento reales por estudio, registrar segundo uso, incidencias, tiempo de soporte y pago cuando se confirme. El objetivo 10/10 mide captación; la recurrencia y conversión requieren datos distintos.

Posicionamiento: preparar propuestas, ordenar alcances y documentar valorizaciones y cambios desde una ficha de proyecto. Foco inicial: estudios pequeños de arquitectura/interiorismo con propuestas u obra activas; Lima es el foco operativo propuesto. No se reevalúan mercado ni fuentes externas en esta actualización.

## 10. Cobro y escenarios económicos

**Pendiente principal para la Beta comercial.** El checkout exige token y membresía y el webhook dispone de firma y controles de duplicados, eventos tardíos y suscripción incorrecta. Eso no cierra el recorrido de pago real.

En el código revisado, sin `cardTokenId` se devuelve un enlace al plan; con token se escribe `external_reference = clientId`. El input frontend no declara ese token. Sigue pendiente demostrar que el recorrido normal asocia el pago con el estudio correcto y habilita su acceso. No se afirma que exista un fallo reproducido de cobro ni que la asociación esté validada.

Cierre requerido: cotejar frecuencia/precios de planes del proveedor; pagar con la modalidad QA apropiada; confirmar estudio, estado y acceso; comprobar webhook duplicado/tardío, cancelación, reintento y ausencia de habilitación para otro estudio. Registrar entorno y evidencias sin secretos.

| Escenario hipotético | Ingreso mensual bruto |
|---|---:|
| Cinco fundadores pagados | S/ 145 |
| Diez fundadores pagados | S/ 290 |
| Diez cuentas BASE regulares | S/ 599 |
| Diez cuentas PRO | S/ 899 |

Son cálculos de precio por cuentas activas supuestas, no ventas observadas, beneficio ni pronóstico. No hay datos suficientes de CAC, LTV, retención, renovación o costes reales para afirmar rentabilidad. No reutilizar estimaciones antiguas basadas en otros precios.

Fuente técnica: `api/_lib/billing/mercado-pago-provider.js` y `src/lib/billing/billingService.ts` del master revisado.

## 11. Calidad, rendimiento y release

Última evidencia automatizada completa: **CI aprobado del PR #37**, revisión `c27cb57`, 19 de octubre, antes de la integración en `c159613`. No se presenta como una ejecución independiente sobre el SHA del merge.

| Comprobación | Resultado del CI consultado |
|---|---:|
| Frontend unitario/integración | **482 pruebas en 72 archivos** |
| Functions | **14 pruebas** |
| Reglas Firestore/Storage en emulador | **20 pruebas** |
| Invitaciones en emuladores | **12 pruebas** |
| Lint, TypeScript y build | **Correctos** |
| Vercel preview del PR | **Despliegue completado** |

Las 479 pruebas de la primera revisión de Identidad preceden a las tres pruebas añadidas de logo/nombre; la cifra final completa es 482. La corrección final también pasó 30 pruebas focalizadas y revisión visual local. No se ejecutan suites nuevas solo para modificar este documento.

Persiste la advertencia de paquete grande. El baseline limpio de rendimiento del 7 de octubre sigue siendo histórico; no se reutiliza como tamaño actual tras cambios de marca/fuentes. Su tabla registra **1.782.465 bytes brutos / 518.618 gzip** de JS/CSS inicial. Se corrige el resumen anterior que citaba 518.316 gzip para ese baseline. Los tiempos de arranque, apertura de proyecto e impresión/exportación siguen sin medirse con condiciones fijas.

No hay evidencia de una suite E2E completa de navegador en CI para autenticación, proyecto, recuperación y retorno del checkout. Servicios y emuladores no la sustituyen. Desktop y standalone requieren aceptación propia si van a incluirse en el lanzamiento; no bloquean una decisión limitada explícitamente a Beta web.

Registro de release pendiente: SHA/URL de producción, Firebase/reglas correspondientes, comprobación con proyecto QA, documento/PDF real, medidas de tiempos, incidencias y referencia de rollback. Una integración o un despliegue verde no acredita ese recorrido.

Fuentes: [run aprobado](https://github.com/arquitecturacurva-sudo/MUArq/actions/runs/39344290499), [baseline y protocolo de tiempos](qa/2026-10-07-phase-4-performance-baseline.md), [integración anterior](qa/2026-10-07-phase-4-integration-preview.md), workflows de Team Access y desktop en la raíz del repositorio.

## 12. Prioridades, responsables y criterios de cierre

| Orden | Trabajo | Responsable funcional | Evidencia de cierre |
|---|---|---|---|
| 1 | Identidad guardada y documento real hasta PDF | Producto + QA | Cambios persisten al recargar; PDF legible con logo, nombre, contactos y pie correctos |
| 2 | Oferta y cobro de extremo a extremo | Producto + backend + comercial | Plan/precio/frecuencia coherentes, pago asociado al estudio correcto y acceso actualizado; cancelación/reintentos comprobados |
| 3 | Aceptación de producción y release web | Ingeniería + QA | SHA y entorno registrados, comprobación final sin incidencias críticas, tiempos y rollback documentados |
| 4 | Piloto con cinco estudios actuales | Producto + soporte | Un proyecto/documento real por estudio; incidencias, segundo uso y soporte registrados |
| 5 | Completar la captación 10/10 | Comercial | Cinco nuevos estudios confirmados; separar alta, activación y pago en el seguimiento |

Continuidad de datos y marca pasan a seguimiento de regresiones. Adjuntar el registro de aceptación de sync y las referencias de versiones es trabajo de trazabilidad; no invalida la aceptación ya comunicada. Los pasos comerciales y técnicos pueden avanzar en paralelo, sin ampliar el alcance a nuevas herramientas.

Cuando cierren cobro y release, decidir explícitamente la Beta cerrada web y su alcance. No se fija fecha de lanzamiento ni se declara Beta por la puntuación 7,8. Después: recurrencia, soporte, reducción gradual de App y alcance de Tramitología PRO.

## 13. Variables y operación

Cliente: configuración Firebase `VITE_FIREBASE_*` y portal `VITE_BILLING_PORTAL_URL`. Servidor: proveedor, token/secreto de Mercado Pago, IDs BASE/PRO, credenciales Firebase Admin y `APP_BASE_URL`. No copiar valores de secretos ni asumir configuración idéntica entre Preview y producción.

Web/API en Vercel; datos, acceso e identidad en Firebase; desktop en Electron/NSIS/portable; standalone como HTML. No se cambiaron variables, permisos ni servicios durante esta actualización documental.

## 14. Historial y lectura de evidencia

- [Estado remoto anterior al corte actual](history/PROJECT_STATUS_BEFORE_2026-10-19.md): fotografía del documento del 12 de octubre.
- [Aceptación local anterior de sincronización](history/PROJECT_STATUS_LOCAL_ACCEPTANCE_2026-10-19.md): conserva la actualización local del 19 de octubre que aún no figuraba en master.
- [Historia local previa al 12 de octubre](history/PROJECT_STATUS_LOCAL_BEFORE_2026-10-12.md): análisis, decisiones y evaluaciones anteriores.
- [Historia de master `94444a0`](history/PROJECT_STATUS_MASTER_94444a0.md): secuencia de extracciones y notas anteriores.

Las rutas de los archivos históricos se interpretaban desde su ubicación original; no convierten sus cifras o pendientes en vigentes. Los informes QA anteriores preservan lo comprobado en su fecha. Para el estado actual prevalece este documento y sus registros de aceptación posteriores. No se modifican matrices históricas para simular pruebas que no se ejecutaron.
