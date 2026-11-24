/* Wizard 🪄 (v27): recorrido guiado que oscurece la pantalla y resalta cada parte mientras la explica.
   REGLA: cada cambio en la app suma o corrige un paso en TOUR_PASOS. */
const TOUR_CLAVE = 'redconar_tour_v27';
function tourBoton(texto) {
  return function () {
    return [].slice.call(document.querySelectorAll('#vista button')).filter(function (b) { return b.textContent.replace(/\s+/g, ' ').trim().indexOf(texto) >= 0; })[0];
  };
}
const TOUR_PASOS = [
  { sel: function () { return document.querySelector('#vista .chips'); }, t: 'Resumen de hoy', d: 'Cuántos contactos tocan hoy. 🟢 verde: hasta 1 día de atraso. 🟡 amarillo: hasta 7 días. 🔴 rojo: más de 7 días. También ves las llamadas agendadas.' },
  { sel: tourBoton('Arrancar'), t: '▶️ Arrancar', d: 'Manda al agente a trabajar: revisa WhatsApp, contacta a los contactos nuevos y arma el plan de hoy para que lo apruebes.' },
  { sel: tourBoton('Generar tanda'), t: '🎯 Generar tanda', d: 'Arma una lista de contactos para trabajar según lo que elijas: lista, cantidad y rango de UFs.' },
  { sel: tourBoton('Captura'), t: '📷 Captura → contactos', d: 'Subís una captura de pantalla y la app la lee y la convierte en contactos para cargar.' },
  { sel: tourBoton('Cargar lista'), t: '➕ Cargar lista', d: 'Pegás una lista de contactos y quedan dados de alta y listos para la secuencia.' },
  { sel: tourBoton('Pedido'), t: '🧠 Pedido', d: 'Escribís o dictás lo que necesitás y la app lo manda al chat de Claude que corresponde.' },
  { sel: tourBoton('Aplicar resultado'), t: '📥 Aplicar resultado', d: 'Pegás la respuesta de Claude y la app registra todo sola.' },
  { sel: tourBoton('Chat de Google'), t: '💬 Chat de Google', d: 'Ves y respondés tu Google Chat sin salir de la app.' },
  { sel: function () { return document.querySelector('#vista section.card'); }, t: '🤖 Agente', d: 'Acá ves qué está haciendo el agente: barra de progreso, el plan para aprobar por tandas de 10 y el reporte final del día.' },
  { sel: function () { return document.querySelectorAll('#vista section.card')[1]; }, t: '📅 Agenda', d: 'Tus reuniones y llamadas de Google Calendar.' },
  { sel: function () { const c = document.querySelectorAll('#vista > div'); return c[c.length - 1]; }, t: 'A gestionar hoy', d: 'Los contactos que tocan hoy y los atrasados, con su color. Tocá uno para ver el mensaje, marcar enviado, respondió o descartar.' },
  { sel: function () { return document.getElementById('menu'); }, t: 'Menú de abajo', d: 'Panel (esta pantalla), Contactos, Tareas, Chats de Claude y Más (ajustes).' },
  { sel: function () { return document.getElementById('fab'); }, t: '🎤 Micrófono', d: 'Dictás un pedido o una nota por voz desde cualquier pantalla.' },
  { sel: function () { return document.getElementById('campana'); }, t: '🔔 Avisos', d: 'Te avisa cuando entran mails o chats nuevos.' },
  { sel: function () { return document.getElementById('varita'); }, t: '🪄 Esta guía', d: 'Tocá la varita cuando quieras ver este recorrido otra vez.' }
];
let TOUR = null;
function tourCerrar() {
  if (!TOUR) return;
  window.removeEventListener('resize', TOUR.re); window.removeEventListener('scroll', TOUR.re, true);
  TOUR.nodos.forEach(function (n) { n.remove(); }); TOUR = null;
  try { localStorage.setItem(TOUR_CLAVE, '1'); } catch (e) {}
}
function tourMostrar(i) {
  const L = TOUR.pasos;
  if (i < 0) i = 0;
  if (i >= L.length) { tourCerrar(); return; }
  TOUR.i = i;
  const p = L[i], elem = p.sel();
  if (!elem) { tourMostrar(i + (TOUR.dir || 1)); return; }
  elem.scrollIntoView({ block: 'center', behavior: 'instant' });
  setTimeout(function () { if (TOUR && TOUR.i === i) tourPosicionar(); }, 60);
  TOUR.tit.textContent = p.t; TOUR.txt.textContent = p.d;
  TOUR.cont.textContent = (i + 1) + ' de ' + L.length;
  TOUR.ant.style.visibility = i === 0 ? 'hidden' : 'visible';
  TOUR.sig.textContent = i === L.length - 1 ? 'Listo' : 'Siguiente';
  tourPosicionar();
}
function tourPosicionar() {
  if (!TOUR) return;
  const p = TOUR.pasos[TOUR.i], elem = p && p.sel(); if (!elem) return;
  const r = elem.getBoundingClientRect(), pad = 6;
  const h = TOUR.hl.style;
  h.left = (r.left - pad) + 'px'; h.top = (r.top - pad) + 'px'; h.width = (r.width + pad * 2) + 'px'; h.height = (r.height + pad * 2) + 'px';
  const c = TOUR.caja, ch = c.offsetHeight || 150, vw = window.innerWidth, vh = window.innerHeight;
  const w = Math.min(340, vw - 24); c.style.width = w + 'px';
  let top = r.bottom + 14;
  if (top + ch > vh - 10) top = r.top - ch - 14;
  if (top < 10) top = Math.max(10, Math.min(vh - ch - 10, (vh - ch) / 2));
  c.style.top = top + 'px';
  c.style.left = Math.max(12, Math.min(vw - w - 12, r.left + r.width / 2 - w / 2)) + 'px';
}
function iniciarTour() {
  tourCerrar();
  const primero = document.querySelector('#menu button'); if (primero && !document.querySelector('#vista .chips')) primero.click();
  const esperar = function (n) {
    if (document.querySelector('#vista .chips') && tourBoton('Arrancar')()) return arrancarTour();
    if (n > 40) return arrancarTour();
    setTimeout(function () { esperar(n + 1); }, 250);
  };
  esperar(0);
}
function arrancarTour() {
  const nodos = [];
  const velo = document.createElement('div'); velo.style.cssText = 'position:fixed;inset:0;z-index:99990;background:transparent';
  const hl = document.createElement('div'); hl.style.cssText = 'position:fixed;z-index:99991;border-radius:12px;box-shadow:0 0 0 9999px rgba(0,0,0,.72);border:2px solid #60a5fa;pointer-events:none;transition:all .25s';
  const caja = document.createElement('div'); caja.style.cssText = 'position:fixed;z-index:99992;background:#fff;color:#111;border-radius:14px;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.4);font:15px/1.4 system-ui,sans-serif';
  const cont = document.createElement('div'); cont.style.cssText = 'font-size:12px;color:#666;margin-bottom:4px';
  const tit = document.createElement('div'); tit.style.cssText = 'font-weight:700;font-size:17px;margin-bottom:6px';
  const txt = document.createElement('div'); txt.style.cssText = 'margin-bottom:12px';
  const fila = document.createElement('div'); fila.style.cssText = 'display:flex;gap:8px;align-items:center';
  const mk = function (t, estilo) { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'border:0;border-radius:10px;padding:9px 14px;font:inherit;font-weight:600;' + estilo; return b; };
  const saltar = mk('Saltar', 'background:transparent;color:#666;padding:9px 6px');
  const ant = mk('Anterior', 'background:#e5e7eb;color:#111;margin-left:auto');
  const sig = mk('Siguiente', 'background:#2563eb;color:#fff');
  fila.append(saltar, ant, sig); caja.append(cont, tit, txt, fila);
  document.body.append(velo, hl, caja); nodos.push(velo, hl, caja);
  const re = function () { tourPosicionar(); };
  window.addEventListener('resize', re); window.addEventListener('scroll', re, true);
  TOUR = { pasos: TOUR_PASOS, i: 0, dir: 1, nodos: nodos, hl: hl, caja: caja, cont: cont, tit: tit, txt: txt, ant: ant, sig: sig, re: re };
  saltar.onclick = tourCerrar;
  ant.onclick = function () { TOUR.dir = -1; tourMostrar(TOUR.i - 1); };
  sig.onclick = function () { TOUR.dir = 1; tourMostrar(TOUR.i + 1); };
  velo.onclick = function () {};
  tourMostrar(0);
}
function abrirWizard() { iniciarTour(); }
(function () {
  const v = document.getElementById('varita');
  if (v) v.addEventListener('click', function (e) { e.stopImmediatePropagation(); e.preventDefault(); iniciarTour(); }, true);
  let visto = false; try { visto = !!localStorage.getItem(TOUR_CLAVE); } catch (e) {}
  if (!visto) setTimeout(function () { if (document.getElementById('menu') && !document.querySelector('.modal-fondo')) iniciarTour(); }, 1500);
})();
