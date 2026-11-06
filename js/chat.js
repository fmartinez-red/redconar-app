/* Pantalla de cada chat: VENTAS, PLATAFORMA, DATOS y PRESUPUESTOS REDCONAR. */

const CLAVE_URLS = 'redconar_urls_chats';

function urlDeChat(nombre) { return (leerLocal(CLAVE_URLS, {})[nombre] || '').trim(); }

async function vistaChat(nombre) {
  vista.textContent = '';
  vista.append(titulo(nombre, 'Lo que este chat tiene pendiente, lo que hizo hoy y un lugar para pedirle cosas.'));
  const estado = el('p', 'suave', 'Cargando...');
  vista.append(estado);
  let d;
  try { d = await datosInicio(false); } catch (e) { estado.textContent = 'No se pudo cargar: ' + e.message; return; }
  estado.textContent = cuandoActualizado();
  const c = d.chats[nombre];

  // (c) Abrir el chat en Claude
  const abrir = boton('Abrir chat en Claude', function () {
    const url = urlDeChat(nombre);
    if (!url) { aviso('Primero cargá el link de este chat en AJUSTES'); irA('AJUSTES'); return; }
    window.open(url, '_blank', 'noopener');
  });
  vista.append(abrir);

  // (b) Pedido para este chat
  const zonaPedido = el('div');
  vista.append(zonaPedido);
  const mostrarPedido = function () {
    zonaPedido.textContent = '';
    zonaPedido.append(formPedido(null, '', nombre, function () { datosInicio(true).then(function () { vistaChat(nombre); }); }));
  };
  vista.append(boton('Escribir pedido para este chat', mostrarPedido, 'sec'));

  // (d) Resumen de hoy
  const hoy = bloque('Lo que hizo hoy (' + c.hoy.length + ')', 'Gestiones que este chat registró hoy en la hoja.');
  if (!c.hoy.length) hoy.append(vacio('Todavía no registró nada hoy.'));
  c.hoy.forEach(function (x) {
    const k = el('article', 'card');
    k.append(el('strong', null, x.nombre || x.empresa || 'Sin nombre'));
    if (x.mensaje) k.append(el('p', null, x.mensaje));
    if (x.respuesta) k.append(el('p', 'suave', 'Respuesta: ' + x.respuesta));
    if (x.estado) k.append(el('p', 'suave', 'Estado: ' + x.estado));
    hoy.append(k);
  });
  vista.append(hoy);

  // (a) Traspasos
  const pend = bloque('Traspasos pendientes (' + c.pendientes.length + ')', 'Pedidos para este chat que todavía no se cerraron.');
  if (!c.pendientes.length) pend.append(vacio('No hay pendientes.'));
  c.pendientes.forEach(function (t) {
    const k = el('article', 'card');
    k.append(el('h2', null, [t.tipo, t.contacto].filter(Boolean).join(' · ')));
    k.append(el('p', 'suave', [t.fecha, 'de ' + t.de_chat, t.prioridad && 'prioridad ' + t.prioridad].filter(Boolean).join(' · ')));
    if (t.detalle) k.append(el('p', null, t.detalle));
    const r = campo('Resultado (qué se hizo)');
    k.append(r, boton('Cerrar traspaso', async function () {
      await api('cerrarTraspaso', { id: t.id, resultado: r.value });
      invalidarInicio();
      aviso('Traspaso cerrado');
      vistaChat(nombre);
    }, 'sec'));
    pend.append(k);
  });
  vista.append(pend);

  const cerr = bloque('Cerrados recientes', 'Los últimos 8.');
  if (!c.cerrados.length) cerr.append(vacio('Ninguno todavía.'));
  c.cerrados.forEach(function (t) {
    const k = el('article', 'card');
    k.append(el('strong', null, [t.tipo, t.contacto].filter(Boolean).join(' · ')));
    k.append(el('p', 'suave', 'Cerrado ' + (t.fecha_cierre || '') + (t.resultado ? ': ' + t.resultado : '')));
    cerr.append(k);
  });
  vista.append(cerr);
}
