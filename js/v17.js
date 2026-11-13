/* v17: sin desplegables, multiselección, deslizar, mantener apretado, panel editable, dictar a Claude. */

/* ---------- tamaño ---------- */
function ajustarTam() {
  const a = leerLocal('redconar_aspecto', {});
  if (!a.texto || a.texto === 17) { a.texto = 15; guardarLocal('redconar_aspecto', a); }
  aplicarApariencia();
}

/* ---------- lista sin desplegable: botón que abre popup ---------- */
lista = function (opciones, valorInicial) {
  const ops = opciones.map(function (o) { return Array.isArray(o) ? o : [o, o]; });
  const b = el('button', 'selector');
  b.type = 'button';
  let val = ops.length ? ops[0][0] : '';
  const texto = function () { const p = ops.find(function (x) { return String(x[0]) === String(val); }); b.textContent = (p ? p[1] : '—') + '  ▾'; };
  Object.defineProperty(b, 'value', { get: function () { return val; }, set: function (v) { val = v; texto(); } });
  if (valorInicial !== undefined) val = valorInicial;
  texto();
  b.onclick = function () {
    const m = abrirModal('Elegí una opción', null);
    m.cuerpo.classList.add('angosto');
    ops.forEach(function (p) {
      const o = el('button', 'opcion' + (String(p[0]) === String(val) ? ' on' : ''), p[1]);
      o.type = 'button';
      o.onclick = function () { val = p[0]; texto(); m.cerrar(); if (b.onchange) b.onchange(); };
      m.cuerpo.append(o);
    });
  };
  return b;
};

/* ---------- datos más limpios en las filas ---------- */
nombreDe = function (c) {
  const lim = function (s) { s = String(s || '').trim(); return /^[-–\s]*$/.test(s) ? '' : s; };
  return (lim(c.nombre) + ' ' + lim(c.apellido)).trim() || lim(c.empresa) || 'Sin nombre';
};
chipsBases = function (fuentes) {
  const l = String(fuentes || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
  if (l.length < 2) return [];
  const c = el('span', 't-chip t-base', 'ⓘ ' + l.length);
  c.onclick = function (e) {
    e.stopPropagation();
    const m = abrirModal('Está en estas listas', null);
    m.cuerpo.classList.add('angosto');
    l.forEach(function (x) { m.cuerpo.append(el('p', 'fila', '📍 ' + x.replace(/_/g, ' '))); });
  };
  return [c];
};

/* ---------- selección múltiple ---------- */
const SEL = new Map();
function claveSel(c) { return String(c.fila || c.telefono || c.nombre); }
function barraSel() {
  let b = document.getElementById('barra-sel');
  if (!SEL.size) { if (b) b.remove(); return; }
  if (!b) { b = el('div'); b.id = 'barra-sel'; document.body.append(b); }
  b.textContent = '';
  b.append(el('strong', null, SEL.size + ' elegidos'));
  const bt = function (t, f) { const x = el('button', 'bs', t); x.onclick = f; b.append(x); };
  bt('💬', masivoWA);
  bt('📤', masivoPedido);
  bt('🏷', masivoEtapa);
  bt('✕', function () { SEL.clear(); document.querySelectorAll('.fila.elegida').forEach(function (k) { k.classList.remove('elegida'); }); barraSel(); });
}
function alternarSel(c, k) {
  const id = claveSel(c);
  if (SEL.has(id)) { SEL.delete(id); k.classList.remove('elegida'); } else { SEL.set(id, c); k.classList.add('elegida'); }
  barraSel();
}
function masivoWA() {
  const m = abrirModal('💬 WhatsApp a ' + SEL.size, null);
  m.cuerpo.classList.add('angosto');
  const sel = lista(PLANTILLAS.map(function (p) { return [p.id, p.nombre]; }), cfg().swipe);
  m.cuerpo.append(sel);
  Array.from(SEL.values()).forEach(function (c) {
    const f = el('div', 'fila');
    const b = el('button', 'btn chico', '💬 Enviar');
    b.onclick = function () { b.textContent = '✔ Abierto'; deslizarWA(c, sel.value); };
    f.append(el('span', null, nombreDe(c)), b);
    m.cuerpo.append(f);
  });
}
function textoCruce(lista_, titulo_) {
  return titulo_ + '\nCruzar con WhatsApp Web solo estos chats. Informar quiénes respondieron y quiénes no, registrar en Log_Actividades y Base Viva (y nota en Clientify). Traerme resumen.\n' +
    lista_.map(function (x) { return '- ' + nombreDe(x) + ' | ' + (x.telefono || '') + ' | ' + (x.estado || ''); }).join('\n');
}
function masivoPedido() {
  const l = Array.from(SEL.values());
  const t = textoCruce(l, 'PEDIDO A VENTAS (' + l.length + ' contactos)');
  popupEnviarClaude('VENTAS REDCONAR', t, l.length + ' contactos');
}
function masivoEtapa() {
  const m = abrirModal('🏷 Etapa para ' + SEL.size, null);
  m.cuerpo.classList.add('angosto');
  ETAPAS.forEach(function (e) {
    const o = el('button', 'opcion', e);
    o.onclick = async function () {
      m.cerrar();
      let n = 0;
      for (const c of Array.from(SEL.values())) {
        try {
          if (c.fila) await api('estado', { fila: c.fila, estado: e });
          else await api('gestion', { nombre: c.nombre, apellido: c.apellido || '', empresa: c.empresa, telefono: c.telefono, id: c.id, tipo: c.tipo, mensaje: 'Etapa: ' + e, respuesta: '', proximo: '', fechaProximo: '', etapa: e });
          n++;
        } catch (x) { /* sigue */ }
      }
      invalidarInicio();
      aviso(n + ' actualizados a ' + e);
    };
    m.cuerpo.append(o);
  });
}

/* ---------- fila: deslizar, mantener apretado ---------- */
filaContacto = function (c, alTocar, casilla) {
  const k = filaContactoOrig(c, function () { if (SEL.size) alternarSel(c, k); else alTocar(); }, casilla);
  k.classList.add('desliza');
  if (SEL.has(claveSel(c))) k.classList.add('elegida');
  let x0 = 0, y0 = 0, dx = 0, timer = null, largo = false, moviendo = false;
  const cancelar = function () { clearTimeout(timer); timer = null; };
  k.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  k.addEventListener('touchstart', function (e) {
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; largo = false; moviendo = false;
    timer = setTimeout(function () { largo = true; if (navigator.vibrate) navigator.vibrate(30); alternarSel(c, k); }, 550);
  }, { passive: true });
  k.addEventListener('touchmove', function (e) {
    const t = e.touches[0];
    dx = t.clientX - x0;
    const dy = t.clientY - y0;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) cancelar();
    if (dx > 10 && Math.abs(dy) < Math.abs(dx)) { moviendo = true; k.style.transform = 'translateX(' + Math.min(dx, 140) + 'px)'; k.classList.toggle('lista-wa', dx > 100); }
  }, { passive: true });
  k.addEventListener('touchend', function (e) {
    cancelar();
    k.style.transform = '';
    k.classList.remove('lista-wa');
    if (moviendo && dx > 100 && !largo) deslizarWA(c);
    if (largo || moviendo) e.preventDefault();
  });
  return k;
};

