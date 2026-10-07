// Copia el sitio estático a dist/ para que Cloudflare Workers (wrangler.jsonc) lo sirva.
import { cpSync, mkdirSync, rmSync, readdirSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist/Documentos', { recursive: true });

for (const f of ['index.html', 'diagnostico.html', 'styles.css', 'diagnostico.css', 'script.js', 'diagnostico.js', 'favicon.ico']) {
    cpSync(f, `dist/${f}`);
}
cpSync('favicon', 'dist/favicon', { recursive: true });
for (const f of readdirSync('Documentos')) {
    if (/\.(png|jpe?g|webp|svg)$/i.test(f)) cpSync(`Documentos/${f}`, `dist/Documentos/${f}`);
}
console.log('dist/ listo');
