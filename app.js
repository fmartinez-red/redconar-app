/* Arranque, navegación y pantallas: PANEL, CONTACTOS, TAREAS, CHATS, MÁS. Va último: redefine lo anterior. */
const VERSION_APP = 'v16'; // subir junto con VERSION en sw.js
const MENU = [['PANEL', '🏠'], ['CONTACTOS', '👥'], ['TAREAS', '✅'], ['CHATS', '💬'], ['MÁS', '⚙️']];
const ESTADO = { seccion: 'PANEL', tareas: '' };
const CLAVE_WIZARD = 'redconar_wizard_visto';
const CLAVE_ULTIMA = 'redconar_ultima'; // para que al recargar vuelva a la misma pantalla

function recordar(extra) { guardarLocal(CLAVE_ULTIMA, Object.assign({ seccion: ESTADO.seccion }, extra || {})); }

function irA(nombre) {
  ESTADO.seccion = nombre;
  recordar();
  Array.prototype.forEach.call(menu.children, function (b) { b.classList.toggle('activo', b.dataset.sec === nombre); });
  window.scrollTo(0, 0);
  const f = nombre === 'PANEL' ? vistaPanel() : nombre === 'CONTACTOS' ? vistaBuscar() : nombre === 'TAREAS' ? vistaTareas() : nombre === 'CHATS' ? vistaChats() : vistaAjustes();
  Promise.resolve(f).then(function () { guiaAutomatica(nombre); });
  return f;
}

function armarMenu() {
  menu.textContent = '';
  MENU.forEach(function (m) {
    const b = el('button');
    b.dataset.sec = m[0];
    b.append(el('span', 'ico', m[1]), document.createTextNode(m[0]));
    b.onclick = function () { irA(m[0]); };
    menu.append(b);
  });
}

/* ---------- PANEL ---------- */
function tarjetaNum(n, emoji, texto, accion, alerta) {
  const k = el('article', 'card tocable num' + (alerta && n ? ' alerta' : ''));
  k.append(el('span', 'em', emoji), el('strong', 'gran', String(n)), el('p', 'suave', texto));
  k.onclick = accion;
  return k;
}
function atajo(emoji, texto, accion) {
  const b = el('button', 'atajo');
  b.append(el('span', 'em', emoji), document.createTextNode(texto));
  b.onclick = accion;
  return b;
}

async function vistaPanelViejo() {
  vista.textContent = '';
  vista.append(titulo('¡Hola, Facu! 👋'));
  vista.append(boton('🆕 Traer nuevos (mails + Clientify)', popupNuevos, 'grande'));
  const q = campo('🔍 Buscar contacto (nombre, empresa, mail, teléfono)', 'search');
  q.id = 'g-buscar';
  q.onkeydown = function (e) { if (e.key === 'Enter' && q.value.trim().length >= 3) popupBuscar(q.value.trim()); };
  vista.append(q);
  const acc = el('div', 'atajos cinco');
  acc.id = 'g-acc';
  acc.append(
    atajo('➕', 'Nuevo contacto', popupNuevoContacto),
    atajo('📤', 'Pedido a chat', popupPedido),
    atajo('📋', 'Plantillas', popupPlantillas),
    atajo('💬', 'Chats', popupChats),
    atajo('🔄', 'Actualizar', async function () { await datosInicio(true); vistaPanel(); })
  );
  vista.append(acc);
  const estado = el('p', 'suave', 'Cargando...');
  vista.append(estado);
  let d;
  try { d = await datosInicio(false); } catch (e) { estado.textContent = 'No se pudo cargar: ' + e.message; return; }
  estado.textContent = cuandoActualizado();
  const grid = el('div', 'grid2');
  grid.id = 'g-num';
  grid.append(
    tarjetaNum(d.agenda.vencidos.length, '⏰', 'Atrasados', function () { popupTareas('vencidos'); }, true),
    tarjetaNum(d.agenda.hoy.length, '📅', 'Para hoy', function () { popupTareas('hoy'); }),
    tarjetaNum(d.agenda.proximos.length, '🔜', 'Próximos 14 días', function () { popupTareas('proximos'); })
  );
  const pend = CHATS.reduce(function (s, c) { return s + ((d.chats[c] || { pendientes: [] }).pendientes.length); }, 0);
  grid.append(tarjetaNum(pend, '💬', 'Pedidos en chats', popupChats));
  vista.append(grid);
  const nov = el('div', 'atajos');
  nov.id = 'g-nov';
  const cn = leerLocal(CLAVE_NOV, null);
  const bm = atajo('✉️', cn ? cn.datos.mailSinLeer + ' mails' : 'Mail', function () { popupNovedad('mail'); });
  nov.append(bm, atajo('📆', 'Agenda', function () { popupNovedad('agenda'); }), atajo('📁', 'Drive', function () { popupNovedad('drive'); }), atajo('📱', 'WhatsApp', popupWA));
  vista.append(el('p', 'suave', 'Novedades'), nov);
  api('mails', Object.assign({}, leerLocal('redconar_mailfiltro', { estado: 'unread', dias: '7', cat: '' }), { soloCuenta: true })).then(function (r) { bm.lastChild.textContent = (r.total >= 500 ? '500+' : r.total) + ' mails'; }).catch(function () { /* sin backend nuevo: queda "Mail" */ });
  vista.append(bloqueGestionados());
}