/* ---------- varias bases a la vez ---------- */
const apiOrig = api;
api = async function (accion, datos) {
  if (accion === 'lista' && datos && String(datos.fuente).indexOf('|') >= 0) {
    const rs = await Promise.all(String(datos.fuente).split('|').map(function (f) { return apiOrig('lista', { fuente: f }); }));
    const vistos = {}, items = [];
    rs.forEach(function (r) { r.items.forEach(function (c) { const id = claveSel(c); if (!vistos[id]) { vistos[id] = 1; items.push(c); } }); });
    return { items: items, total: items.length };
  }
  return apiOrig(accion, datos);
};
vistaBuscar = async function () {
  vista.textContent = '';
  vista.append(titulo('👥 Contactos'));
  const base = leerLocal(CLAVE_BASE, '');
  if (base) return vistaBase(base);
  const q = campo('🔍 Buscar contacto', 'search');
  q.onkeydown = function (e) { if (e.key === 'Enter' && q.value.trim().length >= 3) popupBuscar(q.value.trim()); };
  vista.append(q, boton('🆕 Traer nuevos', popupTraer), el('p', 'suave', 'Elegí una o más listas (tocá para marcar):'));
  const caja = el('div', 'pills wrap');
  caja.append(el('p', 'suave', 'Cargando...'));
  vista.append(caja);
  let r;
  try { r = await api('bases'); } catch (e) { caja.textContent = 'No se pudieron cargar las bases: ' + e.message; return; }
  caja.textContent = '';
  const elegidas = [];
  const abrir = boton('Abrir', function () { guardarLocal(CLAVE_BASE, elegidas.join('|')); vistaBuscar(); });
  abrir.style.display = 'none';
  r.fuentes.slice(0, 60).forEach(function (par) {
    const b = el('button', 'pill', par[0].replace(/_/g, ' '));
    b.append(el('small', null, String(par[1])));
    b.onclick = function () {
      const i = elegidas.indexOf(par[0]);
      if (i >= 0) elegidas.splice(i, 1); else elegidas.push(par[0]);
      b.classList.toggle('on', i < 0);
      abrir.style.display = elegidas.length ? '' : 'none';
      abrir.textContent = 'Abrir ' + elegidas.length + (elegidas.length === 1 ? ' lista' : ' listas');
    };
    caja.append(b);
  });
  vista.append(abrir);
};

