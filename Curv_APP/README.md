# Curv App

Aplicacion comercial/tecnica para CURVA (propuestas, entregables, cotizacion, valorizacion, brief y ordenes de cambio).

## Prerrequisitos

- Node.js 22+ (recomendado LTS)
- npm 10+
- Windows 10/11 x64 para builds de escritorio

## Desarrollo web local

```bash
npm install
npm run dev
```

## Build web

```bash
npm run build
```

## Standalone HTML (1 archivo)

Genera `standalone.html` para abrir con doble click (`file://`) sin depender de `dist/assets`.

```bash
npm run build:standalone
```

Solo desde `dist` existente:

```bash
npm run build:standalone:only
```

## Escritorio (Electron)

### Variables de entorno

En `.env`/`.env.local`:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_BILLING_PORTAL_URL=
```

- `VITE_BILLING_PORTAL_URL`: URL publica de tu portal/pagina web de pagos.  
  En desktop, el CTA de suscripcion abre esta URL en el navegador externo.

### Firebase Auth en desktop

- El ejecutable sirve la app en `http://localhost:<puerto>` interno para habilitar OAuth de Google en Electron.
- En Firebase Console (`Authentication > Settings > Authorized domains`), asegurate de tener:
  - `localhost`
  - `<tu-proyecto>.firebaseapp.com` (normalmente ya viene por defecto)

### Roles de membresia en Firestore

- Si tus documentos `clients/{clientId}/members/{uid}` usan `role: "owner"`, las reglas deben tratar `owner` como admin.
- Este repositorio ya lo contempla en `firestore.rules` (funcion `isAdmin`).
- Recuerda desplegar reglas para que tome efecto:

```bash
firebase deploy --only firestore:rules
```

### Ejecutar desktop en modo desarrollo

```bash
npm run desktop:dev
```

Este comando:
- Levanta Vite en `http://127.0.0.1:4173`.
- Abre Electron cargando ese servidor.

### Build desktop para distribucion

```bash
npm run desktop:dist
```

Salida en `release/`:
- `CurvApp-Setup-<version>-x64.exe` (NSIS installer)
- `CurvApp-Portable-<version>-x64.exe` (portable)

## Firma digital (Authenticode)

Para releases firmados:

```bash
CSC_LINK=
CSC_KEY_PASSWORD=
```

- `CSC_LINK`: certificado PFX (base64 o URL soportada por electron-builder)
- `CSC_KEY_PASSWORD`: password del certificado

Cuando `REQUIRE_SIGNING=true` (o en CI), el build falla si faltan esas variables.
En local, `signAndEditExecutable` queda desactivado por defecto para evitar fallos de privilegios al extraer herramientas de firmado.
En CI se activa explicitamente con `--config.win.signAndEditExecutable=true`.

## CI/CD de release por tag

Workflow: `.github/workflows/release-desktop.yml`

Dispara al hacer push de tags `v*` (ejemplo: `v1.2.0`):
1. `npm ci`
2. `npm run desktop:dist`
3. Publica `.exe` en el GitHub Release del tag

Secrets requeridos en GitHub:
- `CSC_LINK`
- `CSC_KEY_PASSWORD`

## Checklist de validacion antes de publicar

1. `npm run desktop:dev` inicia sin errores.
2. Login Firebase y flujo principal funcionan.
3. CTA de plan en desktop abre `VITE_BILLING_PORTAL_URL` en navegador.
4. `npm run desktop:dist` genera instalador y portable en `release/`.
5. Verificar firma digital en propiedades del `.exe`.
6. Probar instalacion en Windows x64 limpio.
