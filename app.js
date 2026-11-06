const vista = document.getElementById('vista');
const menu = document.getElementById('menu');
const CLAVE = 'redconar_credencial';

function leerCodigo() { try { return localStorage.getItem(CLAVE) || ''; } catch (e) { return ''; } }
function guardarCodigo(v) { try { localStorage.setItem(CLAVE, v); } catch (e) {} }
function borrarCodigo() { try { localStorage.removeItem(CLAVE); } catch (e) {} }
function datosToken(t) {
  try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return null; }
}
function sesionVigente() {
  const p = datosToken(leerCodigo());
  return Boolean(p && p.exp * 1000 > Date.now() + 60000);
}

async function api(accion, datos) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: leerCodigo(), accion, datos })
  });
  const r = await res.json();
  if (!r.ok) {
    if (r.error === 'Sesion invalida') { borrarCodigo(); pantallaCodigo(); }
    throw new Error(r.error);
  }
  return r.datos;
}

function el(tag, clase, texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
}
function campo(placeholder, tipo) {
  const i = el(tipo === 'area' ? 'textarea' : 'input');
  i.placeholder = placeholder;
  if (tipo && tipo !== 'area') i.type = tipo;
  return i;
}
function boton(texto, accion, clase) {
  const b = el('button', 'btn ' + (clase || ''), texto);
  b.onclick = async () => {
    b.disabled = true;
    try { await accion(); } catch (e) { aviso('No se pudo: ' + e.message); }
    b.disabled = false;
  };
  return b;
}
function aviso(texto) {
  const a = el('div', 'aviso', texto);
  document.body.append(a);
  setTimeout(() => a.remove(), 3000);
}
function limpiar(titulo) { vista.textContent = ''; vista.append(el('h1', null, titulo)); }
function cargando() { const c = el('p', 'suave', 'Cargando...'); vista.append(c); return c; }
function vacio(texto) { vista.append(el('p', 'suave', texto)); }
async function cargar(accion, datos, pintar) {
  const c = cargando();
  try { const r = await api(accion, datos); c.remove(); pintar(r); }
  catch (e) { c.textContent = 'No se pudo cargar: ' + e.message; }
}

function linkTel(tel) {
  const a = el('a', 'tel', tel);
  a.href = 'tel:+' + String(tel).replace(/\D/g, '');
  return a;
}

function formGestion(c) {
  const f = el('div', 'form');
  const m = campo('Qué hiciste', 'area');
  const r = campo('Respuesta (si hubo)');
  const p = campo('Próximo paso');
  const fe = campo('', 'date');
  fe.setAttribute('aria-label', 'Fecha del próximo paso');
  f.append(m, r, p, fe, boton('Guardar gestión', async () => {
    if (!m.value.trim()) return aviso('Escribí qué hiciste');
    const fecha = fe.value ? fe.value.split('-').reverse().join('/') : '';
    const res = await api('gestion', {
      nombre: c.nombre, telefono: c.telefono, id: c.id, mensaje: m.value,
      respuesta: r.value, proximo: p.value, fechaProximo: fecha
    });
    aviso(res.notaEnCola ? 'Guardado, nota en cola para Clientify' : 'Guardado en la hoja');
    f.remove();
  }));
  return f;
}

function tarjetaContacto(c) {
  const k = el('article', 'card');
  k.append(el('h2', null, c.nombre || c.empresa || 'Sin nombre'));
  if (c.empresa) k.append(el('p', 'suave', c.empresa));
  if (c.telefono) k.append(linkTel(c.telefono));
  const datos = [c.estado, c.tipo, c.fecha].filter(Boolean).join(' · ');
  if (datos) k.append(el('p', 'suave', datos));
  if (c.proximo) k.append(el('p', null, 'Próximo: ' + c.proximo));
  if (c.notas) k.append(el('p', 'suave', c.notas));
  k.append(boton('Registrar gestión', () => {
    if (!k.querySelector('.form')) k.append(formGestion(c));
  }, 'sec'));
  return k;
}

const SECCIONES = {
  Hoy() {
    limpiar('Pendientes de hoy');
    cargar('pendientes', {}, l => {
      if (!l.length) vacio('No hay pendientes para hoy.');
      l.forEach(c => vista.append(tarjetaContacto(c)));
    });
  },
  Buscar() {
    limpiar('Buscar contacto');
    const q = campo('Nombre, empresa, mail o teléfono', 'search');
    const r = el('div');
    const buscar = async () => {
      r.textContent = 'Buscando...';
      const l = await api('buscar', { q: q.value });
      r.textContent = l.length ? '' : 'Sin resultados.';
      l.forEach(c => r.append(tarjetaContacto(c)));
    };
    q.onkeydown = e => { if (e.key === 'Enter') buscar().catch(x => { r.textContent = x.message; }); };
    vista.append(q, boton('Buscar', buscar), r);
    q.focus();
  },
  Traspasos() {
    limpiar('Traspasos pendientes');
    cargar('traspasos', {}, l => {
      if (!l.length) vacio('No hay traspasos pendientes.');
      l.forEach(t => {
        const k = el('article', 'card');
        k.append(el('h2', null, t.contacto || t.tipo), el('p', 'suave', [t.tipo, t.a_chat, t.prioridad].filter(Boolean).join(' · ')), el('p', null, t.detalle));
        const r = campo('Resultado');
        k.append(r, boton('Cerrar traspaso', async () => {
          await api('cerrarTraspaso', { id: t.id, resultado: r.value });
          k.remove();
          aviso('Traspaso cerrado');
        }, 'sec'));
        vista.append(k);
      });
    });
  }
};

function irA(nombre) {
  [...menu.children].forEach(b => b.classList.toggle('activo', b.textContent === nombre));
  SECCIONES[nombre]();
}

function armarMenu() {
  menu.textContent = '';
  Object.keys(SECCIONES).forEach(n => {
    const b = el('button', null, n);
    b.onclick = () => irA(n);
    menu.append(b);
  });
}

function pantallaCodigo() {
  menu.textContent = '';
  vista.textContent = '';
  vista.append(el('h1', null, 'Redconar'), el('p', 'suave', 'Entrá con tu cuenta de Google de Redconar.'));
  const caja = el('div', 'gbtn');
  vista.append(caja);
  const iniciar = () => {
    if (!window.google || !google.accounts) { setTimeout(iniciar, 300); return; }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: r => { guardarCodigo(r.credential); armarMenu(); irA('Hoy'); }
    });
    google.accounts.id.renderButton(caja, { theme: 'filled_blue', size: 'large', text: 'signin_with', width: 280 });
  };
  iniciar();
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
if (sesionVigente()) { armarMenu(); irA('Hoy'); } else { pantallaCodigo(); }
