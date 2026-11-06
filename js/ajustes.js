/* AJUSTES: links de los chats en Claude (se guardan solo en este celular) y mantenimiento. */

function vistaAjustes() {
  vista.textContent = '';
  vista.append(titulo('AJUSTES', 'Estos datos se guardan en este celular. No viajan a ningún servidor.'));

  const b = bloque('Links de los chats en Claude', 'Pegá el link de cada chat. Con eso, el botón "Abrir chat en Claude" lo abre directo.');
  const urls = leerLocal(CLAVE_URLS, {});
  const campos = {};
  CHATS.forEach(function (n) {
    b.append(el('p', 'suave', n));
    campos[n] = campo('https://claude.ai/chat/...', 'url', urls[n] || '');
    b.append(campos[n]);
  });
  b.append(boton('Guardar links', async function () {
    const nuevo = {};
    CHATS.forEach(function (n) { nuevo[n] = campos[n].value.trim(); });
    guardarLocal(CLAVE_URLS, nuevo);
    aviso('Links guardados');
  }));
  vista.append(b);

  const m = bloque('Mantenimiento');
  m.append(boton('Actualizar datos ahora', async function () { await datosInicio(true); aviso('Datos actualizados'); }, 'sec'));
  m.append(boton('Buscar versión nueva de la app', async function () {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) await r.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
    location.reload();
  }, 'sec'));
  m.append(boton('Cerrar sesión', async function () { borrarSesion(); invalidarInicio(); pantallaLogin(); }, 'sec'));
  m.append(el('p', 'suave', 'Versión de la app: ' + VERSION_APP));
  vista.append(m);
}