/* ---------- enviar a Claude: copiar y abrir el chat ---------- */
async function copiarYAbrir(chat, texto) {
  try { await navigator.clipboard.writeText(texto); } catch (e) { /* sigue */ }
  const url = (leerLocal(CLAVE_URLS, {}) || {})[chat];
  if (url) { window.open(url, '_blank'); aviso('Copiado. Pegalo en el chat.'); }
  else aviso('Copiado. Falta cargar el link de ' + chat + ' en MÁS.');
}
function popupEnviarClaude(chatInicial, texto, resumen) {
  const m = abrirModal('📤 Mandar a Claude', null);
  m.cuerpo.classList.add('angosto');
  const chat = lista(CHATS, chatInicial || CHATS[0]);
  const t = campo('Qué querés que haga', 'area', texto || '');
  t.rows = 7;
  m.cuerpo.append(chat, t);
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let rec = null;
    const mic = boton('🎤 Dictar', function () {
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = 'es-AR'; rec.interimResults = false; rec.continuous = true;
      rec.onresult = function (e) { let s = ''; for (let i = e.resultIndex; i < e.results.length; i++) s += e.results[i][0].transcript; t.value += (t.value && !/\s$/.test(t.value) ? ' ' : '') + s; };
      rec.onend = function () { rec = null; mic.textContent = '🎤 Dictar'; };
      rec.start(); mic.textContent = '⏹ Parar';
    }, 'sec');
    m.cuerpo.append(mic);
  }
  m.cuerpo.append(boton('📋 Copiar y abrir el chat', async function () {
    try { await api('pedido', { chat: chat.value, tipo: 'SEGUIMIENTO', prioridad: 'alta', contacto: resumen || 'PEDIDO', telefono: '', email: '', clientifyId: '', detalle: t.value }); } catch (e) { /* queda igual el texto */ }
    await copiarYAbrir(chat.value, t.value);
    m.cerrar();
  }));
}
function popupDictar() { popupEnviarClaude('VENTAS REDCONAR', '', 'DICTADO'); }

/* ---------- panel editable ---------- */
const ATAJOS = {
  nuevo: ['➕', 'Nuevo', function () { popupNuevoContacto(); }],
  pedido: ['📤', 'Pedido', function () { popupPedido(); }],
  claude: ['🎤', 'A Claude', function () { popupDictar(); }],
  chats: ['💬', 'Chats', function () { popupChats(); }],
  config: ['⚙️', 'Config', function () { irA('MÁS'); }],
  plantillas: ['📋', 'Plantillas', function () { popupPlantillas(); }],
  mail: ['✉️', 'Mail', function () { popupNovedad('mail'); }],
  agenda: ['📆', 'Agenda', function () { popupNovedad('agenda'); }],
  drive: ['📁', 'Drive', function () { popupNovedad('drive'); }],
  wa: ['📱', 'WhatsApp', function () { popupWA(); }],
  semana: ['🗓', 'Esta semana', function () { popupSemana(0); }],
  semanaAnt: ['⏮', 'Sem. anterior', function () { popupSemana(1); }],
  tareas: ['✅', 'Tareas', function () { irA('TAREAS'); }],
  contactos: ['👥', 'Contactos', function () { irA('CONTACTOS'); }],
  actualizar: ['🔄', 'Actualizar', async function () { await datosInicio(true); vistaPanel(); }]
};
const ATAJOS_DEF = ['nuevo', 'pedido', 'claude', 'chats', 'config'];
let EDITANDO = false;

function largo(elem, f) {
  let t = null;
  elem.addEventListener('touchstart', function () { t = setTimeout(function () { t = null; if (navigator.vibrate) navigator.vibrate(30); f(); }, 600); }, { passive: true });
  ['touchmove', 'touchend', 'touchcancel'].forEach(function (ev) { elem.addEventListener(ev, function () { clearTimeout(t); }, { passive: true }); });
  elem.addEventListener('contextmenu', function (e) { e.preventDefault(); });
}
function mover(arr, i, d) { const j = i + d; if (j < 0 || j >= arr.length) return; arr.splice(j, 0, arr.splice(i, 1)[0]); }

