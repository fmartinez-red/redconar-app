/* Mail con filtros, gestionados hoy y chats de WhatsApp (vista tipo WhatsApp + envío múltiple). Va después de popup.js. */

function casilla(marcada, alCambiar) {
  const c = el('input'); c.type = 'checkbox'; c.checked = marcada; c.className = 'casilla';
  c.onchange = function () { alCambiar(c.checked); };
  return c;
}
function ordenarPor(l, f) { return l.slice().sort(f); }

/* ---------- MAIL ---------- */
async function popupMail() {
  const m = abrirModal('✉️ Mail');
  const S = { estado: 'unread', dias: '7', cat: '', texto: '', inicio: 0 };
  const sel = {};
  const fEstado = lista([['unread', 'Sin leer'], ['read', 'Leídos'], ['', 'Todos']], 'unread');
  const fDias = lista([['1', 'Hoy y ayer'], ['3', 'Últimos 3 días'], ['7', 'Última semana'], ['30', 'Último mes'], ['', 'Todas las fechas']], '7');
  const fCat = lista([['', 'Todas las categorías'], ['principal', 'Principal'], ['social', 'Social'], ['promos', 'Promociones'], ['novedades', 'Novedades'], ['foros', 'Foros']]);
  const fTxt = campo('Buscar remitente o asunto', 'search');
  const info = el('p', 'suave');
  const zona = el('div');
  const mas = boton('Cargar más', function () { return cargar(false); }, 'sec');
  const barra = el('div', 'barra-sel');
  const nSel = function () { return Object.keys(sel).length; };
  const leer = boton('✔ Marcar leídos', async function () {
    await api('mailLeer', { ids: Object.keys(sel) });
    Object.keys(sel).forEach(function (k) { delete sel[k]; });
    aviso('Marcados como leídos'); cargar(true);
  });
  barra.append(leer);
  const pintarBarra = function () { leer.textContent = '✔ Marcar leídos (' + nSel() + ')'; barra.style.display = nSel() ? 'block' : 'none'; };
  async function cargar(reset) {
    if (reset) { S.inicio = 0; zona.textContent = ''; }
    S.estado = fEstado.value; S.dias = fDias.value; S.cat = fCat.value; S.texto = fTxt.value.trim();
    mas.style.display = 'none';
    let r;
    try { r = await api('mails', S); } catch (e) { zona.append(vacio(/Accion desconocida/.test(e.message) ? FALTA_BACKEND : e.message)); return; }
    info.textContent = r.sinLeer + ' sin leer en total · mostrando ' + (S.inicio + r.items.length);
    if (!r.items.length && reset) zona.append(vacio('Nada con estos filtros 🎉'));
    r.items.forEach(function (x) {
      const k = el('div', 'fila');
      const t = el('div', 'tocable');
      t.append(el('strong', null, (x.leido ? '' : '● ') + (x.asunto || '(sin asunto)')), el('p', 'suave', x.de + ' · ' + x.fecha));
      t.onclick = function () { window.open(x.url, '_blank', 'noopener'); };
      k.append(casilla(Boolean(sel[x.id]), function (v) { if (v) sel[x.id] = 1; else delete sel[x.id]; pintarBarra(); }), t);
      zona.append(k);
    });
    S.inicio += r.items.length;
    mas.style.display = r.hayMas ? 'block' : 'none';
  }
  [fEstado, fDias, fCat].forEach(function (f) { f.onchange = function () { cargar(true); }; });
  fTxt.onkeydown = function (e) { if (e.key === 'Enter') cargar(true); };
  m.cuerpo.append(fEstado, fDias, fCat, fTxt, info, zona, mas, barra);
  pintarBarra();
  cargar(true);
}
const _popupNovedadBase = popupNovedad;
popupNovedad = function (que) { return que === 'mail' ? popupMail() : _popupNovedadBase(que); };

