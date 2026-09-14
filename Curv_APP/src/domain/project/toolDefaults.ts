// Phase 2 extraction. Legacy behavior retained; do not import the runtime facade.

export const ZONAS_B = ["Pública","Privada","Servicio","Exterior","Técnica","Comercial","Común"];

export const PRIORIDAD_B = ["Alta","Media","Baja"];

export const RELACION_B = ["Directa","Indirecta","Sin relación"];

export const TIPO_PROY = ["Arquitectura nueva","Remodelación","Interiorismo","Oficina","Comercial","Industrial pequeño","Consultoría"];

export const ESTADO_ACT = ["Idea","Brief confirmado","Diseño en curso","Expediente","Obra","Cerrado"];

export const TAR: Record<string, Record<string, number>> = {"Vivienda":{Levantamiento:8,Anteproyecto:35,"Proyecto arquitectónico":55,"Expediente técnico":78,Supervisión:12},"Comercial":{Levantamiento:10,Anteproyecto:38,"Proyecto arquitectónico":60,"Expediente técnico":85,Supervisión:14},"Oficina":{Levantamiento:9,Anteproyecto:36,"Proyecto arquitectónico":58,"Expediente técnico":82,Supervisión:13},"Remodelación":{Levantamiento:12,Anteproyecto:42,"Proyecto arquitectónico":68,"Expediente técnico":95,Supervisión:16},"Interiorismo":{Levantamiento:11,Anteproyecto:40,"Proyecto arquitectónico":65,"Expediente técnico":90,Supervisión:15},"Industrial pequeño":{Levantamiento:8,Anteproyecto:30,"Proyecto arquitectónico":48,"Expediente técnico":70,Supervisión:12}};

export const CF: Record<string, number> = {"Baja":0.9,"Media":1,"Alta":1.15,"Muy alta":1.3};

export const UF: Record<string, number> = {"Normal":1,"Rápido":1.1,"Urgente":1.2};

export const KF: Record<string, number> = {"Particular":1,"Empresa":1.08,"Institucional":1.15};

export const MF: Record<string, number> = {"Suma alzada":1,"Precios unitarios":1.05,"Cost + Fee":0.95,"Gestión de obra":0.9,"Diseño + Build":1.12};

export const PAQUETES=["Diagnóstico / consultoría","Anteproyecto","Proyecto arquitectónico","Expediente técnico","Supervisión de obra","Diseño + ejecución"];

export const ETAPAS_MX=["Levantamiento","Anteproyecto","Desarrollo","Expediente","Obra"];

