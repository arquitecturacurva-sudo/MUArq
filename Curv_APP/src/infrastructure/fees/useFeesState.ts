import { usePersistentState, useSharedProjectTextField } from "../../features/runtime/storage/usePersistentState";
import { SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS, SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS } from "../../domain/project/project";
import type { FeesState } from "../../application/fees/feesState";

/** Reuses existing migration, storage events and snapshot synchronization unchanged. */
export function useFeesState(): FeesState {
  const today = new Date().toISOString().split("T")[0];
  const [step,ss]=usePersistentState("calc.step",1);
  const [cl,scl]=useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY,PROJECT_CLIENT_LEGACY_KEYS); const [pr,spr]=useSharedProjectTextField(SHARED_PROJECT_NAME_KEY,PROJECT_NAME_LEGACY_KEYS); const [fe,sfe]=usePersistentState("calc.fe",today);
  const [ti,sti]=usePersistentState("calc.ti","Vivienda"); const [et,set_]=usePersistentState("calc.et","Anteproyecto");
  const [ar,sar]=usePersistentState("calc.ar",""); const [mo,smo]=usePersistentState("calc.mo","Suma alzada"); const [ig,sig]=usePersistentState("calc.ig",true);
  const [co,sco]=usePersistentState("calc.co","Media"); const [ur,sur]=usePersistentState("calc.ur","Normal"); const [tc,stc]=usePersistentState("calc.tc","Particular");
  const [mg,smg]=usePersistentState<number | string>("calc.mg",0); const [dc,sdc]=usePersistentState<number | string>("calc.dc",0); const [rd,srd]=usePersistentState<number | string>("calc.rd",50);
  const [rx,srx]=usePersistentState<number | string>("calc.rx",0); const [vx,svx]=usePersistentState<number | string>("calc.vx",0); const [nx,snx]=usePersistentState<number | string>("calc.nx",0);

  return { step: [step, ss], cl: [cl, scl], pr: [pr, spr], fe: [fe, sfe], ti: [ti, sti], et: [et, set_], ar: [ar, sar], mo: [mo, smo], ig: [ig, sig], co: [co, sco], ur: [ur, sur], tc: [tc, stc], mg: [mg, smg], dc: [dc, sdc], rd: [rd, srd], rx: [rx, srx], vx: [vx, svx], nx: [nx, snx] };
}
