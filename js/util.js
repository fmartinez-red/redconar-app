/* Utilidades de pantalla y de datos. No hablan con la API. */

const vista = document.getElementById('vista'); // zona donde se dibuja la pantalla
const menu = document.getElementById('menu');   // barra de secciones de abajo

const CHATS = ['VENTAS REDCONAR', 'PLATAFORMA REDCONAR', 'DATOS REDCONAR', 'PRESUPUESTOS REDCONAR'];

function el(tag, clase, texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
}

/** Campo de texto. tipo: 'area' para texto largo, o un type de input (date, search...). */
function campo(placeholder, tipo, valor) {
  const i = el(tipo === 'area' ? 'textarea' : 'input');
  i.placeholder = placeholder;
  if (tipo && tipo !== 'area') i.type = tipo;
  if (valor) i.value = valor;
  return i;
}

/** Lista desplegable. opciones: array de textos, o de [valor, texto]. */
function lista(opciones, valorInicial) {
  const s = el('select');
  opciones.forEach(function (o) {
    const par = Array.isArray(o) ? o : [o, o];
    const op = el('option', null, par[1]);
    op.value = par[0];
    s.append(op);
  });
  if (valorInicial !== undefined) s.value = valorInicial;
  return s;
}

/** Boton que se bloquea mientras corre la accion y avisa si falla. */
function boton(texto, accion, clase) {
  const b = el('button', 'btn ' + (clase || ''), texto);
  b.type = 'button';
  b.onclick = async function () {
    b.disabled = true;
    try { await accion(); } catch (e) { aviso('No se pudo: ' + e.message); }
    b.disabled = false;
  };
  return b;
}

function aviso(texto) {
  const a = el('div', 'aviso', texto);
  document.body.append(a);
  setTimeout(function () { a.remove(); }, 3500);
}

function titulo(texto, ayuda) {
  const f = document.createDocumentFragment();
  f.append(el('h1', null, texto));
  if (ayuda) f.append(el('p', 'suave', ayuda));
  return f;
}

function bloque(titulo, ayuda) {
  const s = el('section', 'bloque');
  s.append(el('h2', null, titulo));
  if (ayuda) s.append(el('p', 'suave', ayuda));
  return s;
}

/** Numero para wa.me: siempre 549 + area + numero, sin 0 ni 15. */
function waNumero(tel) {
  let d = String(tel || '').replace(/\D/g, '').replace(/^0+/, '');
  if (!d) return '';
  if (d.indexOf('549') === 0) return d;
  if (d.indexOf('54') === 0) return '549' + d.slice(2);
  return '549' + d;
}

function enlace(texto, href, clase) {
  const a = el('a', clase || 'btn sec', texto);
  a.href = href;
  if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
  return a;
}

/** Texto de plazo: "hoy", "hace 3 dias de atraso", "en 2 dias". */
function textoPlazo(dias) {
  if (dias === 0) return 'Hoy';
  if (dias < 0) return 'Atrasado ' + (-dias) + (dias === -1 ? ' día' : ' días');
  return 'En ' + dias + (dias === 1 ? ' día' : ' días');
}

function leerLocal(clave, porDefecto) {
  try { const v = localStorage.getItem(clave); return v ? JSON.parse(v) : porDefecto; } catch (e) { return porDefecto; }
}
function guardarLocal(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* sin almacenamiento: sigue andando */ }
}
function borrarLocal(clave) {
  try { localStorage.removeItem(clave); } catch (e) { /* nada */ }
}

function vacio(texto) { return el('p', 'suave', texto); }
