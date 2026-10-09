export type ReadmeStep = { n: number; t: string; d: string };
export type ReadmeEntry = { title: string; steps: ReadmeStep[]; nota?: string };
export type ReadmeMap = Record<string, ReadmeEntry>;

export type TourStep = {
  id: string;
  title: string;
  desc: string;
  target: string;
};
// ── INFO BUBBLE ───────────────────────────────────────────────────────
export const README: ReadmeMap = {
  calc:{title:"Calculadora de Honorarios",steps:[{n:1,t:"Datos del proyecto",d:"Ingresa cliente, proyecto, área, tipo, etapa y modelo de contratación."},{n:2,t:"Factores y extras",d:"Ajusta complejidad, urgencia y tipo de cliente. Agrega margen, descuento y adicionales."},{n:3,t:"Resultado",d:"Revisa el desglose, el rango ±8% y los hitos de cobro. Usa 🖨 para exportar."}],nota:"Los honorarios son referenciales. Valida siempre con alcance, exclusiones y entregables."},
  matrix:{title:"Matriz de Entregables",steps:[{n:1,t:"Selecciona el paquete",d:"Elige el tipo de servicio. Los ítems se filtran automáticamente."},{n:2,t:"Activa o desactiva ítems",d:"Clic en ✓/○ para incluir o excluir cada entregable."},{n:3,t:"Agrega ítems",d:"Usa '+ Agregar ítem' para sumar entregables de otros paquetes."},{n:4,t:"Exporta",d:"Usa 🖨 para imprimir o guarda como PDF desde el panel de vista."}],nota:"Los entregables específicos deben confirmarse en el contrato de servicios."},
  excl:{title:"Exclusiones y Supuestos",steps:[{n:1,t:"Datos del encargo",d:"Ingresa cliente, proyecto, código y responsable."},{n:2,t:"Activa 'Mostrar'",d:"Solo los ítems con ✓ en Mostrar aparecen en la presentación al cliente."},{n:3,t:"Edita el texto",d:"Clic en cualquier texto de 'Texto para cliente' para editarlo."},{n:4,t:"Cambia el estado",d:"Cada ítem puede ser Excluido, Supuesto o Revisión."},{n:5,t:"Agrega ítems",d:"Usa '+ Agregar ítem' para agregar de la biblioteca o crear uno personalizado."}],nota:"Este documento no reemplaza el contrato. Sirve para delimitar el alcance."},
  cron:{title:"Cronograma por Etapas",steps:[{n:1,t:"Fecha de inicio",d:"Define la fecha de inicio estimada. Las fechas se calculan automáticamente."},{n:2,t:"Activa las etapas",d:"Marca las etapas que aplican al encargo."},{n:3,t:"Ajusta las duraciones",d:"Cambia el número de semanas o arrastra los bloques del Gantt."},{n:4,t:"Honorario opcional",d:"Si ingresas el honorario total, se muestran los hitos de cobro con montos."}],nota:"Los plazos están condicionados a aprobaciones oportunas del cliente."},
  cronobra:{title:"Cronograma de Obra",steps:[{n:1,t:"Sincroniza partidas",d:"Usa 'Actualizar desde Cotización' para traer categorías y partidas vigentes."},{n:2,t:"Define dependencias",d:"Relaciona cada partida con Fin a Inicio, Inicio a Inicio o Fin a Fin y desfase en días."},{n:3,t:"Ajusta duración y avance",d:"Configura duración en días y % de avance por partida para control de obra."},{n:4,t:"Revisa Gantt y exporta",d:"Valida checklist de dependencias, cronograma detallado y exporta el documento final."}],nota:"Calendario laboral configurado en lunes a sábado. Ajusta desfases según frente de trabajo y secuencia real de campo."},
  oc:{title:"Orden de Cambio",steps:[{n:1,t:"Datos generales",d:"Asigna un código correlativo e indica quién solicita el cambio."},{n:2,t:"Resumen del cambio",d:"Describe qué cambia, el motivo y el tipo de impacto."},{n:3,t:"Detalle comparativo",d:"Completa la tabla Antes / Después para alcance, entregables y plazo."},{n:4,t:"Impacto económico",d:"Indica el honorario adicional, la extensión de plazo y el nuevo total."},{n:5,t:"Aprobación",d:"Completa los datos de firma de ambas partes."}],nota:"La ejecución del cambio queda sujeta a aprobación expresa del cliente."},
  cot:{title:"Cotización de Obra",steps:[{n:1,t:"Categorías y partidas",d:"Crea categorías y agrega partidas con costo de mano de obra y materiales."},{n:2,t:"Precio cliente",d:"Ajusta utilidad y riesgo por partida para obtener el precio unitario al cliente."},{n:3,t:"Datos finales",d:"Completa cuenta bancaria, GG, supervisión e IGV para cerrar la propuesta."},{n:4,t:"Documento",d:"Revisa la tabla final y exporta en PDF para enviar al cliente."}],nota:"Los precios son referenciales y deben validarse contra alcance final y condiciones de contrato."},
  val:{title:"Valorización de Avance",steps:[{n:1,t:"Datos generales",d:"Completa cliente, proyecto, código, período y estado de valorización."},{n:2,t:"Contrato y partidas",d:"Registra montos de contrato y avance acumulado por partida."},{n:3,t:"Resumen económico",d:"Verifica KPIs: valorizado período, acumulado, pagado y saldo por pagar."},{n:4,t:"Documento",d:"Genera la hoja de valorización para impresión o PDF."}],nota:"Montos y avances deben ser revisados y aprobados por las partes antes del pago."},
  brief:{
    title:"Programa Arquitectónico",
    steps:[
      {n:1,t:"Identidad del proyecto",d:"Completa los 12 campos de identificación: cliente, tipo, áreas, fechas y responsable."},
      {n:2,t:"Programa de espacios",d:"Agrega los espacios uno a uno. El área total se calcula sola. Activa la matriz de relaciones para los espacios de prioridad Alta."},
      {n:3,t:"Condicionantes y referencias",d:"Llena normativa, condicionantes técnicas y preferencias del cliente."},
      {n:4,t:"Documento",d:"Revisa la ficha completa y usa 🖨 para imprimir o guardar como PDF para adjuntar a la propuesta."},
    ],
    nota:"Este documento debe validarse con el cliente antes de iniciar el diseño. La firma en la ficha formaliza el brief.",
  },
};
export const APP_TOUR_STEPS: TourStep[] = [
  {id:"sidebar", title:"Navegación de herramientas", desc:"Aquí cambias de herramienta y eliges qué secciones incluir en propuesta.", target:"sidebar"},
  {id:"selector", title:"Selecciona tu punto de partida", desc:"Empieza en Calculadora y avanza por el flujo del proyecto.", target:"tool-calc"},
  {id:"workspace", title:"Área de trabajo", desc:"Completa primero campos mínimos para activar documento y métricas.", target:"workspace"},
  {id:"status", title:"Estado guardado", desc:"Este badge confirma si los cambios se están guardando automáticamente.", target:"saved-state"},
  {id:"export", title:"Exporta propuesta", desc:"Cuando tengas avances, exporta todo el paquete en PDF desde aquí.", target:"export"},
];
