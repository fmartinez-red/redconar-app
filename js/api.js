/* Sesion con Google y llamadas a la API (Apps Script). Un solo lugar para todo lo que sale de la app. */

const CLAVE_SESION = 'redconar_credencial';
const CLAVE_CACHE = 'redconar_inicio';
const VIDA_CACHE_MS = 3 * 60 * 1000; // no volver a pedir "inicio" antes de 3 minutos

function leerSesion() { return leerLocal(CLAVE_SESION, ''); }
function borrarSesion() { borrarLocal(CLAVE_SESION); }
function datosToken(t) {
  try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return null; }
}
function sesionVigente() {
  const p = datosToken(leerSesion());
  return Boolean(p && p.exp * 1000 > Date.now() + 60000);
}

/** Llama a la API. Si la sesion venció, vuelve a la pantalla de entrada. */
async function api(accion, datos) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: leerSesion(), accion: accion, datos: datos || {} })
  });
  const r = await res.json();
  if (!r.ok) {
    if (r.error === 'Sesion invalida') { borrarSesion(); pantallaLogin(); }
    throw new Error(r.error);
  }
  return r.datos;
}

/**
 * Datos de "inicio" (agenda, chats, filtros): una sola llamada con copia en el celular.
 * forzar=true ignora la copia. Las pantallas lo usan en vez de llamar a la API por su cuenta.
 */
async function datosInicio(forzar) {
  const c = leerLocal(CLAVE_CACHE, null);
  if (!forzar && c && Date.now() - c.t < VIDA_CACHE_MS) return c.datos;
  const datos = await api('inicio');
  guardarLocal(CLAVE_CACHE, { t: Date.now(), datos: datos });
  return datos;
}
function invalidarInicio() { borrarLocal(CLAVE_CACHE); }

/** Texto "Actualizado ..." para mostrar en las pantallas. */
function cuandoActualizado() {
  const c = leerLocal(CLAVE_CACHE, null);
  return c ? 'Datos de las ' + c.datos.generado.slice(11) : '';
}
