# App Redconar (PWA)

- `index.html`, `app.js`, `styles.css`: la app. Secciones en `SECCIONES`, dentro de `app.js`.
- `config.js`: URL de Apps Script.
- `manifest.webmanifest`, `sw.js`, `icons/`: instalación.
- `backend/api.gs`: se agrega al Apps Script de la hoja. Usa funciones de `automatizacion.gs` y `leads_clientify.gs`.
- Hosting: GitHub Pages, cuenta `fmartinez-red`.

Para cambiar algo: editar, subir `VERSION` en `sw.js` y publicar. Si cambia `backend/api.gs`, además publicar una versión nueva en Implementar.

Nunca guardar acá el código secreto ni la clave de Clientify: este repositorio es público.
