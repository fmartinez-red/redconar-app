/* Arranque, navegación y pantallas: PANEL, CONTACTOS, TAREAS, CHATS, MÁS. Va último: redefine lo anterior. */
const VERSION_APP = 'v6'; // subir junto con VERSION en sw.js
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
  if (nombre === 'PANEL') return vistaPanel();
  if (nombre === 'CONTACTOS') return vistaBuscar();
  if (nombre === 'TAREAS') return vistaTareas();
  if (nombre === 'CHATS') return vistaChats();
  return vistaAjustes();
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

async function vistaPanel() {
  vista.textContent = '';
  vista.append(titulo('¡Hola, Facu! 👋'));
  const q = campo('🔍 Buscar contacto (nombre, empresa, mail, teléfono)', 'search');
  q.id = 'g-buscar';
  q.onkeydown = function (e) { if (e.key === 'Enter' && q.value.trim().length >= 3) popupBuscar(q.value.trim()); };
  vista.append(q);
  const acc = el('div', 'atajos');
  acc.id = 'g-acc';
  acc.append(
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
  if (!leerLocal(CLAVE_WIZARD, false)) setTimeout(iniciarGuia, 300);
}

/* ---------- GUÍA (wizard) ---------- */
function iniciarGuia() {
  if (ESTADO.seccion !== 'PANEL') irA('PANEL');
  const nav = function (s) { return function () { return menu.querySelector('[data-sec="' + s + '"]'); }; };
  const pasos = [
    [function () { return document.getElementById('g-buscar'); }, '🔍 Buscador', 'Escribí un nombre, empresa, mail o teléfono y tocá Enter. Se abre una ventana con los resultados.'],
    [function () { return document.getElementById('g-acc'); }, '⚡ Accesos rápidos', 'Pedido a un chat, plantillas, chats y actualizar datos. Todo en ventanas: hacés la acción y cerrás.'],
    [function () { return document.getElementById('g-num'); }, '📊 Tu resumen', 'Atrasados, para hoy y próximos. Tocá uno y se abre la lista; tocá un contacto y le escribís por WhatsApp.'],
    [nav('TAREAS'), '✅ Tareas', 'Acá están los contactos a los que les toca hablar. Empezá siempre por esta pestaña.'],
    [nav('CONTACTOS'), '👥 Contactos', 'Buscá a cualquiera. En su ficha ves de dónde vino, etiquetas, notas e historial, y le escribís por WhatsApp con una plantilla ya cargada.'],
    [nav('CHATS'), '💬 Chats', 'Para cosas complejas (altas, presupuestos, datos) dejás un pedido al chat que corresponda.'],
    [function () { return document.getElementById('varita'); }, '🪄 Guía', 'Tocá la varita cuando quieras volver a ver esta guía.']
  ].filter(function (p) { return p[0](); });
  const capa = el('div', 'g-capa');
  const foco = el('div', 'g-foco');
  const tip = el('div', 'g-tip');
  capa.append(foco, tip);
  document.body.append(capa);
  let i = 0;
  const cerrar = function () { guardarLocal(CLAVE_WIZARD, true); capa.remove(); };
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
  if (pasos.length) mostrar(); else cerrar();
}
document.getElementById('varita').onclick = function () { if (sesionVigente()) iniciarGuia(); };

/* ---------- CHATS ---------- */
async function vistaChats() {
  vista.textContent = '';
  vista.append(titulo('💬 Chats', 'Tocá uno para ver sus pedidos, crear uno nuevo o abrirlo en Claude.'));
  let d = null;
  try { d = await datosInicio(false); } catch (e) { vista.append(vacio('No se pudo cargar: ' + e.message)); }
  CHATS.forEach(function (c) {
    const n = d && d.chats[c] ? d.chats[c].pendientes.length : 0;
    vista.append(boton(c + (n ? '  ·  ' + n + ' pendientes' : ''), function () { abrirChat(c); }));
  });
}
function abrirChat(c) {
  recordar({ chat: c });
  vistaChat(c);
  vista.prepend(boton('← Chats', function () { irA('CHATS'); }, 'sec volver'));
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
  r.setProperty('--g1', t[0]); r.setProperty('--g2', t[1]); r.setProperty('--marca', oscuro ? t[2] : t[0]);
  r.setProperty('--tam', a.texto + 'px');
}
const _vistaAjustesBase = vistaAjustes;
vistaAjustes = function () {
  _vistaAjustesBase();
  const a = leerLocal('redconar_aspecto', { tema: 'Azul', texto: 17 });
  const caja = bloque('🎨 Apariencia', 'Color y tamaño del texto. Se guarda en este celular.');
  const fila = el('div', 'solapas');
  Object.keys(TEMAS).forEach(function (n) {
    const b = el('button', a.tema === n ? 'activa' : '', n);
    b.onclick = function () { a.tema = n; guardarLocal('redconar_aspecto', a); aplicarApariencia(); vistaAjustes(); };
    fila.append(b);
  });
  const tam = lista([['15', 'Texto chico'], ['17', 'Texto normal'], ['19', 'Texto grande'], ['21', 'Texto muy grande']], String(a.texto));
  tam.onchange = function () { a.texto = Number(tam.value); guardarLocal('redconar_aspecto', a); aplicarApariencia(); };
  caja.append(fila, tam, boton('🪄 Ver la guía de nuevo', iniciarGuia, 'sec'));
  vista.prepend(caja);
};
aplicarApariencia();

/* ---------- LOGIN Y ARRANQUE ---------- */
function pantallaLogin() {
  menu.textContent = '';
  vista.textContent = '';
  vista.append(el('h1', null, 'Redconar'), el('p', 'suave', 'Entrá con tu cuenta de Google de Redconar.'));
  const caja = el('div', 'gbtn');
  vista.append(caja);
  const iniciar = function () {
    if (!window.google || !google.accounts) { setTimeout(iniciar, 300); return; }
    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: function (r) { guardarLocal(CLAVE_SESION, r.credential); armarMenu(); irA('PANEL'); } });
    google.accounts.id.renderButton(caja, { theme: 'filled_blue', size: 'large', text: 'signin_with', width: 280 });
  };
  iniciar();
}

function restaurar() {
  const u = leerLocal(CLAVE_ULTIMA, null);
  if (!u || !u.seccion) return irA('PANEL');
  irA(u.seccion);
  if (u.chat) abrirChat(u.chat);
}

if ('serviceWorker' in navigator) {
  const habia = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', function () { if (habia) location.reload(); }); // versión nueva: recarga sola
  navigator.serviceWorker.register('sw.js');
}
if (sesionVigente()) { armarMenu(); restaurar(); } else { pantallaLogin(); }
