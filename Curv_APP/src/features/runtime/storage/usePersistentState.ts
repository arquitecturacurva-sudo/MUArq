// Phase 2 extraction. Legacy behavior retained; do not import the runtime facade.
import React from "react";
import { resolveValue } from "../../../domain/project/values";
import { useState, useLayoutEffect } from "react";
import { readStorage } from "../../../infrastructure/project/browserStorage";
import { useEffect } from "react";
import { storageKey } from "../../../infrastructure/project/browserStorage";
import { commitPersistentStateTransition } from "./persistentStateTransition";
import { writeStorage } from "../../../infrastructure/project/browserStorage";
import { removeStorage } from "../../../infrastructure/project/browserStorage";
import { readSharedProjectTextValue } from "../projectServices";
import { isString } from "../../../domain/project/values";
import { firstStoredNonEmptyString } from "../projectServices";
import { PROJECT_STORAGE_EVENT } from "../../../infrastructure/project/browserStorage";
export function usePersistentState<T>(
  key: string,
  initialValue: T | (() => T),
  validate?: (value: unknown) => value is T,
  preserveInitialValue = false
) {
  const resolvedInitial = resolveValue(initialValue);
  const initialRef = React.useRef<T>(resolvedInitial);
  const [loadedKey, setLoadedKey] = useState(key);
  const keyRef = React.useRef(key);
  const [state, setState] = useState<T>(() => readStorage(key, resolvedInitial, validate));
  const stateRef = React.useRef(state);

  // React's guarded state adjustment prevents a stale-key frame without an
  // effect-driven setState. Persistence remains exclusively in event callbacks.
  if (loadedKey !== key) {
    setLoadedKey(key);
    setState(readStorage(key, resolvedInitial, validate));
  }
  useLayoutEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key;
      initialRef.current = resolvedInitial;
    }
    stateRef.current = state;
  }, [key, resolvedInitial, state]);

  useEffect(() => {
    const fullKey = storageKey(key);
    const syncFromAnotherTab = (event: StorageEvent) => {
      if (event.key !== fullKey) return;
      const nextValue = readStorage(key, initialRef.current, validate);
      setState((current) => {
        try {
          if (JSON.stringify(current) === JSON.stringify(nextValue)) return current;
        } catch {
          if (Object.is(current, nextValue)) return current;
        }
        stateRef.current = nextValue;
        return nextValue;
      });
    };
    window.addEventListener("storage", syncFromAnotherTab);
    return () => window.removeEventListener("storage", syncFromAnotherTab);
  }, [key, validate]);

  const setPersistentState = React.useCallback<React.Dispatch<React.SetStateAction<T>>>((value) => {
    const current = stateRef.current;
    const nextValue = typeof value === "function"
      ? (value as (previous: T) => T)(current)
      : value;
    commitPersistentStateTransition({
      stateRef,
      nextValue,
      initialValue: initialRef.current,
      preserveInitialValue,
      persistValue: (next) => writeStorage(key, next),
      removeValue: () => removeStorage(key),
      applyState: setState,
    });
  }, [key, preserveInitialValue]);

  return [state, setPersistentState] as const;
}

export function useSharedProjectTextField(
  sharedKey: string,
  legacyKeys: readonly string[],
  initialValue = ""
) {
  const [value, setValue] = usePersistentState<string>(
    sharedKey,
    () => readSharedProjectTextValue(sharedKey, legacyKeys, initialValue),
    isString,
    true
  );
  const migratedRef = React.useRef(false);

  useEffect(() => {
    if (migratedRef.current) return;
    migratedRef.current = true;

    const sharedValue = readStorage<string>(sharedKey, "", isString);
    if (!sharedValue.trim()) {
      const legacyValue = firstStoredNonEmptyString(legacyKeys);
      if (legacyValue.trim()) writeStorage(sharedKey, legacyValue);
    }
  }, [legacyKeys, sharedKey]);

  useEffect(() => {
    const syncFromStorage = () => {
      const nextValue = readSharedProjectTextValue(sharedKey, legacyKeys, initialValue);
      setValue((current) => (current === nextValue ? current : nextValue));
    };
    window.addEventListener(PROJECT_STORAGE_EVENT, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener(PROJECT_STORAGE_EVENT, syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, [initialValue, legacyKeys, setValue, sharedKey]);

  return [value, setValue] as const;
}
