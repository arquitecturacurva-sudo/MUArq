import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { watchAuth, logout } from "../lib/auth/authService";
import { firebaseInvitations } from "../infrastructure/tenant/firebaseInvitations";
import { parseInvitationHash, type TeamSession } from "../domain/tenant/invitations";
import { Button } from "../components/ui/button";
import { ViewerWorkspace } from "../features/invitations/ViewerWorkspace";
import { readViewerProject } from "../infrastructure/firebase/viewerProjects";
import { LIGHT_THEME_VARS } from "../features/ui/theme";
const InvitationEntry = lazy(() => import("./InvitationEntry"));
// Invitation entry never mounts App, whose legacy auth listener provisions tenants.
export default function TeamSessionGate({ children }: { children: ReactNode }) {
  const [hash, setHash] = useState(window.location.hash); const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loaded, setLoaded] = useState<{ uid: string; session: TeamSession } | null>(null);
  const [error, setError] = useState(""); const [retry, setRetry] = useState(0); const [busy, setBusy] = useState(false);
  const isInvitation = hash.includes("invitation=") || hash.includes("token=");
  useEffect(() => { const change = () => setHash(window.location.hash); window.addEventListener("hashchange", change); return () => window.removeEventListener("hashchange", change); }, []);
  useEffect(() => watchAuth(setUser), []);
  useEffect(() => {
    let active = true;
    if (user && !isInvitation) void firebaseInvitations.session().then(result => { if (active) { if (result.ok) { setLoaded({ uid: user.uid, session: result.value }); setError(""); } else setError(result.error.message); } });
    return () => { active = false; };
  }, [user, retry, isInvitation]);
  if (user === undefined) return <p role="status">Cargando sesion...</p>;
  if (isInvitation) return <Suspense fallback={<p role="status">Cargando invitacion...</p>}><InvitationEntry key={user?.uid || "signed-out"} link={parseInvitationHash(hash)} user={user} /></Suspense>;
  if (!user) return <>{children}</>;
  if (error) return <main style={{ padding: 24 }}><p role="alert">{error}</p><Button onClick={() => { setError(""); setLoaded(null); setRetry(value => value + 1); }}>Reintentar</Button><Button onClick={() => void logout()}>Cerrar sesion</Button></main>;
  if (loaded?.uid !== user.uid) return <p role="status">Cargando tus estudios...</p>;
  const session = loaded.session; const tenant = session.tenants.find(item => item.id === session.activeTenantId);
  const viewer = tenant?.role === "viewer";
  return <div style={viewer ? { ...LIGHT_THEME_VARS, minHeight: "100vh" } : undefined}>
    {session.tenants.length > 1 || viewer ? <nav className="kit-surface" aria-label="Estudio activo" style={{ padding: "8px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
      <label htmlFor="session-study">Estudio</label><select id="session-study" name="active-study" value={tenant?.id || ""} disabled={busy} onChange={async event => { setBusy(true); const result = await firebaseInvitations.select(event.target.value); if (!result.ok) { setError(result.error.message); setBusy(false); return; } window.location.reload(); }}>
        {session.tenants.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      {viewer ? <><span>Viewer / Solo lectura</span><Button variant="ghost" onClick={() => void logout()}>Cerrar sesion</Button></> : null}
    </nav> : null}
    {viewer && tenant ? <ViewerWorkspace key={tenant.id} tenant={tenant} readProject={readViewerProject} /> : children}
  </div>;
}
