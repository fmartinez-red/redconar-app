/* v16: configuración completa, panel simple y ordenable, deslizar a WhatsApp, semana. */

const CLAVE_CFG = 'redconar_cfg16';
const DIAS_N = [[1, 'Lunes'], [2, 'Martes'], [3, 'Miércoles'], [4, 'Jueves'], [5, 'Viernes'], [6, 'Sábado'], [0, 'Domingo']];
const BLOQUES = [['nuevos', '🆕 Traer nuevos'], ['buscar', '🔍 Buscador'], ['contadores', '🔢 Contadores'], ['atajos', '⚡ Atajos'], ['novedades', '📬 Novedades'], ['gestionados', '✔ Gestionados']];
const CFG_BASE = {
  jornada: { dias: { 1: [9, 18], 2: [9, 18], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: null, 0: null }, libres: [] },
  reporte: { activo: true, hora: 9, mail: true, ntfy: true },
  panel: { orden: ['nuevos', 'buscar', 'contadores', 'atajos'], ocultos: ['novedades', 'gestionados'] },
  plantillas: null,
  swipe: 'lead-magnet'
};
const PLANT_ORIGINAL = PLANTILLAS.map(function (p) { return Object.assign({}, p); });

function cfg() { return Object.assign({}, CFG_BASE, leerLocal(CLAVE_CFG, {})); }
function aplicarPlantillas() {
  const c = cfg();
  const base = (c.plantillas && c.plantillas.length) ? c.plantillas : PLANT_ORIGINAL;
  PLANTILLAS.splice(0, PLANTILLAS.length);
  base.forEach(function (p) { PLANTILLAS.push(p); });
}
async function bajarCfg() {
  try {
    const r = await api('cfgGet');
    const c = cfg();
    const n = Object.assign({}, c, r.cfg || {});
    guardarLocal(CLAVE_CFG, n);
    aplicarPlantillas();
  } catch (e) { aplicarPlantillas(); }
}
async function guardarCfg(parcial) {
  const n = Object.assign({}, cfg(), parcial);
  guardarLocal(CLAVE_CFG, n);
  aplicarPlantillas();
  try { await api('cfgSet', parcial); } catch (e) { aviso('Guardado en el teléfono. No se pudo guardar en el servidor.'); return; }
  aviso('Guardado');
}

/* ---------- deslizar a la derecha: WhatsApp con plantilla ---------- */
const filaContactoOrig = filaContacto;
filaContacto = function (c, alTocar, casilla) {
  const k = filaContactoOrig(c, alTocar, casilla);
  let x0 = 0, y0 = 0;
  k.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  k.addEventListener('touchend', function (e) {
    const t = e.changedTouches[0];
    if (t.clientX - x0 > 90 && Math.abs(t.clientY - y0) < 40) deslizarWA(c);
  }, { passive: true });
  return k;
};
function deslizarWA(c) {
  const wa = waNumero(c.telefono);
  if (!wa) { aviso('Sin teléfono'); return; }
  const id = cfg().swipe;
  const p = PLANTILLAS.find(function (x) { return x.id === id; }) || PLANTILLAS[0];
  const txt = armarTexto(p, { nombre: c.nombre || '' });
  window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(txt), '_blank');
  api('gestion', { nombre: c.nombre, apellido: c.apellido || '', empresa: c.empresa, telefono: c.telefono, id: c.id, tipo: c.tipo, mensaje: 'WhatsApp: ' + txt, respuesta: '', proximo: 'Esperar respuesta', fechaProximo: ddmmyyyy(3), etapa: 'Contactado' }).then(function () { invalidarInicio(); aviso('Registrado como Contactado'); }).catch(function () { });
}

