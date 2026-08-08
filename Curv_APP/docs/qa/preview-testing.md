# Pruebas QA en previews

## Aprovisionar la cuenta

El usuario QA se crea o actualiza con Firebase Admin y recibe el custom claim
`role: "qa"`. Las credenciales se leen exclusivamente desde variables de
entorno; no deben guardarse en el repositorio.

Variables requeridas:

- `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_SERVICE_ACCOUNT` o
  `FIREBASE_SERVICE_ACCOUNT_B64`
- `QA_EMAIL`
- `QA_PASSWORD`

Ejecución:

```bash
npm run qa:provision
```

El comando es idempotente: crea el usuario si no existe y, si ya existe,
verifica el correo, reactiva la cuenta, actualiza la contraseña y conserva los
claims anteriores al asignar `role: "qa"`.

El claim QA no concede acceso global en Firestore. Después del primer login, el
flujo normal de la aplicación crea un workspace aislado y una membresía `admin`
para esa cuenta. Esto permite probar funcionalidades sin eludir el aislamiento
entre clientes definido en `firestore.rules` y `storage.rules`.

## Preview protegido de Vercel

Guardar el bypass de Vercel únicamente como
`VERCEL_AUTOMATION_BYPASS_SECRET` en el entorno local o en el gestor de secrets
del entorno de pruebas. Para automatización HTTP o Playwright, enviarlo mediante
el header `x-vercel-protection-bypass`.

Las credenciales de login también deben leerse de `QA_EMAIL` y `QA_PASSWORD`.
No deben aparecer en tests, fixtures, capturas, trazas ni reportes.

Cuando se necesiten pruebas de navegador, instalar Chromium con:

```bash
npx playwright install --with-deps chromium
```

Antes de probar una funcionalidad autenticada, el flujo debe abrir el preview
con el header de bypass, iniciar sesión con la cuenta QA y esperar a que termine
el bootstrap del workspace.
