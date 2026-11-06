/* Ventanas emergentes (hojas desde abajo): acciones rápidas sin cambiar de pantalla. */

function abrirModal(titulo_, contenido) {
  const fondo = el('div', 'modal-fondo');
  const m = el('div', 'modal');
  const cab = el('div', 'modal-cab');
  const x = el('button', 'modal-x', '✕');
  const cerrar = function () { fondo.remove(); document.body.classList.toggle('sin-scroll', document.querySelectorAll('.modal-fondo').length > 0); };
  x.onclick = cerrar;
  fondo.onclick = function (e) { if (e.target === fondo) cerrar(); };
  cab.append(el('strong', null, titulo_), x);
  m.append(cab);
  if (contenido) m.append(contenido);
  fondo.append(m);
  document.body.append(fondo);
  document.body.classList.add('sin-scroll');
  return { cuerpo: m, cerrar: cerrar };
}

/** Bloque de WhatsApp: elegir plantilla, editar el texto y abrir el chat con el texto cargado. */
function bloqueWhatsApp(f) {
  const wa = waNumero(f.telefono);
  const caja = el('div', 'wa-bloque');
  if (!wa) { caja.append(vacio('Este contacto no tiene teléfono.')); return caja; }
  const sel = lista(PLANTILLAS.map(function (p) { return [p.id, p.nombre]; }));
  const cuando = el('p', 'suave');
  const txt = campo('Texto', 'area');
  txt.rows = 5;
  const cargar = function () { const p = PLANTILLAS.find(function (x) { return x.id === sel.value; }); cuando.textContent = p.cuando; txt.value = armarTexto(p, f); };
  sel.onchange = cargar; cargar();
  caja.append(sel, cuando, txt, boton('💬 Abrir WhatsApp con este texto', async function () {
    try { await navigator.clipboard.writeText(txt.value); } catch (e) { /* abre igual con el texto en el enlace */ }
    window.open('https://wa.me/' + wa + (txt.value ? '?text=' + encodeURIComponent(txt.value) : ''), '_blank');
  }, 'wa'), boton('📝 Registrar envío', async function () {
    const res = await api('gestion', { nombre: f.nombre, apellido: f.apellido, empresa: f.empresa, telefono: f.telefono, id: f.id, tipo: f.tipo, mensaje: 'WhatsApp: ' + txt.value, respuesta: '', proximo: '', fechaProximo: '' });
    invalidarInicio();
    aviso(res.notaEnCola ? 'Registrado. Nota en cola para Clientify.' : 'Registrado en la hoja.');
  }, 'sec'));
  return caja;
}

/** Contacto en ventana: lo esencial y las acciones rápidas. ref: {fila} o {tel}. */
async function popupContacto(ref) {
  const m = abrirModal('Contacto', el('p', 'suave', 'Cargando...'));
  let r;
  try { r = await api('contacto', { fila: ref.fila, tel: ref.telefono || ref.tel }); } catch (e) { m.cuerpo.lastChild.textContent = 'No se pudo cargar: ' + e.message; return; }
  m.cuerpo.lastChild.remove();
  const f = r.ficha || { nombre: ref.nombre || '', apellido: '', empresa: ref.empresa || '', telefono: ref.telefono || ref.tel || '', email: '', estado: '', tipo: ref.tipo || '', id: '' };
  const nombre = (f.nombre + ' ' + f.apellido).trim() || f.empresa || 'Sin nombre';
  m.cuerpo.querySelector('.modal-cab strong').textContent = nombre;
  const chips = el('p', 'chips');
  [f.empresa && f.nombre && f.empresa, f.fuentes && '📍 ' + f.fuentes, f.etiqueta && '🏷 ' + f.etiqueta, f.estado, f.tipo, f.ufSistema && f.ufSistema + ' UF'].filter(Boolean).forEach(function (t) { chips.append(el('span', 'chip', t)); });
  m.cuerpo.append(chips);
  [['Último contacto', f.ultimoContacto], ['Próximo paso', f.proximoPaso], ['Notas', (f.notas || '').slice(0, 300)]].forEach(function (par) { const p = filaDato(par[0], par[1]); if (p) m.cuerpo.append(p); });

  const acc = el('div', 'acciones');
  const wa = waNumero(f.telefono);
  if (wa) acc.append(enlace('📞 Llamar', 'tel:+' + wa));
  if (f.email) acc.append(enlace('✉️ Mail', 'mailto:' + f.email));
  if (acc.children.length) m.cuerpo.append(acc);

  const zona = el('div');
  const abrir = function (nodo) { zona.textContent = ''; zona.append(nodo); nodo.scrollIntoView({ block: 'nearest' }); };
  m.cuerpo.append(boton('💬 WhatsApp con plantilla', function () { abrir(bloqueWhatsApp(f)); }, 'wa'),
    boton('📝 Registrar gestión', function () { abrir(formGestion(f, nombre)); }, 'sec'),
    boton('📤 Pedido a un chat', function () { abrir(formPedido(f, nombre, null, m.cerrar)); }, 'sec'),
    boton('📂 Ver ficha completa', function () { m.cerrar(); abrirFichaCompleta(ref); }, 'sec'), zona);
}