/* ---------- semana ---------- */
async function popupSemana(s) {
  const m = abrirModal(s ? '🆕 Semana anterior' : '🆕 Esta semana', el('p', 'suave', 'Cargando...'));
  let r;
  try { r = await api('semana', { semana: s }); } catch (e) { m.cuerpo.lastChild.textContent = 'No se pudo cargar: ' + e.message; return; }
  m.cuerpo.lastChild.remove();
  m.cuerpo.append(el('p', 'suave', r.items.length + ' contactos de Clientify, ' + r.sin + ' sin gestionar. ' + (r.aviso || '')));
  const sin = r.items.filter(function (x) { return !x.gestionado; });
  m.cuerpo.append(boton('🔎 Cruzar con WhatsApp (' + r.items.length + ')', async function () {
    await api('pedido', {
      chat: 'VENTAS REDCONAR', tipo: 'SEGUIMIENTO', prioridad: 'alta', contacto: 'CRUCE WHATSAPP SEMANA ' + r.items.length, telefono: '', email: '', clientifyId: '',
      detalle: 'Cruzar con WhatsApp Web estos contactos de Clientify (leer solo estos chats). Informar quiénes respondieron y quiénes no, registrar en Log_Actividades y Base Viva.\n' +
        r.items.map(function (x) { return '- ' + (x.nombre || x.empresa) + ' | ' + x.telefono + ' | ' + (x.gestionado ? 'gestionado' : 'SIN GESTIONAR'); }).join('\n')
    });
    aviso('Pedido enviado a VENTAS');
  }));
  (sin.length ? sin : r.items).forEach(function (x) { m.cuerpo.append(filaContacto(x, function () { popupContacto({ fila: x.fila }); })); });
}
function popupTraer() {
  const m = abrirModal('🆕 Traer nuevos', null);
  [['📅 Hoy / últimos días', popupNuevos], ['🗓 Esta semana', function () { popupSemana(0); }], ['⏮ Semana anterior', function () { popupSemana(1); }]].forEach(function (b) {
    m.cuerpo.append(boton(b[0], function () { m.cerrar(); b[1](); }, 'grande'));
  });
}

/* ---------- panel simple ---------- */
async function vistaPanel() {
  vista.textContent = '';
  vista.append(titulo('¡Hola, Facu! 👋'));
  const c = cfg();
  const cont = el('div');
  const hechos = {};
  hechos.nuevos = function () { return boton('🆕 Traer nuevos', popupTraer, 'grande'); };
  hechos.buscar = function () {
    const q = campo('🔍 Buscar contacto', 'search');
    q.id = 'g-buscar';
    q.onkeydown = function (e) { if (e.key === 'Enter' && q.value.trim().length >= 3) popupBuscar(q.value.trim()); };
    return q;
  };
  hechos.atajos = function () {
    const a = el('div', 'atajos');
    a.id = 'g-acc';
    a.append(atajo('➕', 'Nuevo', popupNuevoContacto), atajo('📤', 'Pedido', popupPedido), atajo('💬', 'Chats', popupChats), atajo('⚙️', 'Config', function () { irA('MÁS'); }));
    return a;
  };
  hechos.novedades = function () {
    const nov = el('div', 'atajos');
    nov.append(atajo('✉️', 'Mail', function () { popupNovedad('mail'); }), atajo('📆', 'Agenda', function () { popupNovedad('agenda'); }), atajo('📁', 'Drive', function () { popupNovedad('drive'); }), atajo('📱', 'WhatsApp', popupWA));
    return nov;
  };
  hechos.gestionados = function () { return bloqueGestionados(); };
  hechos.contadores = function () {
    const g = el('div', 'grid2');
    g.id = 'g-num';
    datosInicio(false).then(function (d) {
      g.append(
        tarjetaNum(d.agenda.vencidos.length, '⏰', 'Atrasados', function () { popupTareas('vencidos'); }, true),
        tarjetaNum(d.agenda.hoy.length, '📅', 'Para hoy', function () { popupTareas('hoy'); })
      );
      const pend = CHATS.reduce(function (s, x) { return s + ((d.chats[x] || { pendientes: [] }).pendientes.length); }, 0);
      g.append(tarjetaNum(pend, '💬', 'Pedidos en chats', popupChats));
      api('semana', { semana: 0 }).then(function (r) { g.append(tarjetaNum(r.sin, '🆕', 'Sin gestionar Clientify', function () { popupSemana(0); }, r.sin > 0)); }).catch(function () { });
    }).catch(function (e) { g.append(vacio('No se pudo cargar: ' + e.message)); });
    return g;
  };
  c.panel.orden.filter(function (b) { return c.panel.ocultos.indexOf(b) < 0 && hechos[b]; }).forEach(function (b) { cont.append(hechos[b]()); });
  vista.append(cont);
}