export const ITEMS_BASE=[
  {id:"ITM-001",paquete:"Diagnóstico / consultoría",etapa:"Levantamiento",entregable:"Ficha de requerimientos + información base del encargo.",formato:"PDF",cantidad:"1",notas:"Documento de inicio que consolida el programa, el usuario y las condicionantes del proyecto."},
  {id:"ITM-002",paquete:"Proyecto arquitectónico",etapa:"Levantamiento",entregable:"Ficha de requerimientos + información base del encargo.",formato:"PDF",cantidad:"1",notas:"Documento de inicio que consolida el programa, el usuario y las condicionantes del proyecto."},
  {id:"ITM-003",paquete:"Anteproyecto",etapa:"Levantamiento",entregable:"Ficha de requerimientos + información base del encargo.",formato:"PDF",cantidad:"1",notas:"Documento de inicio que consolida el programa, el usuario y las condicionantes del proyecto."},
  {id:"ITM-004",paquete:"Expediente técnico",etapa:"Levantamiento",entregable:"Ficha de requerimientos + información base del encargo.",formato:"PDF",cantidad:"1",notas:"Documento de inicio que consolida el programa, el usuario y las condicionantes del proyecto."},
  {id:"ITM-005",paquete:"Anteproyecto",etapa:"Anteproyecto",entregable:"Diagnóstico + recomendaciones de intervención y próximos pasos.",formato:"PDF",cantidad:"1",notas:"Análisis del estado actual con conclusiones técnicas y recomendaciones de alcance."},
  {id:"ITM-006",paquete:"Anteproyecto",etapa:"Anteproyecto",entregable:"Propuesta de layout / distribución preliminar.",formato:"PDF",cantidad:"1",notas:"Planteamiento espacial inicial para validar el programa y la organización funcional."},
  {id:"ITM-007",paquete:"Anteproyecto",etapa:"Anteproyecto",entregable:"Moodboard + criterios de materialidad referencial.",formato:"PDF",cantidad:"1",notas:"Referencias visuales de estilo, atmósfera y materialidad para alinear la identidad del proyecto."},
  {id:"ITM-008",paquete:"Anteproyecto",etapa:"Anteproyecto",entregable:"Plantas preliminares + cortes/elevaciones base.",formato:"PDF",cantidad:"1 paquete",notas:"Juego de planos a nivel de anteproyecto para comunicar la propuesta arquitectónica al cliente."},
  {id:"ITM-009",paquete:"Anteproyecto",etapa:"Anteproyecto",entregable:"Vistas 3D / renders base (según alcance).",formato:"JPG/PDF",cantidad:"3–5",notas:"Imágenes de representación para apoyar la comunicación de la propuesta."},
  {id:"ITM-010",paquete:"Proyecto arquitectónico",etapa:"Desarrollo",entregable:"Plantas, cortes y elevaciones desarrolladas.",formato:"PDF",cantidad:"1 paquete",notas:"Documentación gráfica completa que define geometría, cotas y relaciones espaciales."},
  {id:"ITM-011",paquete:"Proyecto arquitectónico",etapa:"Desarrollo",entregable:"Detalles arquitectónicos críticos (según proyecto).",formato:"PDF",cantidad:"8–15",notas:"Soluciones constructivas en escala ampliada para los encuentros, carpinterías y elementos singulares."},
  {id:"ITM-012",paquete:"Anteproyecto",etapa:"Desarrollo",entregable:"Cuadro de acabados / criterios base (si aplica).",formato:"PDF",cantidad:"1",notas:"Especificación referencial de materiales y acabados por ambiente."},
  {id:"ITM-013",paquete:"Anteproyecto",etapa:"Desarrollo",entregable:"Acta de decisiones / acuerdos de revisión.",formato:"PDF",cantidad:"1",notas:"Registro formal de los acuerdos tomados en cada revisión."},
  {id:"ITM-014",paquete:"Expediente técnico",etapa:"Expediente",entregable:"Planos arquitectónicos para obra (set).",formato:"PDF",cantidad:"1 set",notas:"Set completo de planos constructivos para la ejecución de obra."},
  {id:"ITM-015",paquete:"Anteproyecto",etapa:"Expediente",entregable:"Memoria descriptiva arquitectónica.",formato:"PDF",cantidad:"1",notas:"Documento técnico que describe el partido, criterios de diseño y características generales."},
  {id:"ITM-016",paquete:"Expediente técnico",etapa:"Expediente",entregable:"Lista de pendientes y criterios para coordinación.",formato:"PDF",cantidad:"1",notas:"Documento de interfaz con especialidades. Instalaciones no incluidas salvo acuerdo expreso."},
  {id:"ITM-017",paquete:"Supervisión de obra",etapa:"Obra",entregable:"Visitas programadas + informe por visita.",formato:"PDF",cantidad:"4–8",notas:"Inspección periódica para verificar fidelidad al proyecto."},
  {id:"ITM-018",paquete:"Anteproyecto",etapa:"Obra",entregable:"Absolución de consultas y revisiones puntuales.",formato:"Email/PDF",cantidad:"Según obra",notas:"Respuesta a consultas del contratista sobre interpretación de planos."},
  {id:"ITM-019",paquete:"Anteproyecto",etapa:"Obra",entregable:"Registro de cambios y adicionales (si aplica).",formato:"PDF",cantidad:"1",notas:"Documento que formaliza las modificaciones aprobadas al proyecto original."},
  {id:"ITM-020",paquete:"Diseño + ejecución",etapa:"Obra",entregable:"Cronograma base + control de hitos.",formato:"PDF",cantidad:"1",notas:"Programa de obra con hitos de entrega y pagos vinculados."},
  {id:"ITM-021",paquete:"Diseño + ejecución",etapa:"Obra",entregable:"Acta de cierre y entrega final.",formato:"PDF",cantidad:"1",notas:"Documento que formaliza la entrega del proyecto terminado."},
];

export const ESTADOS=["Excluido","Supuesto","Revisión"];

export const CATEGORIAS=["Exclusiones generales","Exclusiones específicas","Supuestos técnicos","Supuestos comerciales","Supuestos de plazo","Eventos de recotización"];