/** Lista de tareas en ventana, con solapas. grupo: vencidos | hoy | proximos. */
async function popupTareas(grupo) {
  const m = abrirModal('✅ Tareas', el('p', 'suave', 'Cargando...'));
  let d;
  try { d = await datosInicio(false); } catch (e) { m.cuerpo.lastChild.textContent = 'No se pudo cargar: ' + e.message; return; }
  m.cuerpo.lastChild.remove();
  let g = grupo;
  const barra = el('div', 'solapas'), zona = el('div');
  const pintar = function () {
    barra.textContent = '';
    GRUPOS.forEach(function (x) {
      const b = el('button', g === x[0] ? 'activa' : '', x[1] + ' ' + d.agenda[x[0]].length);
      b.onclick = function () { g = x[0]; pintar(); };
      barra.append(b);
    });
    zona.textContent = '';
    if (!d.agenda[g].length) zona.append(vacio('Nada por acá 🎉'));
    d.agenda[g].forEach(function (x) {
      const k = el('div', 'fila tocable');
      const t = el('div');
      t.append(el('strong', null, x.nombre || x.empresa || x.telefono), el('p', 'suave', (x.proximo || x.empresa || '') + ' · ' + textoPlazo(x.dias)));
      k.append(t, el('span', 'flecha', '›'));
      k.onclick = function () { popupContacto(x); };
      zona.append(k);
    });
  };
  m.cuerpo.append(barra, zona);
  pintar();
}

/** Búsqueda en ventana. */
async function popupBuscar(texto) {
  const m = abrirModal('🔍 ' + texto, el('p', 'suave', 'Buscando...'));
  let l;
  try { l = await api('buscar', { q: texto }); } catch (e) { m.cuerpo.lastChild.textContent = e.message; return; }
  m.cuerpo.lastChild.remove();
  if (!l.length) m.cuerpo.append(vacio('Sin resultados.'));
  l.forEach(function (c) {
    const k = el('div', 'fila tocable');
    const t = el('div');
    t.append(el('strong', null, (c.nombre + ' ' + c.apellido).trim() || c.empresa || 'Sin nombre'), el('p', 'suave', [c.empresa, c.estado, c.fuentes].filter(Boolean).join(' · ')));
    k.append(t, el('span', 'flecha', '›'));
    k.onclick = function () { popupContacto({ fila: c.fila }); };
    m.cuerpo.append(k);
  });
}

function popupPedido() {
  const m = abrirModal('📤 Pedido a un chat');
  m.cuerpo.append(formPedido(null, '', null, m.cerrar));
}

function popupPlantillas() {
  const m = abrirModal('📋 Plantillas');
  PLANTILLAS.filter(function (p) { return p.texto; }).forEach(function (p) {
    const k = el('div', 'card');
    k.append(el('strong', null, p.nombre), el('p', 'suave', p.cuando), el('p', null, armarTexto(p, {})));
    k.append(boton('Copiar', async function () { await navigator.clipboard.writeText(armarTexto(p, {})); aviso('Copiada'); }, 'sec'));
    m.cuerpo.append(k);
  });
}

