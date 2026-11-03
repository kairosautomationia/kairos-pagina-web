# KAIROS — sitio web

Sitio estático construido con Astro. La portada usa el sistema visual Calm de TypeUI, con animaciones breves y accesibles; el diagnóstico conserva su flujo HTML y JavaScript.

## Desarrollo

```sh
npm install
npm run dev
```

## Producción

```sh
npm run build
npm run preview
```

El build genera `dist/` con `index.html`, `diagnostico.html` y sus recursos estáticos. La reserva abre la página de KAIROS en Cal.com desde botones genéricos de agendamiento.

## Cloudflare Workers

`wrangler.jsonc` configura los archivos de `dist/` como assets estáticos del Worker `kairos-pagina-web`. Para **Workers Builds** conectado a GitHub, usa `main` como rama de producción, `npm run build` como build command y `npx wrangler deploy` como deploy command. Wrangler toma su versión del `package.json` y usa la configuración del repo al desplegar.

También se puede desplegar desde una terminal autenticada con Cloudflare:

```sh
npm run build
npm run deploy
```
