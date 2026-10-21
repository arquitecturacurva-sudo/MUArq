import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button, DataTable, EmptyState, Input, Pill, type DataTableColumn } from "../ui/kit";
import { firebaseSupportAccess, type AdminClientSummary } from "../../infrastructure/admin/firebaseSupportAccess";

export type AdminPanelViewProps = {
  activeClientId: string;
};

const ACCESS_LABEL = { none: "Sin acceso", support: "Acceso de soporte", member: "Miembro" } as const;
const ACCESS_TONE = { none: "neutral", support: "brand", member: "success" } as const;

/**
 * Super-admin only. Access to a studio is granted to the super-admin's own account as a
 * `support: true` admin membership, so it shows up in the regular studio switcher.
 */
export default function AdminPanelView({ activeClientId }: AdminPanelViewProps) {
  const [clients, setClients] = useState<AdminClientSummary[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [query, setQuery] = useState("");

  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let active = true;
    void firebaseSupportAccess.listClients().then((result) => {
      if (!active) return;
      if (!result.ok) { setError(result.message); return; }
      setError("");
      setClients(result.value.clients);
      setTruncated(result.value.truncated);
    });
    return () => { active = false; };
  }, [reloadTick]);

  const load = useCallback(() => { setError(""); setReloadTick((tick) => tick + 1); }, []);

  const run = async (clientId: string, action: "grant" | "revoke" | "open") => {
    setBusyId(clientId);
    setError("");
    const result = await firebaseSupportAccess[action](clientId);
    if (!result.ok) {
      setError(result.message);
      setBusyId("");
      return;
    }
    // Opening switches the active studio; App and TeamSessionGate read it on boot.
    if (action === "open") { window.location.reload(); return; }
    setClients((prev) => prev?.map((item) => item.id === clientId ? { ...item, access: action === "grant" ? "support" : "none" } : item) ?? null);
    setBusyId("");
  };

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (clients ?? []).filter((item) => !needle || item.name.toLowerCase().includes(needle) || item.id.toLowerCase().includes(needle));
  }, [clients, query]);

  const columns: DataTableColumn<AdminClientSummary>[] = [
    { id: "name", header: "Estudio", rowHeader: true, cell: (row) => (
      <span className="grid">
        <span className="font-semibold">{row.name}</span>
        <span className="text-muted-foreground">{row.id}</span>
      </span>
    ) },
    { id: "plan", header: "Plan", cell: (row) => [row.plan, row.billingStatus].filter(Boolean).join(" · ") || "—" },
    { id: "status", header: "Estado", cell: (row) => <Pill tone={row.status === "active" ? "success" : "warning"} dot>{row.status}</Pill> },
    { id: "access", header: "Tu acceso", cell: (row) => <Pill tone={ACCESS_TONE[row.access]}>{ACCESS_LABEL[row.access]}</Pill> },
    { id: "actions", header: "Acciones", cell: (row) => {
      const busy = busyId === row.id;
      if (row.access === "none") {
        return <Button variant="outline" disabled={!!busyId} onClick={() => void run(row.id, "grant")}>{busy ? "Concediendo…" : "Darme acceso"}</Button>;
      }
      return (
        <span className="flex flex-wrap gap-2">
          <Button disabled={!!busyId || row.id === activeClientId} onClick={() => void run(row.id, "open")}>
            {row.id === activeClientId ? "Abierto" : busy ? "Abriendo…" : "Abrir"}
          </Button>
          {row.access === "support" && (
            <Button variant="outline" disabled={!!busyId || row.id === activeClientId} onClick={() => void run(row.id, "revoke")}>
              {busy ? "Quitando…" : "Quitar acceso"}
            </Button>
          )}
        </span>
      );
    } },
  ];

  return (
    <main className="grid max-w-[1120px] gap-6 px-6 py-8">
      <div className="grid gap-1">
        <h1 className="m-0 text-title font-semibold">Panel de administración</h1>
        <p className="m-0 text-sm text-muted-foreground">
          Concede a tu cuenta acceso de administrador a un estudio para darle soporte. El acceso no ocupa
          plazas del estudio y puedes quitarlo en cualquier momento.
        </p>
      </div>

      {error && <p role="alert" className="m-0 text-sm" style={{ color: "var(--ui-danger)" }}>{error}</p>}

      {clients === null && !error ? (
        <p role="status" className="m-0 text-sm text-muted-foreground">Cargando estudios…</p>
      ) : clients === null ? (
        <div><Button onClick={() => void load()}>Reintentar</Button></div>
      ) : (
        <>
          <label className="relative block max-w-[360px]">
            <span className="sr-only">Buscar estudio</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input className="pl-9" placeholder="Buscar por nombre o id" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <DataTable
            caption={`${rows.length} estudios`}
            rows={rows}
            columns={columns}
            rowKey={(row) => row.id}
            emptyState={<EmptyState title="Sin resultados" description="Ningún estudio coincide con la búsqueda." />}
          />
          {truncated && <p className="m-0 text-sm text-muted-foreground">Se muestran los primeros 500 estudios.</p>}
        </>
      )}
    </main>
  );
}