async function vistaPanel() {
  vista.textContent = '';
  vista.append(titulo('¡Hola, Facu! 👋'));
  const c = cfg();
  const orden = c.panel.orden.slice();
  const ocultos = c.panel.ocultos.slice();
  const atajos = (c.atajos || ATAJOS_DEF).slice();
  const guardar = function () { return guardarCfg({ panel: { orden: orden, ocultos: ocultos }, atajos: atajos }); };
  BLOQUES.forEach(function (b) { if (orden.indexOf(b[0]) < 0 && ocultos.indexOf(b[0]) < 0) ocultos.push(b[0]); });
  const hechos = {
    nuevos: function () { return boton('🆕 Traer nuevos', popupTraer, 'grande'); },
    buscar: function () {
      const q = campo('🔍 Buscar contacto', 'search');
      q.id = 'g-buscar';
      q.onkeydown = function (e) { if (e.key === 'Enter' && q.value.trim().length >= 3) popupBuscar(q.value.trim()); };
      return q;
    },
    atajos: function () {
      const a = el('div', 'atajos');
      a.id = 'g-acc';
      atajos.forEach(function (id, i) {
        const d = ATAJOS[id];
        if (!d) return;
        const t = atajo(d[0], d[1], EDITANDO ? function () { } : d[2]);
        if (EDITANDO) {
          const w = el('div', 'edit-t');
          const mk = function (txt, f) { const x = el('button', 'mini', txt); x.onclick = f; return x; };
          w.append(t, el('div', 'edit-t-bt'));
          w.lastChild.append(mk('◀', function () { mover(atajos, i, -1); guardar(); vistaPanel(); }), mk('✕', function () { atajos.splice(i, 1); guardar(); vistaPanel(); }), mk('▶', function () { mover(atajos, i, 1); guardar(); vistaPanel(); }));
          a.append(w);
        } else { largo(t, function () { EDITANDO = true; vistaPanel(); }); a.append(t); }
      });
      return a;
    },
    novedades: function () { const n = el('div', 'atajos'); ['mail', 'agenda', 'drive', 'wa'].forEach(function (id) { const d = ATAJOS[id]; n.append(atajo(d[0], d[1], d[2])); }); return n; },
    gestionados: function () { return bloqueGestionados(); },
    contadores: function () {
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
    }
  };
  orden.filter(function (b) { return ocultos.indexOf(b) < 0 && hechos[b]; }).forEach(function (b, i) {
    const w = el('div', 'pn-bloque' + (EDITANDO ? ' editando' : ''));
    const contenido = hechos[b]();
    if (EDITANDO) {
      const nom = BLOQUES.find(function (x) { return x[0] === b; })[1];
      const bar = el('div', 'edit-bar');
      bar.append(el('span', null, nom));
      const mk = function (txt, f) { const x = el('button', 'mini', txt); x.onclick = f; bar.append(x); };
      mk('↑', function () { const k = orden.indexOf(b); mover(orden, k, -1); guardar(); vistaPanel(); });
      mk('↓', function () { const k = orden.indexOf(b); mover(orden, k, 1); guardar(); vistaPanel(); });
      mk('🙈', function () { ocultos.push(b); guardar(); vistaPanel(); });
      w.append(bar);
    } else if (b !== 'atajos') largo(w, function () { EDITANDO = true; vistaPanel(); });
    w.append(contenido);
    vista.append(w);
  });
  if (EDITANDO) {
    const ag = boton('＋ Agregar bloque o atajo', function () {
      const m = abrirModal('Agregar', null);
      m.cuerpo.classList.add('angosto');
      m.cuerpo.append(el('p', 'suave', 'Bloques'));
      BLOQUES.filter(function (b) { return ocultos.indexOf(b[0]) >= 0; }).forEach(function (b) {
        const o = el('button', 'opcion', b[1]);
        o.onclick = function () { ocultos.splice(ocultos.indexOf(b[0]), 1); if (orden.indexOf(b[0]) < 0) orden.push(b[0]); guardar(); m.cerrar(); vistaPanel(); };
        m.cuerpo.append(o);
      });
      m.cuerpo.append(el('p', 'suave', 'Atajos (cuadritos)'));
      Object.keys(ATAJOS).filter(function (id) { return atajos.indexOf(id) < 0; }).forEach(function (id) {
        const o = el('button', 'opcion', ATAJOS[id][0] + ' ' + ATAJOS[id][1]);
        o.onclick = function () { atajos.push(id); guardar(); m.cerrar(); vistaPanel(); };
        m.cuerpo.append(o);
      });
    }, 'sec');
    vista.append(ag, boton('✔ Listo', function () { EDITANDO = false; vistaPanel(); }));
  } else {
    vista.append(el('p', 'suave centro', 'Mantené apretado un bloque o cuadrito para editarlo'));
  }
}
