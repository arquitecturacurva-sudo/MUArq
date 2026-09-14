import { useRef, useState } from "react";
import type { TenantAccessError, TenantAccessResult } from "../../domain/tenant/teamAccess";

export function useTeamMutation(refresh: () => Promise<void>) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<TenantAccessError | null>(null);
  async function run<T>(operation: () => Promise<TenantAccessResult<T>>, onSuccess: () => void) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await operation();
      if (result.ok) { await refresh(); onSuccess(); }
      else {
        setError(result.error);
        if (result.error.code === "conflict" || result.error.code === "permission-denied") await refresh();
      }
    } finally { lock.current = false; setBusy(false); }
  }
  return { busy, error, setError, run };
}