/* ---------- GESTIONADOS HOY ---------- */
async function popupGestionados() {
  const m = abrirModal('✅ Gestionados hoy', el('p', 'suave', 'Cargando...'));
  let r;
  try { r = await api('gestionadosHoy'); } catch (e) { m.cuerpo.lastChild.textContent = /Accion desconocida/.test(e.message) ? FALTA_BACKEND : e.message; return; }
  m.cuerpo.lastChild.remove();
  const sel = {};
  m.cuerpo.append(el('p', 'suave', 'Contactos a los que registraste una gestión hoy. Elegí varios para marcar si respondieron o pedir un repaso.'));
  if (!r.items.length) { m.cuerpo.append(vacio('Todavía no registraste gestiones hoy.')); return; }
  const zona = el('div');
  const barra = el('div', 'barra-sel');
  const pintarBarra = function () { barra.style.display = Object.keys(sel).length ? 'block' : 'none'; };
  const elegidos = function () { return r.items.filter(function (x) { return sel[x.fila]; }); };
  const todos = boton('☑ Seleccionar todos', function () { r.items.forEach(function (x) { sel[x.fila] = 1; }); pintar(); }, 'sec');
  function pintar() {
    zona.textContent = '';
    r.items.forEach(function (x) {
      const k = el('div', 'fila');
      const t = el('div');
      t.append(el('strong', null, x.nombre || x.empresa || x.telefono), el('p', 'suave', (x.mensaje || '').slice(0, 70)),
        el('p', x.respuesta ? 'plazo' : 'suave', x.respuesta ? '💬 ' + x.respuesta.slice(0, 80) : '⏳ Sin respuesta registrada'));
      k.append(casilla(Boolean(sel[x.fila]), function (v) { if (v) sel[x.fila] = 1; else delete sel[x.fila]; pintarBarra(); }), t);
      zona.append(k);
    });
    pintarBarra();
  }
  const marcar = function (txt) {
    return async function () {
      const f = elegidos();
      await api('marcarRespuesta', { filas: f.map(function (x) { return x.fila; }), respuesta: txt });
      f.forEach(function (x) { x.respuesta = txt; delete sel[x.fila]; });
      aviso('Actualizado'); pintar();
    };
  };
  barra.append(boton('✅ Respondió', marcar('Respondió (marcado en app)')), boton('⏳ Sin respuesta', marcar('Sin respuesta (marcado en app)'), 'sec'),
    boton('🔎 Pedir repaso de estos en WhatsApp', async function () {
      const f = elegidos();
      await api('pedido', { chat: 'VENTAS REDCONAR', tipo: 'SEGUIMIENTO', prioridad: 'alta', contacto: 'REPASO ' + f.length + ' CONTACTOS', telefono: '', email: '', clientifyId: '',
        detalle: 'Revisar en WhatsApp Web si respondieron estos contactos gestionados hoy (sin capturas, leer con javascript solo estos chats). Registrar respuesta nueva en Log_Actividades:\n' + f.map(function (x) { return '- ' + (x.nombre || x.empresa) + ' | ' + x.telefono; }).join('\n') });
      invalidarInicio(); aviso('Pedido dejado a VENTAS');
    }, 'sec'));
  m.cuerpo.append(todos, zona, barra);
  pintar();
}

/* ---------- WHATSAPP ---------- */
function nombreSinNumero(n) { return /^[+\d\s-]+$/.test(n || '') ? '' : n; }
function inicial(n) { return (n || '?').trim().charAt(0).toUpperCase(); }

