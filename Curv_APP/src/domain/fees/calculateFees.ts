import { TAR, CF, UF, KF, MF } from "../project/toolDefaults";
import { rnd } from "../project/currency";

/** Numeric strings are part of the persisted legacy form contract. */
export interface FeesInput {
  ti: string; et: string; ar: string | number;
  co: string; ur: string; tc: string; mo: string;
  mg: string | number; dc: string | number; rd: string | number;
  ig: boolean; rx: string | number; vx: string | number; nx: string | number;
}

/** Keep operation order and independent milestone rounding for existing proposals. */
export function calculateFees(input: FeesInput) {
  const { ti, et, ar, co, ur, tc, mo, mg, dc, rd, ig, rx, vx, nx } = input;
    const a=+ar||0,t=(TAR[ti]||{})[et]||0,b=t*a;
    const adj=b*(CF[co]||1)*(UF[ur]||1)*(KF[tc]||1)*(MF[mo]||1)*(1+(+mg||0)/100)*(1-(+dc||0)/100);
    const ext=(+rx||0)*240+(+vx||0)*180+(+nx||0)*250;
    const sub=adj+ext,igv=ig?sub*.18:0,tot=rnd(sub+igv,+rd||0);
    return {t,b,adj,ext,sub,igv,tot,rMin:Math.round(tot*.92),rMax:Math.round(tot*1.08),
      hitos:[{n:"Adelanto",p:.5},{n:"Mitad",p:.25},{n:"Entrega",p:.25}].map(h=>({...h,m:rnd(tot*h.p,10)}))};
}
export type FeesResult = ReturnType<typeof calculateFees>;
