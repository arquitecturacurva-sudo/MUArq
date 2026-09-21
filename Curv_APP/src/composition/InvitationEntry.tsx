import "../features/team-access/teamAccess.css";
import { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { reload, sendEmailVerification, type User } from "firebase/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { loginWithEmail, loginWithGoogle, logout, registerWithEmail } from "../lib/auth/authService";
import type { InvitationLink, InvitationPreview } from "../domain/tenant/invitations";
import { firebaseInvitations } from "../infrastructure/tenant/firebaseInvitations";
import { roleLabels } from "../features/team-access/memberPresentation";
import { LIGHT_THEME_VARS } from "../features/ui/theme";

export default function InvitationEntry({ link, user }: { link: InvitationLink | null; user: User | null }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [register, setRegister] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [verified, setVerified] = useState(user?.emailVerified || false);
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    if (link && user && (verified || user.emailVerified)) void firebaseInvitations.preview(link).then(result => {
      if (!active) return;
      if (result.ok) setPreview(result.value); else setError(result.error.message);
    });
    return () => { active = false; };
  }, [link, user, verified, retry]);
  useEffect(() => { document.title = "Aceptar invitacion | Curv"; }, []);
  async function run(action: () => Promise<void>) {
    if (busy) return; setBusy(true); setError("");
    try { await action(); } catch (error) {
      if (!(error instanceof FirebaseError)) throw error;
      setError(error.code === "auth/email-already-in-use" ? "Ese correo ya tiene cuenta. Inicia sesion." : error.code === "auth/weak-password" ? "Usa una contrasena de al menos seis caracteres." : "No pudimos completar la solicitud. Comprueba tus datos y reintenta.");
    } finally { setBusy(false); }
  }
  return <main className="team-access kit-surface" style={{ ...LIGHT_THEME_VARS, minHeight: "100vh", padding: 24 }}><section className="ta-panel" style={{ maxWidth: 560, margin: "24px auto", padding: 24 }}>
    <h1>{preview ? "Unete a " + preview.tenantName : "Unete a un estudio en Curv"}</h1><p>No crearemos un estudio adicional. Aceptaras el acceso que compartieron contigo.</p>
    {!link ? <p role="alert">El enlace esta incompleto. Solicita un enlace nuevo al administrador.</p> : !user ? <form onSubmit={event => { event.preventDefault(); void run(async () => {
      if (register) { const created = await registerWithEmail({ email, password, displayName: name }); await sendEmailVerification(created); setNotice("Te enviamos el correo de verificacion. Abrelo y vuelve a esta pestana."); }
      else await loginWithEmail(email, password);
    }); }}>
      <h2>{register ? "Crea tu cuenta" : "Inicia sesion"}</h2><p>Usa exactamente el correo al que te invitaron.</p>
      {register ? <><label htmlFor="invite-name">Tu nombre</label><Input id="invite-name" name="displayName" autoComplete="name" value={name} disabled={busy} onChange={event => setName(event.target.value)} aria-describedby="entry-error" /></> : null}
      <label htmlFor="invite-email">Correo</label><Input id="invite-email" name="email" type="email" autoComplete="email" required value={email} disabled={busy} onChange={event => setEmail(event.target.value)} aria-describedby="entry-error" />
      <label htmlFor="invite-password">Contrasena</label><Input id="invite-password" name="password" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={6} required value={password} disabled={busy} onChange={event => setPassword(event.target.value)} aria-describedby="entry-error" />
      <Button type="submit" disabled={busy}>{busy ? "Procesando..." : register ? "Crear cuenta" : "Entrar"}</Button>
      <Button type="button" variant="outline" disabled={busy} onClick={() => void run(async () => { await loginWithGoogle(); })}>Continuar con Google</Button>
      <Button type="button" variant="ghost" disabled={busy} onClick={() => setRegister(value => !value)}>{register ? "Ya tengo cuenta" : "Crear una cuenta"}</Button>
    </form> : <>
      <p>Cuenta: <strong>{user.email}</strong></p>
      {preview ? <p>Acceso: {roleLabels[preview.role]}. {preview.role === "viewer" ? "Solo lectura de " + preview.projectIds.length + " proyecto(s) asignado(s)." : "Acceso al estudio completo."}</p> : null}
      {!(verified || user.emailVerified) ? <><p>Verifica tu correo para aceptar la invitacion.</p><Button disabled={busy} onClick={() => void run(async () => { await sendEmailVerification(user); setNotice("Correo de verificacion enviado. Vuelve aqui despues de verificarlo."); })}>Enviar verificacion</Button>
        <Button variant="outline" disabled={busy} onClick={() => void run(async () => { await reload(user); await user.getIdToken(true); setVerified(user.emailVerified); setNotice(user.emailVerified ? "Correo verificado. Ya puedes aceptar." : "La verificacion aun esta pendiente."); })}>Ya verifique mi correo</Button></> : !preview ? <><p role="status">{error ? "No pudimos validar la invitacion." : "Comprobando invitacion..."}</p><Button disabled={busy} onClick={() => { setError(""); setRetry(value => value + 1); }}>Reintentar</Button></> : <Button disabled={busy} onClick={() => void run(async () => {
        const result = await firebaseInvitations.accept(link);
        if (!result.ok) { setError(result.error.message); return; }
        window.history.replaceState(null, "", window.location.pathname); window.location.reload();
      })}>{busy ? "Aceptando..." : "Aceptar invitacion y entrar"}</Button>}
      <Button variant="ghost" disabled={busy} onClick={() => void run(async () => { await logout(); setVerified(false); })}>Usar otra cuenta</Button>
    </>}
    <p id="entry-error" role="alert">{error}</p><p role="status">{notice}</p>
  </section></main>;
}