async function popupWA() {
  const m = abrirModal('📱 WhatsApp', el('p', 'suave', 'Cargando...'));
  let r;
  try { r = await api('waChats'); } catch (e) { m.cuerpo.lastChild.textContent = /Accion desconocida/.test(e.message) ? FALTA_BACKEND : e.message; return; }
  m.cuerpo.lastChild.remove();
  const sel = {};
  let modo = false;
  const info = el('p', 'suave', r.cuando ? 'Última lectura de la PC: ' + r.cuando : 'Todavía no se leyó WhatsApp. Tocá "Pedir actualización".');
  const buscar = campo('Buscar chat', 'search');
  const zona = el('div', 'wa-lista');
  const barra = el('div', 'barra-sel');
  const bModo = boton('☑ Seleccionar varios', function () { modo = !modo; if (!modo) Object.keys(sel).forEach(function (k) { delete sel[k]; }); bModo.textContent = modo ? '✖ Salir de selección' : '☑ Seleccionar varios'; pintar(); }, 'sec');
  const bEnviar = boton('✉️ Enviar plantilla', function () { compuesto(); });
  barra.append(bEnviar);
  const elegidos = function () { return r.chats.filter(function (c, i) { return sel[i]; }); };
  function pintar() {
    zona.textContent = '';
    const q = buscar.value.toLowerCase();
    r.chats.forEach(function (c, i) {
      if (q && (c.nombre + ' ' + c.ultimo).toLowerCase().indexOf(q) < 0) return;
      const f = el('div', 'wa-fila tocable');
      if (modo) f.append(casilla(Boolean(sel[i]), function (v) { if (v) sel[i] = 1; else delete sel[i]; pintarBarra(); }));
      f.append(el('div', 'wa-avatar', inicial(c.nombre)));
      const t = el('div', 'wa-texto');
      t.append(el('strong', null, c.nombre || c.tel), el('p', 'suave', c.ultimo));
      const d = el('div', 'wa-der');
      d.append(el('span', 'suave', c.hora));
      if (c.noLeidos) d.append(el('span', 'wa-badge', String(c.noLeidos)));
      f.append(t, d);
      f.onclick = function (e) { if (e.target.type === 'checkbox') return; if (modo) { sel[i] = sel[i] ? 0 : 1; if (!sel[i]) delete sel[i]; pintar(); } else conversacion(c); };
      zona.append(f);
    });
    if (!zona.children.length) zona.append(vacio('Sin chats.'));
    pintarBarra();
  }
  function pintarBarra() { const n = Object.keys(sel).length; bEnviar.textContent = '✉️ Enviar plantilla a ' + n; barra.style.display = n ? 'block' : 'none'; }
  buscar.oninput = pintar;

  function conversacion(c) {
    const v = abrirModal(c.nombre || c.tel);
    const caja = el('div', 'wa-conv');
    if (!c.msgs.length) caja.append(vacio('La PC todavía no cargó esta conversación. Último mensaje: ' + c.ultimo));
    c.msgs.forEach(function (x) { const b = el('div', 'wa-burbuja ' + (x.d === 'out' ? 'sale' : 'entra')); b.append(document.createTextNode(x.t), el('span', 'wa-h', x.h || '')); caja.append(b); });
    v.cuerpo.append(caja);
    const tel = waNumero(c.tel);
    if (tel) v.cuerpo.append(enlace('💬 Abrir en WhatsApp', 'https://wa.me/' + tel, 'btn wa'));
    const txt = campo('Qué mensaje mandaste (para avisar a VENTAS)', 'area');
    v.cuerpo.append(txt, boton('📤 Avisar a VENTAS: ya mandé este mensaje', async function () {
      if (!txt.value.trim()) { aviso('Escribí el mensaje'); return; }
      await api('pedido', { chat: 'VENTAS REDCONAR', tipo: 'SEGUIMIENTO', prioridad: 'media', contacto: c.nombre || c.tel, telefono: c.tel || '', email: '', clientifyId: '', detalle: 'Mandé por WhatsApp a ' + (c.nombre || c.tel) + ': ' + txt.value + '\nRegistrar la gestión y definir próximo paso.' });
      invalidarInicio(); aviso('Pedido dejado a VENTAS'); v.cerrar();
    }, 'sec'));
  }

  function compuesto() {
    const dest = elegidos();
    const v = abrirModal('✉️ Plantilla a ' + dest.length + ' chats');
    const sp = lista(PLANTILLAS.filter(function (p) { return p.texto; }).map(function (p) { return [p.id, p.nombre]; }).concat([['__libre', 'Escribir mensaje propio']]));
    const txt = campo('Mensaje. Variables: {nombre} {link} {archivo}', 'area'); txt.rows = 6;
    const link = campo('Link (reemplaza {link})', 'url');
    const arch = campo('Archivo a adjuntar (nombre en Drive o link)');
    const prev = el('div');
    const resolver = function (c) { return armarTexto({ texto: txt.value }, { nombre: nombreSinNumero(c.nombre) }).replace(/\{link\}/g, link.value.trim()).replace(/\{archivo\}/g, arch.value.trim()); };
    const pintarPrev = function () {
      prev.textContent = '';
      const falta = /\{[a-z]+\}/i;
      dest.forEach(function (c) { const t = resolver(c); const k = el('div', 'card'); k.append(el('strong', null, c.nombre || c.tel), el('p', falta.test(t) ? 'plazo atrasado' : null, t)); prev.append(k); });
    };
    const cargar = function () { const p = PLANTILLAS.find(function (x) { return x.id === sp.value; }); txt.value = p ? p.texto.replace(/\{vendedor\}/g, 'Facundo') : ''; pintarPrev(); };
    sp.onchange = cargar; [txt, link, arch].forEach(function (x) { x.oninput = pintarPrev; });
    cargar();
    v.cuerpo.append(sp, txt, link, arch, el('p', 'suave', 'Vista previa por destinatario (en rojo si queda una variable sin completar):'), prev,
      boton('📤 Enviar pedido a VENTAS (envío múltiple)', async function () {
        const textos = dest.map(function (c) { return resolver(c); });
        if (textos.some(function (t) { return /\{[a-z]+\}/i.test(t); })) { aviso('Quedan variables sin completar'); return; }
        await api('pedido', { chat: 'VENTAS REDCONAR', tipo: 'SEGUIMIENTO', prioridad: 'alta', contacto: 'ENVIO MULTIPLE ' + dest.length, telefono: '', email: '', clientifyId: '',
          detalle: 'ENVIO MULTIPLE POR WHATSAPP WEB (PC). Mandar a cada destinatario SU texto (ya con variables resueltas). Si hay archivo, adjuntarlo antes del texto: ' + (arch.value.trim() || 'sin archivo') + '. Link incluido: ' + (link.value.trim() || 'sin link') + '. Un envío por contacto, pausa entre envíos, y registrar cada uno en Log_Actividades. Si algo no coincide, no enviar y avisar.\n' +
            dest.map(function (c, i) { return (i + 1) + ') ' + (c.nombre || '') + ' | ' + c.tel + ' | ' + textos[i].replace(/\n/g, ' // '); }).join('\n') });
        invalidarInicio(); aviso('Pedido de envío múltiple dejado a VENTAS'); v.cerrar(); m.cerrar();
      }));
  }

  m.cuerpo.append(info, boton('🔄 Pedir actualización de chats', async function () { const x = await api('repasoWA'); invalidarInicio(); aviso('Pedido dejado a VENTAS (' + x.pedidoEn + ')'); }, 'sec'), bModo, buscar, zona, barra);
  pintar();
}
