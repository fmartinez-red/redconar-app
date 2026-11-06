/* Arranque, navegación y pantallas nuevas: PANEL, CONTACTOS, TAREAS, CHATS, MÁS. Va último: redefine lo anterior. */
const VERSION_APP = 'v4'; // subir junto con VERSION en sw.js
const MENU = ['PANEL', 'CONTACTOS', 'TAREAS', 'CHATS', 'MÁS'];
const ESTADO = { seccion: 'PANEL' };
const CLAVE_GUIA = 'redconar_guia_vista';

function irA(nombre) {
  ESTADO.seccion = nombre;
  Array.prototype.forEach.call(menu.children, function (b) { b.classList.toggle('activo', b.textContent === nombre); });
  window.scrollTo(0, 0);
  if (nombre === 'PANEL') return vistaPanel();
  if (nombre === 'CONTACTOS') return vistaBuscar();
  if (nombre === 'TAREAS') return vistaHoy();
  if (nombre === 'CHATS') return vistaChats();
  return vistaAjustes();
}

function armarMenu() {
  menu.textContent = '';
  MENU.forEach(function (n) { const b = el('button', null, n); b.onclick = function () { irA(n); }; menu.append(b); });
}

/* ---------- PANEL ---------- */
const PASOS = [
  ['1. TAREAS', 'Lista de contactos a los que les toca hablar hoy y los atrasados. Empezá por ahí.'],
  ['2. Abrí un contacto', 'Ves de dónde vino (lista, Facebook, formulario), etiquetas, notas e historial.'],
  ['3. WhatsApp con plantilla', 'Elegí la plantilla y tocá "Abrir WhatsApp": se abre el chat con el texto listo. Solo enviás.'],
  ['4. Registrá', 'Tocá "Registrar envío" o "Registrar gestión" para que quede en la hoja y en Clientify.'],
  ['5. CHATS', 'Si necesitás algo complejo (alta, presupuesto, datos), creá un pedido para el chat que corresponda.']
];

function tarjetaNum(n, texto, destino, alerta) {
  const k = el('article', 'card tocable num' + (alerta && n ? ' alerta' : ''));
  k.append(el('strong', 'gran', String(n)), el('p', 'suave', texto));
  k.onclick = function () { irA(destino); };
  return k;
}

async function vistaPanel() {
  vista.textContent = '';
  vista.append(titulo('Redconar', 'Tu CRM de bolsillo.'));
  if (!leerLocal(CLAVE_GUIA, false)) {
    const g = el('section', 'card guia');
    g.append(el('h2', null, 'Cómo usarla'));
    PASOS.forEach(function (p) { const d = el('p'); d.append(el('strong', null, p[0] + ': '), document.createTextNode(p[1])); g.append(d); });
    g.append(boton('Entendido', function () { guardarLocal(CLAVE_GUIA, true); vistaPanel(); }));
    vista.append(g);
  } else {
    vista.append(boton('? Cómo usarla', function () { borrarLocal(CLAVE_GUIA); vistaPanel(); }, 'sec'));
  }
  const estado = el('p', 'suave', 'Cargando...');
  vista.append(estado);
  let d;
  try { d = await datosInicio(false); } catch (e) { estado.textContent = 'No se pudo cargar: ' + e.message; return; }
  estado.textContent = cuandoActualizado();
  const grid = el('div', 'grid2');
  grid.append(
    tarjetaNum(d.agenda.vencidos.length, 'Atrasados', 'TAREAS', true),
    tarjetaNum(d.agenda.hoy.length, 'Para hoy', 'TAREAS'),
    tarjetaNum(d.agenda.proximos.length, 'Próximos 14 días', 'TAREAS')
  );
  const pend = CHATS.reduce(function (s, c) { return s + ((d.chats[c] || { pendientes: [] }).pendientes.length); }, 0);
  grid.append(tarjetaNum(pend, 'Pedidos en chats', 'CHATS'));
  vista.append(grid);
  vista.append(boton('Buscar contacto', function () { irA('CONTACTOS'); }), boton('Actualizar datos', async function () { await datosInicio(true); vistaPanel(); }, 'sec'));
}

/* ---------- CHATS ---------- */
async function vistaChats() {
  vista.textContent = '';
  vista.append(titulo('CHATS', 'Tocá un chat para ver sus pedidos, crear uno nuevo o abrirlo en Claude.'));
  let d = null;
  try { d = await datosInicio(false); } catch (e) { vista.append(vacio('No se pudo cargar: ' + e.message)); }
  CHATS.forEach(function (c) {
    const n = d && d.chats[c] ? d.chats[c].pendientes.length : 0;
    const b = boton(c + (n ? '  (' + n + ' pendientes)' : ''), function () { abrirChat(c); });
    vista.append(b);
  });
}
function abrirChat(c) {
  vistaChat(c);
  vista.prepend(boton('← Chats', function () { irA('CHATS'); }, 'sec volver'));
}

/* ---------- FICHA: origen + WhatsApp con plantilla ---------- */
const _dibujarFichaBase = dibujarFicha;
dibujarFicha = function (f, historial, sinRegistro) {
  _dibujarFichaBase(f, historial, sinRegistro);
  const h1 = vista.querySelector('h1');
  const chips = el('p', 'chips');
  [f.fuentes && 'Origen: ' + f.fuentes, f.etiqueta, f.estado, f.tipo].filter(Boolean).forEach(function (t) { chips.append(el('span', 'chip', t)); });
  if (chips.children.length && h1) h1.after(chips);
  const acciones = vista.querySelector('.acciones');
  const wa = waNumero(f.telefono);
  if (!acciones || !wa) return;
  const viejo = Array.prototype.find.call(acciones.children, function (a) { return /wa\.me/.test(a.href); });
  if (viejo) viejo.remove();
  const caja = bloque('WhatsApp con plantilla');
  const sel = lista(PLANTILLAS.map(function (p) { return [p.id, p.nombre]; }));
  const cuando = el('p', 'suave');
  const txt = campo('Texto', 'area');
  txt.rows = 6;
  const cargar = function () { const p = PLANTILLAS.find(function (x) { return x.id === sel.value; }); cuando.textContent = p.cuando; txt.value = armarTexto(p, f); };
  sel.onchange = cargar; cargar();
  caja.append(sel, cuando, txt, boton('Abrir WhatsApp con este texto', async function () {
    try { await navigator.clipboard.writeText(txt.value); } catch (e) { /* abre igual con el texto en el enlace */ }
    window.open('https://wa.me/' + wa + (txt.value ? '?text=' + encodeURIComponent(txt.value) : ''), '_blank');
  }), boton('Registrar envío', async function () {
    const res = await api('gestion', { nombre: f.nombre, apellido: f.apellido, empresa: f.empresa, telefono: f.telefono, id: f.id, tipo: f.tipo, mensaje: 'WhatsApp: ' + txt.value, respuesta: '', proximo: '', fechaProximo: '' });
    invalidarInicio();
    aviso(res.notaEnCola ? 'Registrado. Nota en cola para Clientify.' : 'Registrado en la hoja.');
  }, 'sec'));
  acciones.after(caja);
};

/* ---------- LOGIN ---------- */
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

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
if (sesionVigente()) { armarMenu(); irA('PANEL'); } else { pantallaLogin(); }
