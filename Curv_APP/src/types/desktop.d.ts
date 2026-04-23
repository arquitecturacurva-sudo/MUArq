export {};

type CotizacionImportRow = {
  categoria: string;
  codPartida: string;
  descripcion: string;
  und: string;
  cant: number;
  manoObra: number;
  materiales: number;
  utilidadPct: number;
  riesgoPct: number;
};

type CotizacionImportSuccess = {
  ok: true;
  fileName: string;
  rows: CotizacionImportRow[];
};

type CotizacionImportError = {
  ok: false;
  code: string;
  message: string;
};

type CotizacionImportResult = CotizacionImportSuccess | CotizacionImportError;

declare global {
  interface Window {
    curvDesktop?: {
      isDesktop: boolean;
      openExternal: (url: string) => Promise<boolean>;
      importCotizacionXlsx: () => Promise<CotizacionImportResult>;
    };
  }
}