/* ---------- GUÍA (wizard): una por pestaña, sale sola la primera vez ---------- */
function q1(sel) { return function () { return vista.querySelector(sel); }; }
function porId(id) { return function () { return document.getElementById(id); }; }
function navSec(sec) { return function () { return menu.querySelector('[data-sec="' + sec + '"]'); }; }
const GUIAS = {
  PANEL: [
    [porId('g-buscar'), '🔍 Buscador', 'Escribí un nombre, empresa, mail o teléfono y tocá Enter. Se abre una ventana con los resultados.'],
    [porId('g-acc'), '⚡ Accesos rápidos', 'Pedido a un chat, plantillas, chats y actualizar. Todo en ventanas: hacés la acción y cerrás.'],
    [porId('g-nov'), '📥 Novedades', 'Mail, agenda y Drive de tu cuenta, y el repaso de conversaciones de WhatsApp. Cada botón abre una ventana.'],
    [porId('g-num'), '📊 Tu resumen', 'Atrasados, para hoy y próximos. Tocá uno y se abre la lista; tocá un contacto y le escribís por WhatsApp.'],
    [navSec('TAREAS'), '✅ Menú', 'Abajo cambiás de sección. Cada una te explica cómo se usa la primera vez.'],
    [porId('varita'), '🪄 Guía', 'Tocá la varita en cualquier pantalla para ver la explicación de esa pantalla.']
  ],
  CONTACTOS: [
    [q1('input[type=search]'), '🔍 Buscar', 'Escribí al menos 3 letras y tocá Enter o "Buscar".'],
    [q1('select'), '🎚 Filtros', 'Filtrá por fuente (Facebook, formulario, listas), estado o tipo. Sirve para armar tandas de contactos.'],
    [q1('.card, button.btn'), '👆 Resultados', 'Tocá un contacto: se abre su ventana con origen, notas, WhatsApp con plantilla y registro de gestión.']
  ],
  TAREAS: [
    [q1('.solapas'), '⏰ Solapas', 'Atrasados, Hoy y Próximos. El número es cuántos contactos hay en cada una.'],
    [q1('select'), '💬 Filtro por chat', 'Mirá solo las tareas que corresponden a un chat.'],
    [q1('.card'), '👆 Contacto', 'Tocalo: se abre su ventana para escribirle por WhatsApp o registrar qué pasó. Al guardar el próximo paso, se va de atrasados.']
  ],
  CHATS: [
    [porId('g-chats'), '💬 Tus 4 chats', 'Cada tarjeta es un chat de Claude con su especialidad. El número rojo son pedidos que le dejaron y todavía no hizo.'],
    [q1('.chat-card'), '👆 Tocá uno', 'Ves sus pedidos, los marcás resueltos, le dejás uno nuevo o abrís el chat en Claude (escribile "traspasos" para que los resuelva).']
  ],
  'MÁS': [
    [porId('g-links'), '🔗 Links de los chats', 'Opcional. Para el botón "Abrir chat en Claude": abrí cada chat, copiá la dirección de la barra y pegala acá. ✅ = ya cargado.'],
    [porId('g-avisos'), '🔔 Avisos', 'Elegí qué días y en qué horario te suenan los avisos de mail, agenda, Drive y chats.'],
    [porId('g-aspecto'), '🎨 Apariencia', 'Cambiá color y tamaño del texto.'],
    [porId('g-guias'), '🪄 Guías', 'Acá activás o desactivás las guías automáticas.']
  ]
};

