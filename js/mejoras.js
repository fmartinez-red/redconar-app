/* v13: temperatura con colores, CONTACTOS con bases/orden/filtros, "Traer nuevos", acciones rápidas. */

/* ---------- temperatura y etiquetas ---------- */
function tempDe(estado, tipo) {
  const e = String(estado || '').toLowerCase().trim(), t = String(tipo || '').toLowerCase();
  const nombre = String(estado || '').trim();
  if (/muy.?caliente/.test(e)) return ['cal2', '🔥🔥 Muy caliente'];
  if (/caliente/.test(e)) return ['cal', '🔥 Caliente'];
  if (/tibio/.test(e)) return ['tib', '🟠 Tibio'];
  if (/fr[ií]o/.test(e)) return ['fri', '🧊 Frío'];
  if (/^nuevo/.test(e)) return ['nue', '🆕 Nuevo'];
  if (/cliente|activo|ganad/.test(e) || /cliente actual/.test(t)) return ['cli', '✅ Cliente'];
  if (/nurtur/.test(e)) return ['nur', '🌱 Nurturing'];
  if (/retomar|reflotar/.test(e)) return ['ret', '🔄 Retomar'];
  if (/descart|irrelev|no visible/.test(e)) return ['des', '⚫ Descartado'];
  if (!nombre || /neutro|sin clasificar/.test(e)) return ['sin', '⚪ Sin clasificar'];
  return ['otro', nombre];
}
function chipTemp(estado, tipo) { const t = tempDe(estado, tipo); return el('span', 't-chip t-' + t[0], t[1]); }
function chipsBases(fuentes, max) {
  return String(fuentes || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, max || 2)
    .map(function (x) { return el('span', 't-chip t-base', '📍 ' + x.replace(/_/g, ' ')); });
}
function ddmmyyyy(sumaDias) {
  const d = new Date(Date.now() + sumaDias * 86400000);
  return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
}
function nombreDe(c) { return (c.nombre + ' ' + (c.apellido || '')).trim() || c.empresa || 'Sin nombre'; }

/** Fila de contacto con borde de color, etiquetas y botón rápido de WhatsApp. */
function filaContacto(c, alTocar, casilla) {
  const t = tempDe(c.estado, c.tipo);
  const k = el('div', 'fila b-' + t[0]);
  if (casilla) k.append(casilla);
  const cen = el('div', 'tocable');
  cen.append(el('strong', null, nombreDe(c)));
  const sub = [c.empresa && c.nombre ? c.empresa : '', c.telefono].filter(Boolean).join(' · ');
  if (sub) cen.append(el('p', 'suave', sub));
  const chips = el('p', 'chips');
  chips.append(chipTemp(c.estado, c.tipo));
  chipsBases(c.fuentes, 2).forEach(function (x) { chips.append(x); });
  if (c.ufSistema) chips.append(el('span', 't-chip t-uf', c.ufSistema + ' UF'));
  if (c.gest) chips.append(el('span', 't-chip t-uf', '✔ gestionado'));
  cen.append(chips);
  cen.onclick = alTocar;
  k.append(cen);
  const wa = waNumero(c.telefono);
  if (wa) { const a = el('a', 'wa-mini', '💬'); a.href = 'https://wa.me/' + wa; a.target = '_blank'; a.rel = 'noopener'; k.append(a); }
  return k;
}

/* ---------- CONTACTOS ---------- */
const CLAVE_BASE = 'redconar_base';
const ORDENES = [['nombre', 'Nombre A-Z'], ['ultimo', 'Último contacto'], ['temp', 'Temperatura'], ['uf', 'UF (mayor primero)'], ['sin', 'Sin gestionar primero']];
const ORDEN_TEMP = { cal2: 0, cal: 1, tib: 2, nue: 3, nur: 4, ret: 5, fri: 6, cli: 7, sin: 8, otro: 9, des: 10 };