/* ---------- configuración completa ---------- */
function seccionCfg(titulo_, cuerpo) {
  const d = el('details', 'cfg-sec');
  d.append(el('summary', null, titulo_), cuerpo);
  return d;
}
function cfgJornada() {
  const c = cfg().jornada;
  const caja = el('div');
  const filas = {};
  DIAS_N.forEach(function (d) {
    const r = c.dias[d[0]];
    const f = el('div', 'fila');
    const on = el('input'); on.type = 'checkbox'; on.checked = !!r;
    const h1 = el('input'); h1.type = 'number'; h1.min = 0; h1.max = 23; h1.value = r ? r[0] : 9; h1.style.width = '56px';
    const h2 = el('input'); h2.type = 'number'; h2.min = 1; h2.max = 24; h2.value = r ? r[1] : 18; h2.style.width = '56px';
    f.append(on, el('strong', null, d[1]), el('span', null, 'de'), h1, el('span', null, 'a'), h2);
    filas[d[0]] = [on, h1, h2];
    caja.append(f);
  });
  caja.append(el('p', 'suave', 'Feriados / días libres (uno por línea, AAAA-MM-DD)'));
  const lib = campo('2026-11-23', 'area', (c.libres || []).join('\n'));
  lib.rows = 4;
  caja.append(lib, boton('Guardar jornada', function () {
    const dias = {};
    DIAS_N.forEach(function (d) { const x = filas[d[0]]; dias[d[0]] = x[0].checked ? [Number(x[1].value), Number(x[2].value)] : null; });
    return guardarCfg({ jornada: { dias: dias, libres: lib.value.split(/\s+/).filter(function (z) { return /^\d{4}-\d{2}-\d{2}$/.test(z); }) } });
  }));
  return caja;
}
function cfgReporte() {
  const r = cfg().reporte;
  const caja = el('div');
  const act = el('input'); act.type = 'checkbox'; act.checked = r.activo !== false;
  const hora = el('input'); hora.type = 'number'; hora.min = 0; hora.max = 23; hora.value = r.hora; hora.style.width = '56px';
  const mail = el('input'); mail.type = 'checkbox'; mail.checked = r.mail !== false;
  const nt = el('input'); nt.type = 'checkbox'; nt.checked = r.ntfy !== false;
  [[act, 'Reporte diario activo (solo días laborales)'], [mail, 'Por mail (llega a tu Gmail del teléfono)'], [nt, 'Por ntfy']].forEach(function (p) { const f = el('label', 'fila'); f.append(p[0], el('span', null, p[1])); caja.append(f); });
  const fh = el('label', 'fila'); fh.append(el('span', null, 'Hora'), hora); caja.append(fh);
  caja.append(el('p', 'suave', 'Ejemplo: "Hoy tenés 5 contactos sin gestionar de Clientify".'),
    boton('Guardar reporte', function () { return guardarCfg({ reporte: { activo: act.checked, hora: Number(hora.value), mail: mail.checked, ntfy: nt.checked } }); }),
    boton('Mandar reporte ahora', async function () { const x = await api('reporteYa'); aviso(x.texto || 'Enviado'); }, 'sec'));
  return caja;
}
function cfgPanel() {
  const p = cfg().panel;
  let orden = p.orden.concat(BLOQUES.map(function (b) { return b[0]; }).filter(function (b) { return p.orden.indexOf(b) < 0; }));
  const ocultos = p.ocultos.slice();
  const caja = el('div');
  const dibujar = function () {
    caja.textContent = '';
    orden.forEach(function (id, i) {
      const nom = BLOQUES.find(function (b) { return b[0] === id; })[1];
      const f = el('div', 'fila');
      const v = el('input'); v.type = 'checkbox'; v.checked = ocultos.indexOf(id) < 0;
      v.onchange = function () { const j = ocultos.indexOf(id); if (v.checked && j >= 0) ocultos.splice(j, 1); if (!v.checked && j < 0) ocultos.push(id); };
      const sube = el('button', 'btn sec', '↑'); sube.onclick = function () { if (i > 0) { orden.splice(i - 1, 0, orden.splice(i, 1)[0]); dibujar(); } };
      const baja = el('button', 'btn sec', '↓'); baja.onclick = function () { if (i < orden.length - 1) { orden.splice(i + 1, 0, orden.splice(i, 1)[0]); dibujar(); } };
      f.append(v, el('strong', null, nom), sube, baja);
      caja.append(f);
    });
    caja.append(boton('Guardar panel', function () { return guardarCfg({ panel: { orden: orden, ocultos: ocultos } }); }));
  };
  dibujar();
  return caja;
}
function cfgPlantillas() {
  const caja = el('div');
  let lista_ = PLANTILLAS.map(function (p) { return Object.assign({}, p); });
  const dibujar = function () {
    caja.textContent = '';
    lista_.forEach(function (p, i) {
      const b = el('div', 'fila');
      const col = el('div'); col.style.flex = '1';
      const n = campo('Nombre', 'text', p.nombre); n.oninput = function () { p.nombre = n.value; };
      const w = campo('Cuándo se usa', 'text', p.cuando || ''); w.oninput = function () { p.cuando = w.value; };
      const t = campo('Texto ({nombre} y {vendedor})', 'area', p.texto); t.rows = 5; t.oninput = function () { p.texto = t.value; };
      const del = el('button', 'btn sec', '🗑'); del.onclick = function () { lista_.splice(i, 1); dibujar(); };
      col.append(n, w, t);
      b.append(col, del);
      caja.append(b);
    });
    caja.append(boton('➕ Nueva plantilla', function () { lista_.push({ id: 'p' + Date.now(), nombre: 'Nueva', cuando: '', texto: 'Hola{nombre}, soy {vendedor} de Redconar. ' }); dibujar(); }, 'sec'));
    const sw = lista(lista_.map(function (p) { return [p.id, p.nombre]; }), cfg().swipe);
    caja.append(el('p', 'suave', 'Plantilla al deslizar un contacto a la derecha'), sw);
    caja.append(boton('Guardar plantillas', function () { return guardarCfg({ plantillas: lista_, swipe: sw.value }); }),
      boton('Volver a las originales', function () { return guardarCfg({ plantillas: null, swipe: 'lead-magnet' }).then(function () { vistaAjustes(); }); }, 'sec'));
  };
  dibujar();
  return caja;
}

window.vistaAjustesViejo = window.vistaAjustesViejo || null;
async function vistaAjustesNueva() {
  await vistaAjustesViejo();
  const a = Array.prototype.slice.call(vista.children);
  const cab = a.shift();
  vista.textContent = '';
  vista.append(cab);
  const cfgBox = el('div');
  cfgBox.append(
    seccionCfg('🕘 Jornada y feriados', cfgJornada()),
    seccionCfg('🔔 Reporte diario', cfgReporte()),
    seccionCfg('🏠 Panel: orden y visibilidad', cfgPanel()),
    seccionCfg('📋 Plantillas', cfgPlantillas())
  );
  vista.append(cfgBox);
  a.forEach(function (x) { vista.append(x); });
}
