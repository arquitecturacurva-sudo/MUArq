export type PersistentStateValueRef<T> = {
  current: T;
};
export const commitPersistentStateTransition = <T>({
  stateRef,
  nextValue,
  initialValue,
  preserveInitialValue,
  persistValue,
  removeValue,
  applyState,
}: {
  stateRef: PersistentStateValueRef<T>;
  nextValue: T;
  initialValue: T;
  preserveInitialValue: boolean;
  persistValue: (value: T) => void;
  removeValue: () => void;
  applyState: (value: T) => void;
}) => {
  const current = stateRef.current;
  try {
    if (JSON.stringify(current) === JSON.stringify(nextValue)) return false;
    stateRef.current = nextValue;
    if (!preserveInitialValue && JSON.stringify(nextValue) === JSON.stringify(initialValue)) {
      removeValue();
    } else {
      persistValue(nextValue);
    }
  } catch {
    if (Object.is(current, nextValue)) return false;
    stateRef.current = nextValue;
    persistValue(nextValue);
  }
  applyState(nextValue);
  return true;
};