function fechaNum(s) {
  const m = String(s || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return +(m[3] + ('0' + m[2]).slice(-2) + ('0' + m[1]).slice(-2));
  const n = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  return n ? +(n[1] + n[2] + n[3]) : 0;
}
function ufNum(s) { const m = String(s || '').match(/\d+/g); return m ? Math.max.apply(null, m.map(Number)) : 0; }

vistaBuscar = async function () {
  vista.textContent = '';
  vista.append(titulo('👥 Contactos'));
  const base = leerLocal(CLAVE_BASE, '');
  if (base) return vistaBase(base);

  vista.append(boton('🆕 Traer nuevos (mails + Clientify)', popupNuevos, 'grande'), boton('➕ Nuevo contacto (pegar texto o foto)', popupNuevoContacto, 'sec'));
  const q = campo('🔍 Buscar por nombre, empresa, mail o teléfono', 'search');
  q.onkeydown = function (e) { if (e.key === 'Enter' && q.value.trim().length >= 3) popupBuscar(q.value.trim()); };
  vista.append(q, el('p', 'suave', 'O elegí una base (lista) para trabajarla:'));
  const caja = el('div', 'pills wrap');
  caja.append(el('p', 'suave', 'Cargando bases...'));
  vista.append(caja);
  let r;
  try { r = await api('bases'); } catch (e) { caja.textContent = 'No se pudieron cargar las bases: ' + e.message + '. Falta publicar la hoja nueva (te guío).'; return; }
  caja.textContent = '';
  r.fuentes.slice(0, 40).forEach(function (par) {
    const b = el('button', 'pill', par[0].replace(/_/g, ' '));
    b.append(el('small', null, String(par[1])));
    b.onclick = function () { guardarLocal(CLAVE_BASE, par[0]); vistaBuscar(); };
    caja.append(b);
  });
};

async function vistaBase(fuente) {
  const cab = el('div', 'cab-base');
  cab.append(el('strong', null, '📍 ' + fuente.replace(/_/g, ' ')));
  const cambiar = el('button', 'btn', '✕ Cambiar base');
  cambiar.onclick = function () { borrarLocal(CLAVE_BASE); vistaBuscar(); };
  cab.append(cambiar);
  vista.append(cab);
  const estado = el('p', 'suave', 'Cargando contactos...');
  vista.append(estado);
  let r;
  try { r = await api('lista', { fuente: fuente }); } catch (e) { estado.textContent = 'No se pudo cargar: ' + e.message; return; }
  estado.remove();
  const S = { temp: '', orden: leerLocal('redconar_orden', 'nombre'), q: '', sin: false, max: 60 };
  const items = r.items;

  const buscador = campo('Filtrar dentro de esta base...', 'search');
  const orden = lista(ORDENES, S.orden);
  const pills = el('div', 'pills');
  const sinG = el('button', 'pill', '🕐 Solo sin gestionar');
  const resumen = el('p', 'suave');
  const lst = el('div');
  vista.append(buscador, pills, orden, resumen, lst);

  const tempsPresentes = {};
  items.forEach(function (c) { const t = tempDe(c.estado, c.tipo); tempsPresentes[t[0]] = t; tempsPresentes[t[0]].n = (tempsPresentes[t[0]].n || 0) + 1; });

  function dibujarPills() {
    pills.textContent = '';
    const todo = el('button', 'pill' + (!S.temp && !S.sin ? ' on' : ''), 'Todos');
    todo.append(el('small', null, String(items.length)));
    todo.onclick = function () { S.temp = ''; S.sin = false; pintar(); };
    pills.append(todo);
    Object.keys(tempsPresentes).sort(function (a, b) { return ORDEN_TEMP[a] - ORDEN_TEMP[b]; }).forEach(function (k) {
      const b = el('button', 'pill' + (S.temp === k ? ' on' : ''), tempsPresentes[k][1]);
      b.append(el('small', null, String(tempsPresentes[k].n)));
      b.onclick = function () { S.temp = S.temp === k ? '' : k; pintar(); };
      pills.append(b);
    });
    sinG.className = 'pill' + (S.sin ? ' on' : '');
    sinG.onclick = function () { S.sin = !S.sin; pintar(); };
    pills.append(sinG);
  }

  function pintar() {
    dibujarPills();
    const q = S.q.toLowerCase();
    let l = items.filter(function (c) {
      if (S.temp && tempDe(c.estado, c.tipo)[0] !== S.temp) return false;
      if (S.sin && c.gest) return false;
      if (q && [c.nombre, c.apellido, c.empresa, c.email, c.telefono].join(' ').toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    const o = S.orden;
    l.sort(function (a, b) {
      if (o === 'ultimo') return fechaNum(b.ultimoContacto) - fechaNum(a.ultimoContacto);
      if (o === 'temp') return ORDEN_TEMP[tempDe(a.estado, a.tipo)[0]] - ORDEN_TEMP[tempDe(b.estado, b.tipo)[0]];
      if (o === 'uf') return ufNum(b.ufSistema) - ufNum(a.ufSistema);
      if (o === 'sin') return (a.gest ? 1 : 0) - (b.gest ? 1 : 0) || nombreDe(a).localeCompare(nombreDe(b));
      return nombreDe(a).localeCompare(nombreDe(b));
    });
    resumen.textContent = l.length + ' de ' + items.length + ' contactos' + (r.total > items.length ? ' (se muestran los primeros ' + items.length + ')' : '');
    lst.textContent = '';
    l.slice(0, S.max).forEach(function (c) { lst.append(filaContacto(c, function () { popupContacto({ fila: c.fila }); })); });
    if (l.length > S.max) { const m = boton('Ver más (' + (l.length - S.max) + ')', function () { S.max += 60; pintar(); }, 'sec'); lst.append(m); }
    if (!l.length) lst.append(vacio('Ningún contacto con ese filtro.'));
  }
  buscador.oninput = function () { S.q = buscador.value; S.max = 60; pintar(); };
  orden.onchange = function () { S.orden = orden.value; guardarLocal('redconar_orden', S.orden); pintar(); };
  pintar();
}

/* ---------- TRAER NUEVOS ---------- */
async function popupNuevos() {
  const dias = lista([['1', 'Último día'], ['3', 'Últimos 3 días'], ['7', 'Última semana']], leerLocal('redconar_nuevos_dias', '3'));
  const cuerpo = el('div');
  const m = abrirModal('🆕 Nuevos para gestionar', el('div'));
  m.cuerpo.lastChild.append(dias, cuerpo);

  async function cargar() {
    guardarLocal('redconar_nuevos_dias', dias.value);
    cuerpo.textContent = '';
    cuerpo.append(el('p', 'suave', 'Buscando en tu mail y en Clientify...'));
    let r;
    try { r = await api('nuevos', { dias: Number(dias.value) }); } catch (e) { cuerpo.textContent = 'No se pudo: ' + e.message + '. Falta publicar la hoja nueva (te guío).'; return; }
    cuerpo.textContent = '';
    const sinLeer = r.mails.filter(function (x) { return !x.leido; });
    cuerpo.append(el('h2', null, '📧 Entraron por mail (' + r.mails.length + ')'));
    if (!r.mails.length) cuerpo.append(vacio('No entró nada por formularios en este período.'));
    r.mails.forEach(function (x) {
      const k = el('div', 'fila tocable b-' + (x.fila ? 'cli' : 'nue') + (x.leido ? '' : ' nuevo-no-leido'));
      const c = el('div');
      c.append(el('strong', null, x.nombre || x.asunto));
      c.append(el('p', 'suave', [x.fecha, x.email, x.telefono].filter(Boolean).join(' · ')));
      const ch = el('p', 'chips');
      ch.append(el('span', 't-chip ' + (x.fila ? 't-cli' : 't-nue'), x.fila ? '✅ ya en Base Viva' : '🆕 contacto nuevo'));
      if (!x.leido) ch.append(el('span', 't-chip t-tib', 'sin leer'));
      c.append(ch);
      k.append(c, el('span', 'flecha', '›'));
      k.onclick = function () { if (x.fila) popupContacto({ fila: x.fila }); else popupLeadMail(x); };
      cuerpo.append(k);
    });
    if (sinLeer.length) cuerpo.append(boton('✓ Marcar ' + sinLeer.length + ' mails como leídos', async function () {
      await api('mailLeer', { ids: sinLeer.map(function (x) { return x.id; }) });
      aviso('Marcados como leídos'); cargar();
    }, 'sec'));
    cuerpo.append(el('h2', null, '🌐 Nuevos en Clientify sin gestionar (' + r.clientify.length + ')'));
    if (!r.clientify.length) cuerpo.append(vacio('No hay contactos nuevos de Clientify pendientes.'));
    r.clientify.forEach(function (c) { cuerpo.append(filaContacto(c, function () { popupContacto({ fila: c.fila }); })); });
  }
  dias.onchange = cargar;
  cargar();
}

function popupLeadMail(x) {
  const f = { nombre: x.nombre || '', apellido: '', empresa: '', telefono: x.telefono || '', email: x.email || '', estado: 'Nuevo', tipo: '', id: '' };
  const nombre = x.nombre || x.asunto;
  const m = abrirModal(nombre);
  const c = m.cuerpo;
  const ch = el('p', 'chips');
  ch.append(el('span', 't-chip t-nue', '🆕 Nuevo'), el('span', 't-chip t-base', '📍 Mail ' + x.fecha));
  c.append(ch, el('p', 'suave', x.texto));
  const acc = el('div', 'acciones');
  if (x.telefono) acc.append(enlace('📞 Llamar', 'tel:+' + waNumero(x.telefono)));
  if (x.email) acc.append(enlace('✉️ Mail', 'mailto:' + x.email));
  acc.append(enlace('📨 Abrir mail', x.url));
  c.append(acc);
  const zona = el('div');
  const abrir = function (n) { zona.textContent = ''; zona.append(n); n.scrollIntoView({ block: 'nearest' }); };
  c.append(boton('💬 WhatsApp con plantilla', function () { abrir(bloqueWhatsApp(f)); }, 'wa'),
    boton('📤 Pedido a VENTAS (cargar en Base/Clientify)', function () { abrir(formPedido(f, nombre, 'VENTAS REDCONAR', m.cerrar)); }, 'sec'),
    boton('➕ Cargar en Base Viva', async function () { const r = await api('contactoNuevo', { nombre: x.nombre, telefono: x.telefono, email: x.email, fuente: 'Formulario mail', notas: x.texto.slice(0, 200) }); invalidarInicio(); aviso(r.existia ? 'Ya estaba en la base' : 'Cargado en Base Viva'); m.cerrar(); popupContacto({ fila: r.fila }); }, 'sec'),
    boton('✓ Marcar mail leído', async function () { await api('mailLeer', { ids: [x.id] }); aviso('Leído'); }, 'sec'), zona);
}

/* ---------- ficha rápida con más acciones ---------- */
const ESTADOS_RAPIDOS = [['🧊 Frío', 'frio', '#0ea5e9'], ['🟠 Tibio', 'tibio', '#f59e0b'], ['🔥 Caliente', 'caliente', '#ef4444'], ['✅ Cliente', 'cliente', '#16a34a'], ['⚫ Descartar', 'descartado', '#64748b']];
const ETAPAS = ['Contactado', 'Sin respuesta', 'Respondió', 'Demo agendada', 'Demo hecha', 'Presupuesto enviado', 'Cliente', 'Descartado'];
const COLOR_ETAPA = { 'Contactado': '#2563eb', 'Sin respuesta': '#64748b', 'Respondió': '#16a34a', 'Demo agendada': '#8b5cf6', 'Demo hecha': '#7c3aed', 'Presupuesto enviado': '#f59e0b', 'Cliente': '#15803d', 'Descartado': '#475569' };
const GESTIONES_RAPIDAS = [
  ['😶 Sin respuesta', 'Sin respuesta', 3, '#64748b', 'Sin respuesta'],
  ['💬 Respondió', 'Respondió por WhatsApp', 2, '#16a34a', 'Respondió'],
  ['📞 Llamé', 'Llamada realizada', 2, '#2563eb', 'Contactado'],
  ['📅 Pidió demo', 'Pidió demo / reunión', 1, '#8b5cf6', 'Demo agendada'],
  ['🔁 Volver a escribir', 'Volver a contactar', 7, '#f59e0b', 'Contactado']
];

popupContacto = async function (ref) {
  const m = abrirModal('Contacto', el('p', 'suave', 'Cargando...'));
  let r;
  try { r = await api('contacto', { fila: ref.fila, tel: ref.telefono || ref.tel }); } catch (e) { m.cuerpo.lastChild.textContent = 'No se pudo cargar: ' + e.message; return; }
  m.cuerpo.lastChild.remove();
  const f = r.ficha || { nombre: ref.nombre || '', apellido: '', empresa: ref.empresa || '', telefono: ref.telefono || ref.tel || '', email: '', estado: '', tipo: ref.tipo || '', id: '' };
  const nombre = nombreDe(f);
  m.cuerpo.querySelector('.modal-cab strong').textContent = nombre;

  const chips = el('p', 'chips');
  const tchip = chipTemp(f.estado, f.tipo);
  chips.append(tchip);
  chipsBases(f.fuentes, 3).forEach(function (x) { chips.append(x); });
  if (f.etiqueta) chips.append(el('span', 't-chip t-base', '🏷 ' + f.etiqueta));
  if (f.ufSistema) chips.append(el('span', 't-chip t-uf', f.ufSistema + ' UF'));
  if (f.ufPotencial) chips.append(el('span', 't-chip t-uf', 'Potencial ' + f.ufPotencial));
  m.cuerpo.append(chips);
  if (f.empresa && f.nombre) m.cuerpo.append(el('p', 'suave', f.empresa));
  [['Último contacto', f.ultimoContacto], ['Próximo paso', f.proximoPaso], ['Notas', (f.notas || '').slice(0, 300)]].forEach(function (par) { const p = filaDato(par[0], par[1]); if (p) m.cuerpo.append(p); });

  const wa = waNumero(f.telefono);
  const acc = el('div', 'acciones');
  if (wa) acc.append(enlace('📞 Llamar', 'tel:+' + wa));
  if (f.email) acc.append(enlace('✉️ Mail', 'mailto:' + f.email));
  if (acc.children.length) m.cuerpo.append(acc);

  if (f.fila) {
    m.cuerpo.append(el('p', 'suave', 'Temperatura (un toque):'));
    const fila1 = el('div', 'rapidas');
    ESTADOS_RAPIDOS.forEach(function (e) {
      const b = el('button', 'rapida', e[0]);
      b.style.background = e[2];
      b.onclick = async function () {
        b.disabled = true;
        try { await api('estado', { fila: f.fila, estado: e[1] }); const n = chipTemp(e[1], ''); tchip.className = n.className; tchip.textContent = n.textContent; invalidarInicio(); aviso('Marcado: ' + e[0]); }
        catch (x) { aviso('No se pudo: ' + x.message); }
        b.disabled = false;
      };
      fila1.append(b);
    });
    m.cuerpo.append(fila1, el('p', 'suave', 'Registrar gestión (un toque):'));
    const fila2 = el('div', 'rapidas');
    GESTIONES_RAPIDAS.forEach(function (g) {
      const b = el('button', 'rapida', g[0]);
      b.style.background = g[3];
      b.onclick = async function () {
        b.disabled = true;
        try {
          await api('gestion', { nombre: f.nombre, apellido: f.apellido, empresa: f.empresa, telefono: f.telefono, id: f.id, tipo: f.tipo, mensaje: g[1], respuesta: '', proximo: 'Seguimiento', fechaProximo: ddmmyyyy(g[2]), etapa: g[4] });
          invalidarInicio(); aviso('Registrado: ' + g[1] + ' (próximo en ' + g[2] + ' días)');
        } catch (x) { aviso('No se pudo: ' + x.message); }
        b.disabled = false;
      };
      fila2.append(b);
    });
    m.cuerpo.append(fila2);
  }

  const zona = el('div');
  const abrir = function (nodo) { zona.textContent = ''; zona.append(nodo); nodo.scrollIntoView({ block: 'nearest' }); };
  m.cuerpo.append(boton('💬 WhatsApp con plantilla', function () { abrir(bloqueWhatsApp(f)); }, 'wa'),
    boton('📝 Registrar gestión con detalle', function () { abrir(formGestion(f, nombre)); }, 'sec'),
    boton('📤 Pedido a un chat', function () { abrir(formPedido(f, nombre, null, m.cerrar)); }, 'sec'),
    boton('📂 Ver ficha completa', function () { m.cerrar(); abrirFichaCompleta(ref); }, 'sec'), zona);
};

/* búsqueda del panel: mismas etiquetas de color */
popupBuscar = async function (texto) {
  const m = abrirModal('🔍 ' + texto, el('p', 'suave', 'Buscando...'));
  let l;
  try { l = await api('buscar', { q: texto }); } catch (e) { m.cuerpo.lastChild.textContent = e.message; return; }
  m.cuerpo.lastChild.remove();
  if (!l.length) m.cuerpo.append(vacio('Sin resultados.'));
  l.forEach(function (c) { m.cuerpo.append(filaContacto(c, function () { popupContacto({ fila: c.fila }); })); });
};
