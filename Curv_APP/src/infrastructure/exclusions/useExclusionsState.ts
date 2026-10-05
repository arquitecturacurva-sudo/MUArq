import { usePersistentState, useSharedProjectTextField } from "../../features/runtime/storage/usePersistentState";
import { SHARED_PROJECT_CLIENT_KEY, PROJECT_CLIENT_LEGACY_KEYS, SHARED_PROJECT_NAME_KEY, PROJECT_NAME_LEGACY_KEYS, SHARED_PROJECT_CODE_KEY, PROJECT_CODE_LEGACY_KEYS } from "../../domain/project/project";
import { defaultExclusionItems } from "../../domain/exclusions/exclusionsRules";
import type { ExclusionItem } from "../../domain/exclusions/exclusionsRules";
import type { ExclusionsState } from "../../application/exclusions/exclusionsState";

/** Preserves historical keys, shared-field fallbacks and storage events. */
export function useExclusionsState(): ExclusionsState {
  const today=new Date().toISOString().split("T")[0];
  const [cl,scl]=useSharedProjectTextField(SHARED_PROJECT_CLIENT_KEY,PROJECT_CLIENT_LEGACY_KEYS); const [pr,spr]=useSharedProjectTextField(SHARED_PROJECT_NAME_KEY,PROJECT_NAME_LEGACY_KEYS); const [cod,scod]=useSharedProjectTextField(SHARED_PROJECT_CODE_KEY,PROJECT_CODE_LEGACY_KEYS);
  const [fe,sfe]=usePersistentState("excl.fe",today); const [resp,sresp]=usePersistentState("excl.resp","");
  const [items,setItems]=usePersistentState<ExclusionItem[]>("excl.items",defaultExclusionItems,Array.isArray);
  const [showAdd,setShowAdd]=usePersistentState("excl.showAdd",false);
  const [newCat,setNewCat]=usePersistentState("excl.newCat","Exclusiones generales");
  const [newItem,setNewItem]=usePersistentState("excl.newItem","__biblioteca__");
  const [newCustomItem,setNewCustomItem]=usePersistentState("excl.newCustomItem",""); const [newCustomTexto,setNewCustomTexto]=usePersistentState("excl.newCustomTexto",""); const [newEstado,setNewEstado]=usePersistentState("excl.newEstado","Excluido");
  const [editId,setEditId]=usePersistentState<string | null>("excl.editId",null); const [editTexto,setEditTexto]=usePersistentState("excl.editTexto","");
  return {cl:[cl,scl],pr:[pr,spr],cod:[cod,scod],fe:[fe,sfe],resp:[resp,sresp],items:[items,setItems],showAdd:[showAdd,setShowAdd],newCat:[newCat,setNewCat],newItem:[newItem,setNewItem],newCustomItem:[newCustomItem,setNewCustomItem],newCustomTexto:[newCustomTexto,setNewCustomTexto],newEstado:[newEstado,setNewEstado],editId:[editId,setEditId],editTexto:[editTexto,setEditTexto]};
}