export const BIBLIOTECA_BASE=[
  {cat:"Exclusiones generales",item:"Trámites y licencias",texto:"No incluye gestión municipal, licencias ni aprobación ante entidades.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Tasas y derechos",texto:"No incluye pagos por tasas, derechos, impuestos ni costos municipales.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Topografía / estudios previos",texto:"No incluye levantamiento topográfico, mecánica de suelos ni estudios especializados.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Especialidades",texto:"No incluye desarrollo de estructuras, sanitarias, eléctricas, HVAC u otras especialidades.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Mobiliario y equipamiento",texto:"No incluye mobiliario suelto, equipamiento ni compras directas.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Paisajismo / señalética / branding",texto:"No incluye diseño de paisaje, branding, señalética ni gráfica ambiental.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Renders extra / impresiones",texto:"No incluye visualizaciones adicionales ni impresiones físicas fuera de lo acordado.",estado:"Excluido"},
  {cat:"Exclusiones generales",item:"Supervisión permanente / ejecución",texto:"No incluye ejecución de obra, administración integral ni presencia permanente en campo.",estado:"Excluido"},
  {cat:"Exclusiones específicas",item:"Intervenciones fuera del área definida",texto:"No incluye áreas no contempladas expresamente en el alcance base.",estado:"Excluido"},
  {cat:"Exclusiones específicas",item:"Requerimientos no informados al inicio",texto:"No incluye exigencias o partidas que no hayan sido informadas al momento de cotizar.",estado:"Excluido"},
  {cat:"Supuestos técnicos",item:"Información base entregada por el cliente",texto:"Se asume que medidas, planos y data base entregada por el cliente son suficientes y confiables.",estado:"Supuesto"},
  {cat:"Supuestos técnicos",item:"Condiciones existentes regulares",texto:"Se asume que el inmueble no presenta contingencias ocultas no visibles al momento de la propuesta.",estado:"Supuesto"},
  {cat:"Supuestos técnicos",item:"Acceso y levantamiento",texto:"Se asume acceso razonable al inmueble para visitas, levantamiento y validaciones.",estado:"Supuesto"},
  {cat:"Supuestos comerciales",item:"Número de reuniones",texto:"Se asume un número acotado de reuniones según la cotización aprobada.",estado:"Supuesto"},
  {cat:"Supuestos comerciales",item:"Número de revisiones",texto:"Se asume un máximo de rondas de cambios/revisión según lo ofertado.",estado:"Supuesto"},
  {cat:"Supuestos comerciales",item:"Aprobaciones por etapa",texto:"Se asume que el cliente valida cada etapa antes de avanzar a la siguiente.",estado:"Supuesto"},
  {cat:"Supuestos comerciales",item:"Cambios fuera de alcance",texto:"Todo cambio fuera del alcance aprobado se cotiza aparte.",estado:"Supuesto"},
  {cat:"Supuestos de plazo",item:"Inicio sujeto a adelanto o aprobación",texto:"El inicio corre desde la aprobación formal y/o pago inicial.",estado:"Supuesto"},
  {cat:"Supuestos de plazo",item:"Retroalimentación oportuna del cliente",texto:"Los plazos suponen respuestas y validaciones del cliente dentro de tiempos razonables.",estado:"Supuesto"},
  {cat:"Supuestos de plazo",item:"Terceros y entidades externas",texto:"No se consideran demoras atribuibles a terceros, proveedores, comités o entidades.",estado:"Supuesto"},
  {cat:"Eventos de recotización",item:"Cambio de alcance",texto:"Cualquier cambio de alcance, área o nivel de detalle genera recotización.",estado:"Revisión"},
  {cat:"Eventos de recotización",item:"Nuevas especialidades o visitas",texto:"Nuevas especialidades, visitas extra o reuniones extraordinarias generan adicional.",estado:"Revisión"},
  {cat:"Eventos de recotización",item:"Rediseño tras aprobación",texto:"Cambios posteriores a una aprobación de etapa se consideran trabajo adicional.",estado:"Revisión"},
  {cat:"Eventos de recotización",item:"Información base incorrecta",texto:"Errores u omisiones en la información base que alteren el servicio generan ajuste económico/plazo.",estado:"Revisión"},
];

export const MOSTRAR_DEFAULT=["Trámites y licencias","Tasas y derechos","Supervisión permanente / ejecución","Intervenciones fuera del área definida","Requerimientos no informados al inicio","Condiciones existentes regulares","Número de revisiones","Aprobaciones por etapa","Cambios fuera de alcance","Inicio sujeto a adelanto o aprobación","Retroalimentación oportuna del cliente","Terceros y entidades externas","Cambio de alcance"];

export const ETAPAS_CRON=[
  {id:"lev",label:"Levantamiento",color:"#2471A3",semanas:1,activa:true},
  {id:"ant",label:"Anteproyecto",color:"#1E8449",semanas:3,activa:true},
  {id:"des",label:"Desarrollo",color:"#B7950B",semanas:4,activa:true},
  {id:"exp",label:"Expediente técnico",color:"#BA4A00",semanas:3,activa:true},
  {id:"sup",label:"Supervisión / Obra",color:"#6C3483",semanas:12,activa:false},
];

export const MOTIVOS=["Pedido del cliente","Ajuste técnico","Compatibilización","Contingencia en obra","Error u omisión en información base","Ampliación de alcance","Otro"];

export const IMPACTOS=["Alcance","Plazo","Honorarios","Entregables","Secuencia","Alcance + Plazo","Alcance + Honorarios","Alcance + Plazo + Honorarios"];

export const SOLICITANTES=["Cliente","Arquitecto","Obra","Contratista"];

export const COT_CATEGORIES_BASE = ["Trabajos preliminares","Estructuras","Arquitectura","Carpinteria","Instalaciones"];

export const COT_UNITS = ["UND","M2","M3","ML","GLB","DIA","KG"];
