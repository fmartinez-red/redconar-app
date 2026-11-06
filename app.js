/* Arranque, navegación y pantallas: PANEL, CONTACTOS, TAREAS, CHATS, MÁS. Va último: redefine lo anterior. */
const VERSION_APP = 'v5'; // subir junto con VERSION en sw.js
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
function tarjetaNum(n, emoji, texto, grupo, alerta) {
  const k = el('article', 'card tocable num' + (alerta && n ? ' alerta' : ''));
  k.append(el('span', 'em', emoji), el('strong', 'gran', String(n)), el('p', 'suave', texto));
  k.onclick = function () { ESTADO.tareas = grupo; irA('TAREAS'); };
  return k;
}

async function vistaPanel() {
  vista.textContent = '';
  vista.append(titulo('¡Hola, Facu! 👋', 'Esto es lo que tenés para hoy.'));
  const estado = el('p', 'suave', 'Cargando...');
  vista.append(estado);
  let d;
  try { d = await datosInicio(false); } catch (e) { estado.textContent = 'No se pudo cargar: ' + e.message; return; }
  estado.textContent = cuandoActualizado();
  const grid = el('div', 'grid2');
  grid.id = 'g-num';
  grid.append(
    tarjetaNum(d.agenda.vencidos.length, '⏰', 'Atrasados', 'vencidos', true),
    tarjetaNum(d.agenda.hoy.length, '📅', 'Para hoy', 'hoy'),
    tarjetaNum(d.agenda.proximos.length, '🔜', 'Próximos 14 días', 'proximos')
  );
  const pend = CHATS.reduce(function (s, c) { return s + ((d.chats[c] || { pendientes: [] }).pendientes.length); }, 0);
  const kc = el('article', 'card tocable num');
  kc.append(el('span', 'em', '💬'), el('strong', 'gran', String(pend)), el('p', 'suave', 'Pedidos en chats'));
  kc.onclick = function () { irA('CHATS'); };
  grid.append(kc);
  vista.append(grid);
  const b1 = boton('🔍 Buscar contacto', function () { irA('CONTACTOS'); });
  b1.id = 'b-buscar';
  vista.append(b1, boton('🔄 Actualizar datos', async function () { await datosInicio(true); vistaPanel(); }, 'sec'));
  if (!leerLocal(CLAVE_WIZARD, false)) setTimeout(iniciarGuia, 300);
}

/* ---------- GUÍA (wizard) ---------- */
function iniciarGuia() {
  if (ESTADO.seccion !== 'PANEL') irA('PANEL');
  const nav = function (s) { return function () { return menu.querySelector('[data-sec="' + s + '"]'); }; };
  const pasos = [
    [function () { return document.getElementById('g-num'); }, 'Tu resumen', 'Atrasados, para hoy y próximos. Tocá uno y vas directo a esa lista.'],
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
const _abrirFichaBase = abrirFicha;
abrirFicha = function (ref) {
  recordar({ ficha: { fila: ref.fila, tel: ref.telefono || ref.tel, nombre: ref.nombre, empresa: ref.empresa, tipo: ref.tipo } });
  return _abrirFichaBase(ref);
};
const _dibujarFichaBase = dibujarFicha;
dibujarFicha = function (f, historial, sinRegistro) {
  _dibujarFichaBase(f, historial, sinRegistro);
  const h1 = vista.querySelector('h1');
  const chips = el('p', 'chips');
  [f.fuentes && '📍 Origen: ' + f.fuentes, f.etiqueta && '🏷 ' + f.etiqueta, f.estado, f.tipo].filter(Boolean).forEach(function (t) { chips.append(el('span', 'chip', t)); });
  if (chips.children.length && h1) h1.after(chips);
  const acciones = vista.querySelector('.acciones');
  const wa = waNumero(f.telefono);
  if (!acciones || !wa) return;
  const viejo = Array.prototype.find.call(acciones.children, function (a) { return /wa\.me/.test(a.href); });
  if (viejo) viejo.remove();
  const caja = bloque('💬 WhatsApp con plantilla');
  const sel = lista(PLANTILLAS.map(function (p) { return [p.id, p.nombre]; }));
  const cuando = el('p', 'suave');
  const txt = campo('Texto', 'area');
  txt.rows = 6;
  const cargar = function () { const p = PLANTILLAS.find(function (x) { return x.id === sel.value; }); cuando.textContent = p.cuando; txt.value = armarTexto(p, f); };
  sel.onchange = cargar; cargar();
  caja.append(sel, cuando, txt, boton('Abrir WhatsApp con este texto', async function () {
    try { await navigator.clipboard.writeText(txt.value); } catch (e) { /* abre igual con el texto en el enlace */ }
    window.open('https://wa.me/' + wa + (txt.value ? '?text=' + encodeURIComponent(txt.value) : ''), '_blank');
  }, 'wa'), boton('📝 Registrar envío', async function () {
    const res = await api('gestion', { nombre: f.nombre, apellido: f.apellido, empresa: f.empresa, telefono: f.telefono, id: f.id, tipo: f.tipo, mensaje: 'WhatsApp: ' + txt.value, respuesta: '', proximo: '', fechaProximo: '' });
    invalidarInicio();
    aviso(res.notaEnCola ? 'Registrado. Nota en cola para Clientify.' : 'Registrado en la hoja.');
  }, 'sec'));
  acciones.after(caja);
};

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
  if (u.ficha) { ESTADO.seccion = u.seccion; abrirFicha(u.ficha); } else if (u.chat) abrirChat(u.chat);
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
if (sesionVigente()) { armarMenu(); restaurar(); } else { pantallaLogin(); }
