import { useState } from "react";
import type { CSSProperties } from "react";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { Button, Card, Field, FieldLabel, Input } from "../ui/kit";
import { Brand } from "../runtime/runtime";
import authBackground from "../../assets/auth/auth-background.webp";

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

/** Google's mark is not in lucide, so it ships inline. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden className="size-4">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  );
}

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
  const isLogin = mode === "login";

  const submit = async () => {
    if (!email.trim() || !password.trim()) return;
    if (isLogin) {
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
      /*
       * The photo and its scrim are painted by this element rather than by absolutely
       * positioned children: a negative z-index only works relative to the nearest
       * ancestor stacking context, so it is easily out-painted by a wrapper background.
       * A background-image stack cannot be, and needs no extra DOM.
       */
      style={{
        ...themeVars,
        backgroundImage: `linear-gradient(180deg, rgba(10,8,6,0.62) 0%, rgba(10,8,6,0.44) 38%, rgba(10,8,6,0.70) 100%), url(${authBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      className="flex min-h-screen flex-col"
    >

      <header className="flex items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Brand />
          <span className="text-sm text-white/70">Acceso seguro por cliente</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={onBackLanding}
          >
            <ArrowLeft />
            Volver
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/15 hover:text-white"
            onClick={() => setDarkMode((value) => !value)}
            title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            aria-label={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {darkMode ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <Card className="w-full max-w-[440px] gap-5 p-8 shadow-2xl">
          <div className="grid gap-1">
            <h1 className="m-0 text-title font-semibold">
              {isLogin ? "Inicia sesión" : "Crea tu cuenta"}
            </h1>
            <p className="m-0 text-sm text-muted-foreground">
              {isLogin
                ? "Entra a tus proyectos, propuestas y obra."
                : "Se crea un cliente BASE con tu espacio de trabajo."}
            </p>
          </div>

          <Button variant="outline" className="w-full" onClick={onLoginWithGoogle} disabled={busy}>
            <GoogleMark />
            Continuar con Google
          </Button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">O con tu correo</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-4">
            {!isLogin && (
              <Field>
                <FieldLabel htmlFor="auth-name">Nombre</FieldLabel>
                <Input
                  id="auth-name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Nombre del responsable"
                  autoComplete="name"
                />
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="auth-email">Correo</FieldLabel>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="correo@empresa.com"
                autoComplete="email"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="auth-password">Contraseña</FieldLabel>
              <Input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete={isLogin ? "current-password" : "new-password"}
                onKeyDown={(event) => { if (event.key === "Enter") void submit(); }}
              />
            </Field>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-md border border-solid p-3 text-sm"
              style={{
                color: "var(--ui-text)",
                borderColor: "color-mix(in srgb, var(--ui-danger) 38%, transparent)",
                background: "color-mix(in srgb, var(--ui-danger) 14%, transparent)",
              }}
            >
              {error}
            </div>
          )}

          <Button className="w-full" onClick={submit} disabled={busy}>
            {busy ? "Procesando..." : isLogin ? "Entrar" : "Crear cuenta"}
          </Button>

          <p className="m-0 text-center text-sm text-muted-foreground">
            {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes una cuenta?"}{" "}
            <button
              type="button"
              onClick={() => setMode(isLogin ? "register" : "login")}
              className="kit-focus cursor-pointer border-0 bg-transparent p-0 font-medium text-foreground underline underline-offset-2"
            >
              {isLogin ? "Regístrate" : "Inicia sesión"}
            </button>
          </p>
        </Card>
      </main>
    </div>
  );
}
