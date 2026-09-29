import { usePersistentState, useSharedProjectTextField } from "../../features/runtime/storage/usePersistentState";
import { SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS, SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS, SHARED_PROJECT_LOCATION_KEY, PROJECT_LOCATION_LEGACY_KEYS } from "../../domain/project/project";
import { defaultMatrixItems } from "../../domain/matrix/matrixRules";
import type { MatrixItem } from "../../domain/matrix/matrixRules";
import type { MatrixState } from "../../application/matrix/matrixState";

/** Preserve legacy storage keys, migrations and events. */
export function useMatrixState(): MatrixState {
  const today=new Date().toISOString().split("T")[0];
  const [cl,scl]=useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY,PROJECT_CLIENT_LEGACY_KEYS); const [pr,spr]=useSharedProjectTextField(SHARED_PROJECT_NAME_KEY,PROJECT_NAME_LEGACY_KEYS); const [ub,sub]=useSharedProjectTextField(SHARED_PROJECT_LOCATION_KEY,PROJECT_LOCATION_LEGACY_KEYS); const [fe,sfe]=usePersistentState("matrix.fe",today);
  const [paq,spaq]=usePersistentState("matrix.paq","Anteproyecto");
  const [items,setItems]=usePersistentState<MatrixItem[]>("matrix.items",defaultMatrixItems,Array.isArray);
  const [newEnt,setNewEnt]=usePersistentState("matrix.newEnt","__custom__"); const [newCustom,setNewCustom]=usePersistentState("matrix.newCustom","");
  const [newEtapa,setNewEtapa]=usePersistentState("matrix.newEtapa","Levantamiento"); const [newFmt,setNewFmt]=usePersistentState("matrix.newFmt","PDF");
  const [newCant,setNewCant]=usePersistentState("matrix.newCant","1"); const [newNota,setNewNota]=usePersistentState("matrix.newNota",""); const [showAdd,setShowAdd]=usePersistentState("matrix.showAdd",false);


  return {cl:[cl,scl],pr:[pr,spr],ub:[ub,sub],fe:[fe,sfe],paq:[paq,spaq],items:[items,setItems],newEnt:[newEnt,setNewEnt],newCustom:[newCustom,setNewCustom],newEtapa:[newEtapa,setNewEtapa],newFmt:[newFmt,setNewFmt],newCant:[newCant,setNewCant],newNota:[newNota,setNewNota],showAdd:[showAdd,setShowAdd]};
}
