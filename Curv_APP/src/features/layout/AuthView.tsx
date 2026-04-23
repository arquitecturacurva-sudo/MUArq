import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Brand, Btn, DK, G, UI } from "../runtime/runtime";

type AuthViewProps = {
  darkMode: boolean;
  themeVars: CSSProperties;
  setDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  busy: boolean;
  error: string;
  onBackLanding: () => void;
  onLoginWithEmail: (email: string, password: string) => Promise<void>;
  onRegisterWithEmail: (input: {
    displayName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  onLoginWithGoogle: () => Promise<void>;
};

type Mode = "login" | "register";

export default function AuthView({
  darkMode,
  themeVars,
  setDarkMode,
  busy,
  error,
  onBackLanding,
  onLoginWithEmail,
  onRegisterWithEmail,
  onLoginWithGoogle,
}: AuthViewProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const title = useMemo(
    () => (mode === "login" ? "Inicia sesión en Curv" : "Crea tu cuenta en Curv"),
    [mode]
  );
  const panelBorder = darkMode ? "#304764" : "#D0D7DE";
  const panelBackground = darkMode ? "linear-gradient(145deg,#101C2D 0%,#0D1726 100%)" : "linear-gradient(145deg,#FFFFFF 0%,#FBF7EF 100%)";
  const inputBorder = darkMode ? "#35506D" : "#D0D7DE";
  const inputBackground = darkMode ? "#0E1622" : "#FFFFFF";
  const inputColor = darkMode ? "#E6EDF3" : "#111827";
  const mutedColor = darkMode ? "#9BB0C6" : "#6A737D";
  const helperBackground = darkMode ? "#0F1A2A" : "#FCFAF5";

  const submit = async () => {
    if (!email.trim() || !password.trim()) return;
    if (mode === "login") {
      await onLoginWithEmail(email.trim(), password);
      return;
    }
    await onRegisterWithEmail({
      displayName: displayName.trim(),
      email: email.trim(),
      password,
    });
  };

  return (
    <div
      data-theme={darkMode ? "dark" : "light"}
      style={{
        ...themeVars,
        minHeight: "100vh",
        fontFamily: "'Inter','Helvetica Neue',sans-serif",
        background: UI.bg,
        color: DK,
        padding: "22px 24px 30px",
      }}
    >
      <div style={{maxWidth: 1120, margin: "0 auto"}}>
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 10, flexWrap: "wrap"}}>
          <div style={{display: "flex", alignItems: "center", gap: 10}}>
            <Brand dark />
            <span style={{fontSize: 12, color: mutedColor}}>Acceso seguro por cliente</span>
          </div>
          <div style={{display: "flex", gap: 8}}>
            <Btn v="ol" onClick={onBackLanding}>Volver</Btn>
            <Btn v="ol" onClick={() => setDarkMode((v) => !v)}>{darkMode ? "Modo claro" : "Modo oscuro"}</Btn>
          </div>
        </div>

        <div style={{maxWidth: 920, margin: "36px auto 0", display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 12}}>
          <section style={{border: `1px solid ${panelBorder}`, borderRadius: 16, background: panelBackground, padding: "20px 18px"}}>
          <div style={{display: "flex", justifyContent: "center", gap: 8, marginBottom: 14}}>
            <button
              onClick={() => setMode("login")}
              style={{padding: "6px 11px", borderRadius: 999, border: `1px solid ${mode === "login" ? G : inputBorder}`, background: mode === "login" ? "#FBF7EF" : inputBackground, color: mode === "login" ? G : mutedColor, fontSize: 10, fontWeight: 800, cursor: "pointer"}}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setMode("register")}
              style={{padding: "6px 11px", borderRadius: 999, border: `1px solid ${mode === "register" ? G : inputBorder}`, background: mode === "register" ? "#FBF7EF" : inputBackground, color: mode === "register" ? G : mutedColor, fontSize: 10, fontWeight: 800, cursor: "pointer"}}
            >
              Registrarse
            </button>
          </div>

          <h1 style={{margin: "0 0 12px", fontSize: 24, lineHeight: 1.2, textAlign: "center"}}>{title}</h1>

          {mode === "register" && (
            <label style={{display: "block", marginBottom: 9}}>
              <div style={{fontSize: 10, color: mutedColor, marginBottom: 4}}>Nombre</div>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Nombre del responsable"
                style={{width: "100%", border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "9px 10px", fontSize: 12, background: inputBackground, color: inputColor}}
              />
            </label>
          )}

          <label style={{display: "block", marginBottom: 9}}>
            <div style={{fontSize: 10, color: mutedColor, marginBottom: 4}}>Correo</div>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@empresa.com"
              style={{width: "100%", border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "9px 10px", fontSize: 12, background: inputBackground, color: inputColor}}
            />
          </label>

          <label style={{display: "block", marginBottom: 12}}>
            <div style={{fontSize: 10, color: mutedColor, marginBottom: 4}}>Contraseña</div>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              style={{width: "100%", border: `1px solid ${inputBorder}`, borderRadius: 8, padding: "9px 10px", fontSize: 12, background: inputBackground, color: inputColor}}
            />
          </label>

          {error && (
            <div style={{marginBottom: 9, border: "1px solid #E7C1C1", background: "#FFF7F7", color: "#A63B2A", borderRadius: 8, padding: "8px 9px", fontSize: 11}}>
              {error}
            </div>
          )}

          <div style={{display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap"}}>
            <button
              onClick={submit}
              disabled={busy}
              style={{padding: "9px 12px", border: "none", borderRadius: 8, background: busy ? "#B9B9B9" : G, color: "#fff", fontSize: 11, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer"}}
            >
              {busy ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
            <button
              onClick={onLoginWithGoogle}
              disabled={busy}
              style={{padding: "9px 12px", border: `1px solid ${inputBorder}`, borderRadius: 8, background: inputBackground, color: busy ? "#9BA3AD" : inputColor, fontSize: 11, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer"}}
            >
              Continuar con Google
            </button>
          </div>

          <div style={{fontSize: 10, color: mutedColor, lineHeight: 1.5}}>
            Al registrarte se crea automáticamente un cliente BASE con límites de equipo iniciales.
          </div>
          </section>

          <aside style={{border: `1px solid ${panelBorder}`, borderRadius: 16, background: helperBackground, padding: "16px 14px"}}>
            <div style={{fontSize: 11, fontWeight: 800, color: G, marginBottom: 7}}>Qué ocurre al entrar</div>
            <div style={{fontSize: 11, color: mutedColor, lineHeight: 1.6}}>
              1. Se crea o detecta tu cliente en Firebase.
              <br />
              2. Se asigna plan BASE por defecto para cuentas nuevas.
              <br />
              3. Tus proyectos quedan separados por cliente (tenant).
              <br />
              4. Si tienes datos locales, se importan una sola vez.
            </div>
            <div style={{marginTop: 12, fontSize: 10, color: mutedColor, lineHeight: 1.55}}>
              BASE: 3 editores + 25 viewers.
              <br />
              PRO: 10 editores + 100 viewers.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
