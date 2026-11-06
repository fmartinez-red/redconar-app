/**
 * API JSON para la PWA. Se agrega al Apps Script de la hoja.
 * Requiere en Script Properties: APP_TOKEN (codigo secreto, lo carga Facu).
 * La PWA manda POST con Content-Type text/plain para evitar el preflight de CORS.
 */
function doPost(e) {
  let salida;
  try {
    const p = JSON.parse(e.postData.contents);
    const token = PropertiesService.getScriptProperties().getProperty('APP_TOKEN');
    if (!token || p.token !== token) {
      salida = { ok: false, error: 'Codigo incorrecto' };
    } else {
      salida = { ok: true, datos: ejecutarApi_(p.accion, p.datos || {}) };
    }
  } catch (err) {
    salida = { ok: false, error: String(err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(salida)).setMimeType(ContentService.MimeType.JSON);
}

function ejecutarApi_(accion, d) {
  switch (accion) {
    case 'resumen': return appHoy();
    case 'pendientes': return apiPendientes_();
    case 'buscar': return appBuscar(d.q);
    case 'traspasos': return appTraspasos();
    case 'cerrarTraspaso': return appCerrarTraspaso(d.id, d.resultado);
    case 'gestion': return apiGestion_(d);
    default: throw new Error('Accion desconocida');
  }
}

/** Ultima gestion por telefono cuya fecha de proximo paso es hoy o ya paso. */
function apiPendientes_() {
  const log = libro_().getSheetByName('Log_Actividades').getDataRange().getValues();
  const h = log[0].map(String);
  const c = function (f, n) { return f[h.indexOf(n)]; };
  const ultima = {};
  log.slice(1).forEach(function (f) {
    const tel = normalizarTelefono_(c(f, 'Teléfono'));
    if (tel) ultima[tel] = f;
  });
  const fin = new Date();
  fin.setHours(23, 59, 59, 999);
  const lista = [];
  Object.keys(ultima).forEach(function (tel) {
    const f = ultima[tel];
    const fecha = fechaDe_(c(f, 'Fecha_Próximo_Paso'));
    if (!fecha || fecha.getTime() > fin.getTime()) return;
    lista.push({
      nombre: (c(f, 'Nombre') + ' ' + c(f, 'Apellido')).trim(), empresa: String(c(f, 'Empresa')),
      telefono: String(c(f, 'Teléfono')), proximo: String(c(f, 'Próximo_Paso')),
      fecha: Utilities.formatDate(fecha, SIS.TZ, 'dd/MM/yyyy'), orden: fecha.getTime()
    });
  });
  return lista.sort(function (a, b) { return a.orden - b.orden; }).slice(0, 100);
}

/** Registra la gestion en Log_Actividades y, si hay id unico, encola la nota. */
function apiGestion_(o) {
  agregarPorEncabezado_(libro_().getSheetByName('Log_Actividades'), {
    'Fecha': hoy_(), 'Nombre': o.nombre, 'Teléfono': o.telefono, 'Mensaje_Enviado': o.mensaje,
    'Respuesta_Recibida': o.respuesta, 'Próximo_Paso': o.proximo, 'Fecha_Próximo_Paso': o.fechaProximo,
    'chat_origen': 'App celular'
  });
  const id = idDeClientify_({ id: o.id, tel: normalizarTelefono_(o.telefono) });
  if (id && o.mensaje) encolar_(id, 'NOTA', o.mensaje, 'App celular');
  return { notaEnCola: Boolean(id && o.mensaje) };
}
