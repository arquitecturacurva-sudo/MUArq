import type {
  CommercialStatus,
  ProjectCurrency,
  ProjectRecord,
  ProjectSnapshot,
  TrackId,
} from "../runtime/runtime";

export type DemoProjectId = "casa-ladera" | "cafe-nerea" | "oficinas-gotomarket";

export type DemoToolId =
  | "calc"
  | "matrix"
  | "excl"
  | "cron"
  | "cot"
  | "cronobra"
  | "brief"
  | "val"
  | "oc";

export type DemoDisplayStatus = CommercialStatus | "En ejecución";

export type DemoTourStep = {
  id: string;
  title: string;
  description: string;
  toolId: DemoToolId;
  track: TrackId;
};

/**
 * A demo is immutable product content. Its storage scope is derived from id +
 * version, so changing fixture data requires increasing `version`.
 */
export type DemoProjectDefinition = {
  id: DemoProjectId;
  version: number;
  title: string;
  subtitle: string;
  clientName: string;
  location: string;
  area: number;
  currency: ProjectCurrency;
  displayStatus: DemoDisplayStatus;
  duplicateStatus: CommercialStatus;
  tracks: Record<TrackId, boolean>;
  project: ProjectRecord;
  snapshot: ProjectSnapshot;
  tourSteps: readonly DemoTourStep[];
  highlights: readonly string[];
};