async function popupChats() {
  const m = abrirModal('💬 Chats', el('p', 'suave', 'Cargando...'));
  let d = null;
  try { d = await datosInicio(false); } catch (e) { /* se muestran sin contadores */ }
  m.cuerpo.lastChild.remove();
  CHATS.forEach(function (c) {
    const n = d && d.chats[c] ? d.chats[c].pendientes.length : 0;
    m.cuerpo.append(boton(c + (n ? '  ·  ' + n + ' esperando' : ''), function () { popupChat(c); }));
  });
  m.cuerpo.append(boton('📤 Nuevo pedido', function () { m.cerrar(); popupPedido(); }, 'sec'));
}

/* ---------- Chats ---------- */
const INFO_CHATS = {
  'VENTAS REDCONAR': ['📈', 'Seguimiento de leads y cierre de ventas.'],
  'PLATAFORMA REDCONAR': ['🧩', 'Altas de clientes, legajos y datos en la plataforma.'],
  'DATOS REDCONAR': ['🗂', 'Listas, limpieza y armado de la base de contactos.'],
  'PRESUPUESTOS REDCONAR': ['💰', 'Armado y seguimiento de presupuestos.']
};

/** Un chat en ventana: qué le pidieron, qué hizo hoy y acciones. */
async function popupChat(nombre) {
  const info = INFO_CHATS[nombre] || ['💬', ''];
  const m = abrirModal(info[0] + ' ' + nombre, el('p', 'suave', 'Cargando...'));
  let d;
  try { d = await datosInicio(false); } catch (e) { m.cuerpo.lastChild.textContent = 'No se pudo cargar: ' + e.message; return; }
  m.cuerpo.lastChild.remove();
  const c = d.chats[nombre];
  m.cuerpo.append(el('p', 'suave', info[1]));

  // Abrir el chat (si falta el link, se pega acá mismo)
  const zonaLink = el('div');
  const abrirChatClaude = function () {
    const url = urlDeChat(nombre);
    if (url) { window.open(url, '_blank', 'noopener'); return; }
    zonaLink.textContent = '';
    const caja = el('div', 'card');
    caja.append(el('p', null, 'Falta el link de este chat. Abrilo en Claude, copiá la dirección de la barra y pegala acá:'));
    const i = campo('https://claude.ai/chat/...', 'url');
    caja.append(i, boton('Guardar y abrir', async function () {
      if (!/^https:\/\/claude\.ai\//.test(i.value.trim())) { aviso('Tiene que empezar con https://claude.ai/'); return; }
      const u = leerLocal(CLAVE_URLS, {}); u[nombre] = i.value.trim(); guardarLocal(CLAVE_URLS, u);
      window.open(i.value.trim(), '_blank', 'noopener'); zonaLink.textContent = '';
    }));
    zonaLink.append(caja);
  };
  m.cuerpo.append(boton('🚀 Abrir este chat en Claude', abrirChatClaude), zonaLink,
    boton('📤 Nuevo pedido para este chat', function () { m.cerrar(); const p = abrirModal('📤 Pedido para ' + nombre); p.cuerpo.append(formPedido(null, '', nombre, p.cerrar)); }, 'sec'));

  const pend = bloque('⏳ Pedidos esperando (' + c.pendientes.length + ')',
    c.pendientes.length ? 'Son pedidos que le dejaste (o le dejó otro chat) y todavía no hizo. Para que los resuelva, abrí el chat y escribile "traspasos". Cuando lo haga, se marcan solos; también podés marcarlos vos.' : 'Nada esperando. Este chat está al día. 🎉');
  c.pendientes.forEach(function (t) {
    const k = el('article', 'card');
    k.append(el('strong', null, [t.tipo, t.contacto].filter(Boolean).join(' · ')));
    k.append(el('p', 'suave', [t.fecha, 'pedido por ' + t.de_chat, t.prioridad && 'prioridad ' + t.prioridad].filter(Boolean).join(' · ')));
    if (t.detalle) k.append(el('p', null, t.detalle));
    const r = campo('Qué se hizo (opcional)');
    k.append(r, boton('✅ Marcar resuelto', async function () {
      await api('cerrarTraspaso', { id: t.id, resultado: r.value });
      invalidarInicio(); aviso('Marcado como resuelto'); k.remove();
    }, 'sec'));
    pend.append(k);
  });
  m.cuerpo.append(pend);

  const det = el('details');
  det.append(el('summary', null, '📝 Lo que hizo hoy (' + c.hoy.length + ')'));
  if (!c.hoy.length) det.append(vacio('Todavía no registró nada hoy.'));
  c.hoy.forEach(function (x) {
    const k = el('article', 'card');
    k.append(el('strong', null, x.nombre || x.empresa || 'Sin nombre'));
    if (x.mensaje) k.append(el('p', null, x.mensaje));
    if (x.respuesta) k.append(el('p', 'suave', 'Respuesta: ' + x.respuesta));
    det.append(k);
  });
  m.cuerpo.append(det);
}

/* ---------- Novedades: mail, agenda, drive, WhatsApp ---------- */
const CLAVE_NOV = 'redconar_novedades';
async function datosNovedades(forzar) {
  const c = leerLocal(CLAVE_NOV, null);
  if (!forzar && c && Date.now() - c.t < 3 * 60 * 1000) return c.datos;
  const datos = await api('novedades');
  guardarLocal(CLAVE_NOV, { t: Date.now(), datos: datos });
  return datos;
}
const FALTA_BACKEND = 'Todavía no está activado en la hoja (falta pegar novedades.gs y publicar). Pedímelo y te guío.';

async function popupNovedad(que) {
  const t = { mail: '✉️ Mail sin leer', agenda: '📆 Agenda de hoy', drive: '📁 Drive reciente' }[que];
  const m = abrirModal(t, el('p', 'suave', 'Cargando...'));
  let d;
  try { d = await datosNovedades(false); } catch (e) { m.cuerpo.lastChild.textContent = /Accion desconocida/.test(e.message) ? FALTA_BACKEND : 'No se pudo cargar: ' + e.message; return; }
  m.cuerpo.lastChild.remove();
  const l = que === 'mail' ? d.mails : que === 'agenda' ? d.agenda : d.drive;
  if (que === 'mail') m.cuerpo.append(el('p', 'suave', d.mailSinLeer + ' sin leer en total. Se muestran los últimos 15.'));
  if (!l.length) m.cuerpo.append(vacio('Nada por acá 🎉'));
  l.forEach(function (x) {
    const k = el('div', 'fila' + (x.url ? ' tocable' : ''));
    const c = el('div');
    if (que === 'mail') c.append(el('strong', null, x.asunto || '(sin asunto)'), el('p', 'suave', x.de + ' · ' + x.fecha));
    else if (que === 'agenda') c.append(el('strong', null, x.hora + ' · ' + x.titulo), el('p', 'suave', x.lugar));
    else c.append(el('strong', null, x.nombre), el('p', 'suave', x.fecha));
    k.append(c);
    if (x.url) { k.append(el('span', 'flecha', '›')); k.onclick = function () { window.open(x.url, '_blank', 'noopener'); }; }
    m.cuerpo.append(k);
  });
  m.cuerpo.append(boton('🔄 Actualizar', async function () { await datosNovedades(true); m.cerrar(); popupNovedad(que); }, 'sec'));
}

async function popupWA() {
  const m = abrirModal('📱 WhatsApp');
  m.cuerpo.append(el('p', null, 'Las conversaciones están en WhatsApp Web de la PC. Con el botón de abajo dejás un pedido a VENTAS REDCONAR para que repase solo las conversaciones activas y registre las novedades (con el mínimo de tokens).'),
    el('p', 'suave', 'La PC tiene que estar prendida con WhatsApp Web abierto. Después abrí VENTAS REDCONAR en Claude y escribile "traspasos".'));
  m.cuerpo.append(boton('🔎 Pedir repaso de conversaciones', async function () {
    const r = await api('repasoWA');
    invalidarInicio(); aviso('Pedido dejado a VENTAS (' + r.pedidoEn + ')');
  }), boton('🚀 Abrir VENTAS REDCONAR', function () { popupChat('VENTAS REDCONAR'); }, 'sec'), boton('📋 Plantillas', popupPlantillas, 'sec'));
  m.cuerpo.append(el('p', 'suave', 'Las novedades que registre aparecen en TAREAS y en "Lo que hizo hoy" del chat.'));
}

/* ---------- Avisos programados ---------- */
async function bloqueAvisos() {
  const caja = bloque('🔔 Avisos al celular', 'Te llegan por la app ntfy aunque esta app esté cerrada. Solo suenan en los días y horarios que elijas.');
  caja.id = 'g-avisos';
  let r;
  try { r = await api('avisosGet'); } catch (e) { caja.append(vacio(/Accion desconocida/.test(e.message) ? FALTA_BACKEND : 'No se pudo cargar: ' + e.message)); return caja; }
  const c = r.config;
  const dias = el('div', 'solapas');
  ['D', 'L', 'M', 'X', 'J', 'V', 'S'].forEach(function (n, i) {
    const b = el('button', c.dias.indexOf(i) >= 0 ? 'activa' : '', n);
    b.onclick = function () { const p = c.dias.indexOf(i); if (p >= 0) c.dias.splice(p, 1); else c.dias.push(i); b.classList.toggle('activa'); };
    dias.append(b);
  });
  const d1 = campo('', 'time', c.desde), d2 = campo('', 'time', c.hasta);
  const tipos = el('div', 'solapas');
  [['mail', '✉️ Mail'], ['agenda', '📆 Agenda'], ['drive', '📁 Drive'], ['chats', '💬 Chats']].forEach(function (x) {
    const b = el('button', c[x[0]] ? 'activa' : '', x[1]);
    b.onclick = function () { c[x[0]] = !c[x[0]]; b.classList.toggle('activa'); };
    tipos.append(b);
  });
  caja.append(el('p', 'suave', 'Días'), dias, el('p', 'suave', 'Desde'), d1, el('p', 'suave', 'Hasta'), d2, el('p', 'suave', 'Qué avisar'), tipos,
    boton('Guardar avisos', async function () { c.desde = d1.value || '09:00'; c.hasta = d2.value || '19:00'; await api('avisosSet', c); aviso('Avisos guardados'); }));
  caja.append(el('p', 'suave', 'Una sola vez: instalá la app "ntfy" (gratis), tocá + y suscribite al tema:'), el('p', null, r.topic));
  caja.append(boton('📋 Copiar tema', async function () { await navigator.clipboard.writeText(r.topic); aviso('Copiado'); }, 'sec'));
  if (r.ultimo) caja.append(el('p', 'suave', 'Último aviso: ' + r.ultimo));
  return caja;
}

/* ---------- Tareas diarias automáticas (encender, hora, ejecutar ahora) ---------- */
async function bloqueTareasDiarias() {
  const caja = bloque('⏰ Tareas diarias automáticas', 'Rutina que la hoja ejecuta sola una vez por día. Está apagada hasta que la prendas.');
  let e;
  try { e = await api('tareasGet'); } catch (x) { caja.append(vacio(/Accion desconocida/.test(x.message) ? FALTA_BACKEND : 'No se pudo cargar: ' + x.message)); return caja; }
  const hora = lista(Array.from({ length: 24 }, function (_, i) { return [String(i), (i < 10 ? '0' : '') + i + ':00']; }), String(e.hora));
  caja.append(el('p', null, e.activo ? '🟢 Prendida' : '⚪ Apagada'), el('p', 'suave', 'Hora de ejecución'), hora,
    boton(e.activo ? '⏸ Apagar' : '▶️ Prender', async function () { await api('tareasSet', { activo: !e.activo, hora: Number(hora.value) }); aviso(e.activo ? 'Apagada' : 'Prendida'); vistaAjustes(); }),
    boton('💾 Guardar hora', async function () { await api('tareasSet', { activo: e.activo, hora: Number(hora.value) }); aviso('Hora guardada'); }, 'sec'),
    boton('⚡ Ejecutar ahora', async function () { await api('tareasEjecutar'); aviso('Ejecutada'); }, 'sec'));
  return caja;
}
