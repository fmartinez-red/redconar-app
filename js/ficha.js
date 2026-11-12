/* Ficha de contacto: datos completos, historial y acciones (WhatsApp, llamar, mail, gestion, pedido). */

/** ref: {fila} o {tel} para buscar el contacto, y opcionalmente datos de respaldo {nombre, empresa, telefono}. */
async function abrirFicha(ref) {
  vista.textContent = '';
  vista.append(botonVolver());
  const c = el('p', 'suave', 'Cargando ficha...');
  vista.append(c);
  let r;
  try {
    r = await api('contacto', { fila: ref.fila, tel: ref.telefono || ref.tel });
  } catch (e) { c.textContent = 'No se pudo cargar: ' + e.message; return; }
  c.remove();
  const f = r.ficha || {
    nombre: ref.nombre || '', empresa: ref.empresa || '', telefono: ref.telefono || '', email: '', apellido: '',
    estado: '', tipo: ref.tipo || '', id: ''
  };
  dibujarFicha(f, r.historial, !r.ficha);
}

function botonVolver() {
  return boton('← Volver', function () { irA(ESTADO.seccion); }, 'sec volver');
}

function filaDato(rotulo, valor) {
  if (!valor) return null;
  const p = el('p', 'dato');
  p.append(el('strong', null, rotulo + ': '), document.createTextNode(valor));
  return p;
}

function dibujarFicha(f, historial, sinRegistro) {
  const nombre = (f.nombre + ' ' + f.apellido).trim() || f.empresa || 'Sin nombre';
  vista.append(el('h1', null, nombre));
  if (sinRegistro) vista.append(el('p', 'suave', 'Este contacto no está en Base Viva. Se muestran solo los datos de la gestión.'));

  // Botones de accion
  const acciones = el('div', 'acciones');
  const wa = waNumero(f.telefono);
  if (wa) acciones.append(enlace('WhatsApp', 'https://wa.me/' + wa));
  if (f.telefono) acciones.append(enlace('Llamar', 'tel:+' + wa));
  if (f.email) acciones.append(enlace('Mail', 'mailto:' + f.email));
  vista.append(acciones);

  // Datos
  const datos = bloque('Datos');
  [
    ['Administración', f.empresa], ['Tipo', f.tipo], ['Estado', f.estado], ['Cliente de Redconar', f.esCliente],
    ['UF en sistema', f.ufSistema], ['UF potencial', f.ufPotencial], ['Sistema actual', f.sistemaActual],
    ['Teléfono', f.telefono], ['Mail', f.email], ['Provincia', f.provincia],
    ['Fuentes', f.fuentes], ['Etiqueta', [f.etiqueta, f.fechaEtiqueta].filter(Boolean).join(' · ')],
    ['Último contacto', f.ultimoContacto], ['Último mensaje', f.ultimoMensaje],
    ['Próximo paso', f.proximoPaso], ['Notas', f.notas]
  ].forEach(function (par) { const p = filaDato(par[0], par[1]); if (p) datos.append(p); });
  vista.append(datos);

  // Registrar gestion y pedido
  const zona = el('div');
  const b1 = boton('Registrar gestión', function () { zona.textContent = ''; zona.append(formGestion(f, nombre)); }, '');
  const b2 = boton('Crear pedido para un chat', function () { zona.textContent = ''; zona.append(formPedido(f, nombre)); }, 'sec');
  vista.append(b1, b2, zona);

  // Historial
  const h = bloque('Historial de gestiones', 'Lo que quedó registrado de este contacto, lo más nuevo primero.');
  if (!historial.length) h.append(vacio('Todavía no hay gestiones registradas.'));
  historial.forEach(function (x) {
    const k = el('article', 'card');
    k.append(el('strong', null, [x.fecha, x.chat].filter(Boolean).join(' · ')));
    if (x.mensaje) k.append(el('p', null, 'Enviado: ' + x.mensaje));
    if (x.respuesta) k.append(el('p', null, 'Respuesta: ' + x.respuesta));
    if (x.proximo) k.append(el('p', 'suave', 'Próximo: ' + x.proximo + (x.fechaProximo ? ' (' + x.fechaProximo + ')' : '')));
    h.append(k);
  });
  vista.append(h);
}

function formGestion(f, nombre) {
  const caja = bloque('Registrar gestión', 'Queda en el registro de actividades. Si el contacto está en Clientify, también se deja una nota.');
  const m = campo('Qué hiciste', 'area');
  const r = campo('Respuesta (si hubo)');
  const p = campo('Próximo paso');
  const fe = campo('', 'date');
  const et = lista(ETAPAS.map(function (x) { return [x, x]; }));
  fe.setAttribute('aria-label', 'Fecha del próximo paso');
  caja.append(m, r, p, el('p', 'suave', 'Etapa'), et, el('p', 'suave', 'Fecha del próximo paso'), fe, boton('Guardar gestión', async function () {
    if (!m.value.trim()) { aviso('Escribí qué hiciste'); return; }
    const fecha = fe.value ? fe.value.split('-').reverse().join('/') : '';
    const res = await api('gestion', {
      nombre: f.nombre, apellido: f.apellido, empresa: f.empresa, telefono: f.telefono, id: f.id, tipo: f.tipo,
      mensaje: m.value, respuesta: r.value, proximo: p.value, fechaProximo: fecha, etapa: et.value
    });
    invalidarInicio();
    aviso(res.notaEnCola ? 'Guardado. Nota en cola para Clientify.' : 'Guardado en la hoja.');
    caja.remove();
  }));
  return caja;
}

/** Pedido para un chat. chatFijo: nombre del chat si el pedido se crea desde la pantalla de ese chat. */
function formPedido(f, nombre, chatFijo, alTerminar) {
  const caja = bloque('Pedido para este chat', 'Escribe una fila en la hoja Traspasos. El chat la ve cuando la lea.');
  const chat = lista(CHATS, chatFijo);
  if (!chatFijo) caja.append(el('p', 'suave', '¿Para qué chat?'), chat);
  const contacto = campo('Contacto', null, nombre || '');
  const tipo = lista(['SEGUIMIENTO', 'PRESUPUESTO', 'PRESUPUESTO_ENVIADO', 'ALTA', 'ALTA_HECHA', 'LEAD_PLATAFORMA', 'DATO', 'LISTA_LIMPIA']);
  const prio = lista([['media', 'Prioridad media'], ['alta', 'Prioridad alta'], ['baja', 'Prioridad baja']]);
  const detalle = campo('Qué necesitás que haga el chat', 'area');
  caja.append(contacto, el('p', 'suave', 'Tipo de pedido'), tipo, prio, detalle, boton('Enviar pedido', async function () {
    if (!detalle.value.trim()) { aviso('Escribí el detalle'); return; }
    await api('pedido', {
      chat: chat.value, tipo: tipo.value, prioridad: prio.value, detalle: detalle.value, contacto: contacto.value,
      telefono: (f && f.telefono) || '', email: (f && f.email) || '', clientifyId: (f && f.id) || ''
    });
    invalidarInicio();
    aviso('Pedido enviado a ' + chat.value);
    caja.remove();
    if (alTerminar) alTerminar();
  }));
  return caja;
}
