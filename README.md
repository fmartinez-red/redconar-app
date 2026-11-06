# App Redconar (PWA para el celular)

Lugar único de trabajo de Facu desde el celular. Instalable (Chrome ofrece "Instalar app"), con login de Google, y los datos viven en la hoja de Google "Base Viva - Redconar". Gratis. No envía mensajes a nadie, no borra filas y no tiene tareas automáticas.

- App publicada: https://fmartinez-red.github.io/redconar-app/
- Repositorio: https://github.com/fmartinez-red/redconar-app (cuenta `fmartinez-red`, GitHub Pages desde `main`)
- Hoja: id `1091LfauO-P4bknRnnj4DEcoT-2d04FpU7GN_WEHnVyw` (Drive de fmartinez@redconar.com.ar)

## Qué hace cada sección
| Sección | Qué muestra |
|---|---|
| HOY | Vencidos (con fecha y días de atraso; los de más de 7 días, colapsados), Hoy y Próximos 14 días. Filtro por chat y por tipo. Sale del Log_Actividades: última gestión de cada teléfono con "Fecha_Próximo_Paso". |
| BUSCAR | Por nombre, empresa, mail o teléfono; filtros por Fuentes, Estado y Tipo. |
| VENTAS / PLATAFORMA / DATOS / PRESUPUESTOS REDCONAR | Traspasos pendientes y cerrados recientes de ese chat, caja "Pedido para este chat" (escribe en Traspasos con de_chat "APP FACU"), botón "Abrir chat en Claude" y resumen de lo que hizo el chat hoy (Log_Actividades, columna chat_origen). |
| AJUSTES | Link de cada chat en Claude (se guarda solo en el celular), actualizar datos, buscar versión nueva, cerrar sesión. |
| Ficha | Se abre al tocar un contacto: todos los datos, historial de gestiones, y botones de WhatsApp, llamar, mail, registrar gestión y crear pedido para un chat. |

## Dónde está cada cosa
```
index.html          carga los archivos en orden
config.js           URL de la API y ID de cliente de Google (no son secretos)
styles.css          colores y tamaños (variables en :root)
manifest.webmanifest, sw.js, icons/   lo que hace instalable la app
js/util.js          helpers de pantalla y datos
js/api.js           sesión de Google, llamadas a la API y copia local de "inicio"
js/main.js          menú, navegación (irA) y pantalla de entrada
js/hoy.js           HOY
js/buscar.js        BUSCAR
js/chat.js          pantallas de los 4 chats
js/ficha.js         ficha, registrar gestión, pedido para un chat
js/ajustes.js       AJUSTES
backend/api.gs      API (no se publica en GitHub, está en .gitignore)
```

## Cómo funciona la API
La app hace `POST` a la URL de Apps Script con `Content-Type: text/plain` y un token de Google. El backend verifica que el token sea de este proyecto y de fmartinez@redconar.com.ar. Acciones: `inicio` (una sola llamada con agenda, chats y filtros, con copia local de 3 minutos), `contacto` (ficha + historial), `buscar`, `pedido`, `gestion`, `cerrarTraspaso`.

El código del backend es `backend/api.gs` y va al final del archivo del Apps Script de la hoja. Usa funciones de `leads_clientify.gs` y `automatizacion.gs` (carpeta de arriba).

## Cómo publicar un cambio en la app
1. Editar los archivos de esta carpeta.
2. Subir el número de `VERSION` en `sw.js` y de `VERSION_APP` en `js/main.js`.
3. `git add -A`, `git commit` y `git push` desde esta carpeta (ya está conectada a GitHub). GitHub Pages tarda unos 5 minutos en actualizar.
4. Si se agrega un archivo, sumarlo a `ARCHIVOS` en `sw.js` y a `index.html`.

## Cómo publicar un cambio en la API
1. Editar `backend/api.gs`.
2. Abrir la hoja > Extensiones > Apps Script y reemplazar la parte desde `/* ---------- API JSON para la PWA ---------- */` hasta el final.
3. Implementar > Administrar las implementaciones > editar la implementación activa > Versión: Nueva versión > Implementar. La URL no cambia.

## Reglas
- No enviar mensajes a nadie, no borrar filas, no usar APIs pagas, no vincular la cuenta fakundo713@gmail.com.
- No agregar tareas automáticas sin que Facu las pida.
- Nombres de los chats, exactos: VENTAS REDCONAR, PLATAFORMA REDCONAR, DATOS REDCONAR, PRESUPUESTOS REDCONAR.
- No guardar en este repositorio (es público) claves, el mail de acceso ni datos de contactos.
