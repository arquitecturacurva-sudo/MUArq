import type React from "react";
import { IconBrief, IconCalc, IconCot, IconCron, IconCronObra, IconExcl, IconMatrix, IconOC, IconVal } from "./ToolIcons";

export const TOOL_ICONS: Record<string, React.ComponentType<{c?:string,s?:number}>> = {calc:IconCalc,matrix:IconMatrix,excl:IconExcl,cron:IconCron,oc:IconOC,brief:IconBrief,cot:IconCot,cronobra:IconCronObra,val:IconVal};
