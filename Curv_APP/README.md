# Curv App

Aplicación de propuesta técnica/comercial para CURVA: honorarios, entregables, exclusiones, cronograma, cotización, valorización, brief y orden de cambio.

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Standalone HTML (1 archivo)

Genera un `standalone.html` usable con doble click (`file://`) y sin depender de `dist/assets`.

```bash
npm run build:standalone
```

También puedes generar solo desde `dist` ya existente:

```bash
npm run build:standalone:only
```

## Publicación en GitHub Pages (costo 0)

### Opción recomendada (simple)
1. Ejecuta `npm run build:standalone`.
2. Copia `standalone.html` y renómbralo a `index.html`.
3. Súbelo a una rama para Pages (por ejemplo `gh-pages`) en la raíz.
4. En GitHub: `Settings > Pages`.
5. Source: `Deploy from a branch`.
6. Branch: `gh-pages` + folder `/ (root)`.
7. Guarda y espera la URL pública.

### Checklist post deploy
1. La app carga sin errores en la URL pública.
2. Navegación entre tools funciona.
3. Persistencia (`localStorage`) funciona tras recargar.
4. Impresión/export de documentos funciona.
5. Botón `Nuevo proyecto` limpia estado correctamente.

