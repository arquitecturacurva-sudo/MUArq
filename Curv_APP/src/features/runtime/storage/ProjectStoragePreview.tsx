import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { usePersistentState } from "./usePersistentState";
import { storageKey, writeStorage } from "../../../infrastructure/project/browserStorage";
const isNumber = (value: unknown): value is number => typeof value === "number";

// Dev-only fixture for the extracted hook. Uses isolated QA keys.
export function Fixture() {
  const [key, selectKey] = useState("a");
  const [count, setCount] = usePersistentState("qa.phase2." + key, 0, isNumber);
  return <main><h1>Persistencia / QA</h1><p>Clave: {key}</p><output aria-label="Valor">{count}</output>
    <button onClick={() => { setCount(value => value + 1); setCount(value => value + 1); }}>Incrementar dos veces</button>
    <button onClick={() => setCount(0)}>Volver al valor inicial</button>
    <button onClick={() => selectKey(value => value === "a" ? "b" : "a")}>Cambiar clave</button>
    <button onClick={() => {
      writeStorage("qa.phase2." + key, 7);
      window.dispatchEvent(new StorageEvent("storage", { key: storageKey("qa.phase2." + key) }));
    }}>Simular otra pestana</button>
  </main>;
}
if (import.meta.env.DEV) createRoot(document.getElementById("root")!).render(<StrictMode><Fixture /></StrictMode>);
