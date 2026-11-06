/* Arranque: menú, navegación entre secciones y pantalla de entrada con Google. */

const VERSION_APP = 'v3'; // subir junto con VERSION en sw.js
const MENU = ['HOY', 'BUSCAR'].concat(CHATS, ['AJUSTES']);
const ESTADO = { seccion: 'HOY' };

function vistaDe(nombre) {
  if (nombre === 'HOY') return vistaHoy();
  if (nombre === 'BUSCAR') return vistaBuscar();
  if (nombre === 'AJUSTES') return vistaAjustes();
  return vistaChat(nombre);
}

/** Cambia de sección. Es la única forma de navegar: todas las pantallas la usan. */
function irA(nombre) {
  ESTADO.seccion = nombre;
  Array.prototype.forEach.call(menu.children, function (b) {
    b.classList.toggle('activo', b.textContent === nombre);
  });
  const activo = menu.querySelector('.activo');
  if (activo && activo.scrollIntoView) activo.scrollIntoView({ inline: 'center', block: 'nearest' });
  window.scrollTo(0, 0);
  vistaDe(nombre);
}

function armarMenu() {
  menu.textContent = '';
  MENU.forEach(function (n) {
    const b = el('button', null, n);
    b.onclick = function () { irA(n); };
    menu.append(b);
  });
}

function pantallaLogin() {
  menu.textContent = '';
  vista.textContent = '';
  vista.append(el('h1', null, 'Redconar'), el('p', 'suave', 'Entrá con tu cuenta de Google de Redconar.'));
  const caja = el('div', 'gbtn');
  vista.append(caja);
  const iniciar = function () {
    if (!window.google || !google.accounts) { setTimeout(iniciar, 300); return; }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: function (r) { guardarLocal(CLAVE_SESION, r.credential); armarMenu(); irA('HOY'); }
    });
    google.accounts.id.renderButton(caja, { theme: 'filled_blue', size: 'large', text: 'signin_with', width: 280 });
  };
  iniciar();
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
if (sesionVigente()) { armarMenu(); irA('HOY'); } else { pantallaLogin(); }