function iniciarGuia(sec) {
  sec = typeof sec === 'string' ? sec : ESTADO.seccion;
  const pasos = (GUIAS[sec] || []).filter(function (p) { return p[0](); });
  if (!pasos.length) { aviso('Esta pantalla no tiene guía'); return; }
  const capa = el('div', 'g-capa');
  const foco = el('div', 'g-foco');
  const tip = el('div', 'g-tip');
  capa.append(foco, tip);
  document.body.append(capa);
  let i = 0;
  const cerrar = function () { guardarLocal('redconar_guia_' + sec, true); capa.remove(); };
  const mostrar = function () {
    const p = pasos[i], t = p[0]();
    t.scrollIntoView({ block: 'center' });
    const r = t.getBoundingClientRect();
    Object.assign(foco.style, { left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px' });
    tip.textContent = '';
    tip.append(el('strong', null, p[1]), el('p', null, p[2]), el('p', 'suave', 'Paso ' + (i + 1) + ' de ' + pasos.length));
    const sig = el('button', 'btn', i === pasos.length - 1 ? 'Listo' : 'Siguiente');
    sig.onclick = function () { if (++i >= pasos.length) cerrar(); else mostrar(); };
    const omi = el('button', 'btn sec', 'Omitir');
    omi.onclick = cerrar;
    tip.append(sig, omi);
    tip.style.top = r.top > innerHeight / 2 ? Math.max(70, r.top - tip.offsetHeight - 24) + 'px' : Math.min(innerHeight - tip.offsetHeight - 80, r.bottom + 20) + 'px';
  };
  mostrar();
}
function guiaAutomatica(sec) {
  if (leerLocal('redconar_guias_off', false) || leerLocal('redconar_guia_' + sec, false)) return;
  setTimeout(function () { if (ESTADO.seccion === sec && !document.querySelector('.g-capa') && !document.querySelector('.modal-fondo')) iniciarGuia(sec); }, 500);
}
document.getElementById('varita').onclick = function () { if (sesionVigente()) iniciarGuia(); };

/* ---------- CHATS ---------- */
async function vistaChats() {
  vista.textContent = '';
  vista.append(titulo('💬 Chats', 'Tus 4 chats de Claude. Tocá uno para ver qué le pediste, qué hizo y dejarle pedidos nuevos.'));
  let d = null;
  try { d = await datosInicio(false); } catch (e) { vista.append(vacio('No se pudo cargar: ' + e.message)); }
  const caja = el('div');
  caja.id = 'g-chats';
  CHATS.forEach(function (c) {
    const n = d && d.chats[c] ? d.chats[c].pendientes.length : 0;
    const info = INFO_CHATS[c];
    const k = el('article', 'card tocable chat-card');
    k.append(el('h2', null, info[0] + ' ' + c), el('p', 'suave', info[1]));
    k.append(el('p', n ? 'plazo atrasado' : 'plazo', n ? '⏳ ' + n + (n === 1 ? ' pedido esperando respuesta' : ' pedidos esperando respuesta') : '✅ Al día'));
    k.onclick = function () { popupChat(c); };
    caja.append(k);
  });
  vista.append(caja, boton('📤 Nuevo pedido a un chat', popupPedido, 'sec'));
}

/* ---------- FICHA ---------- */
const abrirFichaCompleta = abrirFicha; // la original: pantalla completa
abrirFicha = popupContacto;            // desde listas y búsquedas se abre la ventana rápida
const _dibujarFichaBase = dibujarFicha;
dibujarFicha = function (f, historial, sinRegistro) {
  _dibujarFichaBase(f, historial, sinRegistro);
  const h1 = vista.querySelector('h1');
  const chips = el('p', 'chips');
  [f.fuentes && '📍 Origen: ' + f.fuentes, f.etiqueta && '🏷 ' + f.etiqueta, f.estado, f.tipo].filter(Boolean).forEach(function (t) { chips.append(el('span', 'chip', t)); });
  if (chips.children.length && h1) h1.after(chips);
  const acciones = vista.querySelector('.acciones');
  if (!acciones) return;
  const viejo = Array.prototype.find.call(acciones.children, function (a) { return /wa\.me/.test(a.href); });
  if (viejo) viejo.remove();
  const caja = bloque('💬 WhatsApp con plantilla');
  caja.append(bloqueWhatsApp(f));
  acciones.after(caja);
};

/* ---------- APARIENCIA (en MÁS) ---------- */
const TEMAS = {
  'Azul': ['#2563eb', '#0891b2', '#7aa7ff'], 'Verde': ['#15803d', '#0d9488', '#4ade80'],
  'Naranja': ['#ea580c', '#d97706', '#fdba74'], 'Grafito': ['#334155', '#475569', '#cbd5e1'], 'Rosa': ['#db2777', '#e11d48', '#f9a8d4']
};
function aplicarApariencia() {
  const a = leerLocal('redconar_aspecto', { tema: 'Azul', texto: 17 });
  const t = TEMAS[a.tema] || TEMAS.Azul;
  const oscuro = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches;
  const r = document.documentElement.style;
  r.setProperty('--g1', t[0]); r.setProperty('--g2', t[1]); r.setProperty('--marca', t[0]);
  r.setProperty('--tam', a.texto + 'px');
}
window.vistaAjustesViejo = function () {
  vista.textContent = '';
  vista.append(titulo('⚙️ Más', 'Ajustes de la app. Se guardan solo en este celular.'));
  const a = leerLocal('redconar_aspecto', { tema: 'Azul', texto: 17 });

  const links = bloque('🔗 Links de los chats', 'Opcional. Sirve para el botón "Abrir chat en Claude". Abrí cada chat en Claude, copiá la dirección de la barra del navegador y pegala en su casilla. Donde diga ✅ ya está cargado.');
  links.id = 'g-links';
  const urls = leerLocal(CLAVE_URLS, {}), campos = {};
  CHATS.forEach(function (n) {
    links.append(el('p', 'suave', (urls[n] ? '✅ ' : '⬜ ') + n));
    campos[n] = campo('https://claude.ai/chat/...', 'url', urls[n] || '');
    links.append(campos[n]);
  });
  links.append(boton('Guardar links', async function () {
    const nuevo = {};
    CHATS.forEach(function (n) { nuevo[n] = campos[n].value.trim(); });
    guardarLocal(CLAVE_URLS, nuevo); aviso('Links guardados'); vistaAjustes();
  }));
  vista.append(links);

  const av = el('div'); av.id = 'g-avisos'; vista.append(av);
  bloqueAvisos().then(function (b) { av.replaceWith(b); });

  const td = el('div'); vista.append(td);
  bloqueTareasDiarias().then(function (b) { td.replaceWith(b); });

  const asp = bloque('🎨 Apariencia', 'Color y tamaño del texto.');
  asp.id = 'g-aspecto';
  const fila = el('div', 'solapas');
  Object.keys(TEMAS).forEach(function (n) {
    const b = el('button', a.tema === n ? 'activa' : '', n);
    b.onclick = function () { a.tema = n; guardarLocal('redconar_aspecto', a); aplicarApariencia(); vistaAjustes(); };
    fila.append(b);
  });
  const tam = lista([['15', 'Texto chico'], ['17', 'Texto normal'], ['19', 'Texto grande'], ['21', 'Texto muy grande']], String(a.texto));
  tam.onchange = function () { a.texto = Number(tam.value); guardarLocal('redconar_aspecto', a); aplicarApariencia(); };
  asp.append(fila, tam);
  vista.append(asp);

  const off = leerLocal('redconar_guias_off', false);
  const g = bloque('🪄 Guías', 'Cada pestaña te explica cómo se usa la primera vez que entrás. También podés verla con la varita de arriba.');
  g.id = 'g-guias';
  g.append(boton(off ? '▶️ Activar guías automáticas' : '⏸ Desactivar guías automáticas', function () { guardarLocal('redconar_guias_off', !off); vistaAjustes(); }, 'sec'),
    boton('🔁 Volver a ver todas las guías', function () { ['PANEL', 'CONTACTOS', 'TAREAS', 'CHATS', 'MÁS'].forEach(function (x) { borrarLocal('redconar_guia_' + x); }); guardarLocal('redconar_guias_off', false); irA('PANEL'); }, 'sec'));
  vista.append(g);

  const m = bloque('🛠 Mantenimiento');
  m.append(boton('Actualizar datos ahora', async function () { await datosInicio(true); aviso('Datos actualizados'); }, 'sec'),
    boton('Buscar versión nueva de la app', async function () {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) await r.unregister();
      for (const k of await caches.keys()) await caches.delete(k);
      location.reload();
    }, 'sec'),
    boton('Cerrar sesión', async function () { borrarSesion(); invalidarInicio(); pantallaLogin(); }, 'sec'),
    el('p', 'suave', 'Versión de la app: ' + VERSION_APP));
  vista.append(m);
};
aplicarApariencia();

/* ---------- LOGIN Y ARRANQUE ---------- */
vistaAjustes = vistaAjustesNueva;
aplicarPlantillas();
if (sesionVigente()) bajarCfg();
function pantallaLogin() {
  menu.textContent = '';
  vista.textContent = '';
  vista.append(el('h1', null, 'Redconar'), el('p', 'suave', 'Entrá con tu cuenta de Google de Redconar.'));
  const caja = el('div', 'gbtn');
  vista.append(caja);
  const iniciar = function () {
    if (!window.google || !google.accounts) { setTimeout(iniciar, 300); return; }
    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: async function (r) { guardarLocal(CLAVE_SESION, r.credential); try { const s = await api('login'); if (s && s.sesion) guardarLocal(CLAVE_SESION, s.sesion); } catch (e) { /* queda la sesión de Google (1 hora) */ } armarMenu(); irA('PANEL'); } });
    google.accounts.id.renderButton(caja, { theme: 'filled_blue', size: 'large', text: 'signin_with', width: 280 });
  };
  iniciar();
}

function restaurar() {
  const u = leerLocal(CLAVE_ULTIMA, null);
  if (!u || !u.seccion) return irA('PANEL');
  irA(u.seccion);

}

if ('serviceWorker' in navigator) {
  const habia = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', function () { if (habia) location.reload(); }); // versión nueva: recarga sola
  navigator.serviceWorker.register('sw.js');
}
if (sesionVigente()) { armarMenu(); restaurar(); } else { pantallaLogin(); }
