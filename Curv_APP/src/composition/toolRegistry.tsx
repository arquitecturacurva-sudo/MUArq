import { ToolCalc } from "./FeesTool";
import { ToolMatrix } from "./MatrixTool";
import { ToolExcl } from "./ExclusionsTool";
import { ToolCronograma } from "./StageScheduleTool";
import { ToolCotizacionObra } from "./QuotationTool";
import { ToolCronogramaObra } from "./ConstructionScheduleTool";
import { ToolValorizacionAvance } from "./ValuationTool";
import { ToolBrief } from "./ArchitecturalProgramTool";
import { ToolOC } from "./ChangeOrderTool";
import type { PersistedToolState } from "../domain/project/project";

export const DEFAULT_TOOLS=[
  {id:"calc", label:"Calculadora de Honorarios",  component:ToolCalc,  checked:true},
  {id:"matrix",label:"Matriz de Entregables",      component:ToolMatrix,checked:true},
  {id:"excl", label:"Exclusiones y Supuestos",     component:ToolExcl,  checked:true},
  {id:"cron", label:"Cronograma por Etapas",       component:ToolCronograma,checked:true},
  {id:"cot",  label:"Cotización de Obra",          component:ToolCotizacionObra, checked:true},
  {id:"cronobra",label:"Cronograma de Obra",       component:ToolCronogramaObra, checked:true},
  {id:"val",  label:"Valorización de Avance",      component:ToolValorizacionAvance, checked:true},
  {id:"brief",label:"Programa Arquitectónico",     component:ToolBrief, checked:true},
  {id:"oc",   label:"Orden de Cambio",             component:ToolOC,    checked:true},
];
export const DEFAULT_TOOL_STATES: PersistedToolState[] = DEFAULT_TOOLS.map((tool) => ({id: tool.id, checked: tool.checked}));
