/* Ventanas emergentes (hojas desde abajo): acciones rápidas sin cambiar de pantalla. */

function abrirModal(titulo_, contenido) {
  const fondo = el('div', 'modal-fondo');
  const m = el('div', 'modal');
  const cab = el('div', 'modal-cab');
  const x = el('button', 'modal-x', '✕');
  const cerrar = function () { fondo.remove(); document.body.classList.toggle('sin-scroll', document.querySelectorAll('.modal-fondo').length > 0); };
  x.onclick = cerrar;
  fondo.onclick = function (e) { if (e.target === fondo) cerrar(); };
  cab.append(el('strong', null, titulo_), x);
  m.append(cab);
  if (contenido) m.append(contenido);
  fondo.append(m);
  document.body.append(fondo);
  document.body.classList.add('sin-scroll');
  return { cuerpo: m, cerrar: cerrar };
}

/** Bloque de WhatsApp: elegir plantilla, editar el texto y abrir el chat con el texto cargado. */
function bloqueWhatsApp(f) {
  const wa = waNumero(f.telefono);
  const caja = el('div', 'wa-bloque');
  if (!wa) { caja.append(vacio('Este contacto no tiene teléfono.')); return caja; }
  const sel = lista(PLANTILLAS.map(function (p) { return [p.id, p.nombre]; }));
  const cuando = el('p', 'suave');
  const txt = campo('Texto', 'area');
  txt.rows = 5;
  const cargar = function () { const p = PLANTILLAS.find(function (x) { return x.id === sel.value; }); cuando.textContent = p.cuando; txt.value = armarTexto(p, f); };
  sel.onchange = cargar; cargar();
  caja.append(sel, cuando, txt, boton('💬 Abrir WhatsApp con este texto', async function () {
    try { await navigator.clipboard.writeText(txt.value); } catch (e) { /* abre igual con el texto en el enlace */ }
    window.open('https://wa.me/' + wa + (txt.value ? '?text=' + encodeURIComponent(txt.value) : ''), '_blank');
  }, 'wa'), boton('📝 Registrar envío', async function () {
    const res = await api('gestion', { nombre: f.nombre, apellido: f.apellido, empresa: f.empresa, telefono: f.telefono, id: f.id, tipo: f.tipo, mensaje: 'WhatsApp: ' + txt.value, respuesta: '', proximo: '', fechaProximo: '' });
    invalidarInicio();
    aviso(res.notaEnCola ? 'Registrado. Nota en cola para Clientify.' : 'Registrado en la hoja.');
  }, 'sec'));
  return caja;
}

/** Contacto en ventana: lo esencial y las acciones rápidas. ref: {fila} o {tel}. */
async function popupContacto(ref) {
  const m = abrirModal('Contacto', el('p', 'suave', 'Cargando...'));
  let r;
  try { r = await api('contacto', { fila: ref.fila, tel: ref.telefono || ref.tel }); } catch (e) { m.cuerpo.lastChild.textContent = 'No se pudo cargar: ' + e.message; return; }
  m.cuerpo.lastChild.remove();
  const f = r.ficha || { nombre: ref.nombre || '', apellido: '', empresa: ref.empresa || '', telefono: ref.telefono || ref.tel || '', email: '', estado: '', tipo: ref.tipo || '', id: '' };
  const nombre = (f.nombre + ' ' + f.apellido).trim() || f.empresa || 'Sin nombre';
  m.cuerpo.querySelector('.modal-cab strong').textContent = nombre;
  const chips = el('p', 'chips');
  [f.empresa && f.nombre && f.empresa, f.fuentes && '📍 ' + f.fuentes, f.etiqueta && '🏷 ' + f.etiqueta, f.estado, f.tipo, f.ufSistema && f.ufSistema + ' UF'].filter(Boolean).forEach(function (t) { chips.append(el('span', 'chip', t)); });
  m.cuerpo.append(chips);
  [['Último contacto', f.ultimoContacto], ['Próximo paso', f.proximoPaso], ['Notas', (f.notas || '').slice(0, 300)]].forEach(function (par) { const p = filaDato(par[0], par[1]); if (p) m.cuerpo.append(p); });

  const acc = el('div', 'acciones');
  const wa = waNumero(f.telefono);
  if (wa) acc.append(enlace('📞 Llamar', 'tel:+' + wa));
  if (f.email) acc.append(enlace('✉️ Mail', 'mailto:' + f.email));
  if (acc.children.length) m.cuerpo.append(acc);

  const zona = el('div');
  const abrir = function (nodo) { zona.textContent = ''; zona.append(nodo); nodo.scrollIntoView({ block: 'nearest' }); };
  m.cuerpo.append(boton('💬 WhatsApp con plantilla', function () { abrir(bloqueWhatsApp(f)); }, 'wa'),
    boton('📝 Registrar gestión', function () { abrir(formGestion(f, nombre)); }, 'sec'),
    boton('📤 Pedido a un chat', function () { abrir(formPedido(f, nombre, null, m.cerrar)); }, 'sec'),
    boton('📂 Ver ficha completa', function () { m.cerrar(); abrirFichaCompleta(ref); }, 'sec'), zona);
}

/** Lista de tareas en ventana, con solapas. grupo: vencidos | hoy | proximos. */
async function popupTareas(grupo) {
  const m = abrirModal('✅ Tareas', el('p', 'suave', 'Cargando...'));
  let d;
  try { d = await datosInicio(false); } catch (e) { m.cuerpo.lastChild.textContent = 'No se pudo cargar: ' + e.message; return; }
  m.cuerpo.lastChild.remove();
  let g = grupo;
  const barra = el('div', 'solapas'), zona = el('div');
  const pintar = function () {
    barra.textContent = '';
    GRUPOS.forEach(function (x) {
      const b = el('button', g === x[0] ? 'activa' : '', x[1] + ' ' + d.agenda[x[0]].length);
      b.onclick = function () { g = x[0]; pintar(); };
      barra.append(b);
    });
    zona.textContent = '';
    if (!d.agenda[g].length) zona.append(vacio('Nada por acá 🎉'));
    d.agenda[g].forEach(function (x) {
      const k = el('div', 'fila tocable');
      const t = el('div');
      t.append(el('strong', null, x.nombre || x.empresa || x.telefono), el('p', 'suave', (x.proximo || x.empresa || '') + ' · ' + textoPlazo(x.dias)));
      k.append(t, el('span', 'flecha', '›'));
      k.onclick = function () { popupContacto(x); };
      zona.append(k);
    });
  };
  m.cuerpo.append(barra, zona);
  pintar();
}

/** Búsqueda en ventana. */
async function popupBuscar(texto) {
  const m = abrirModal('🔍 ' + texto, el('p', 'suave', 'Buscando...'));
  let l;
  try { l = await api('buscar', { q: texto }); } catch (e) { m.cuerpo.lastChild.textContent = e.message; return; }
  m.cuerpo.lastChild.remove();
  if (!l.length) m.cuerpo.append(vacio('Sin resultados.'));
  l.forEach(function (c) {
    const k = el('div', 'fila tocable');
    const t = el('div');
    t.append(el('strong', null, (c.nombre + ' ' + c.apellido).trim() || c.empresa || 'Sin nombre'), el('p', 'suave', [c.empresa, c.estado, c.fuentes].filter(Boolean).join(' · ')));
    k.append(t, el('span', 'flecha', '›'));
    k.onclick = function () { popupContacto({ fila: c.fila }); };
    m.cuerpo.append(k);
  });
}

function popupPedido() {
  const m = abrirModal('📤 Pedido a un chat');
  m.cuerpo.append(formPedido(null, '', null, m.cerrar));
}

function popupPlantillas() {
  const m = abrirModal('📋 Plantillas');
  PLANTILLAS.filter(function (p) { return p.texto; }).forEach(function (p) {
    const k = el('div', 'card');
    k.append(el('strong', null, p.nombre), el('p', 'suave', p.cuando), el('p', null, armarTexto(p, {})));
    k.append(boton('Copiar', async function () { await navigator.clipboard.writeText(armarTexto(p, {})); aviso('Copiada'); }, 'sec'));
    m.cuerpo.append(k);
  });
}

async function popupChats() {
  const m = abrirModal('💬 Chats', el('p', 'suave', 'Cargando...'));
  let d = null;
  try { d = await datosInicio(false); } catch (e) { /* se muestran sin contadores */ }
  m.cuerpo.lastChild.remove();
  CHATS.forEach(function (c) {
    const n = d && d.chats[c] ? d.chats[c].pendientes.length : 0;
    m.cuerpo.append(boton(c + (n ? '  ·  ' + n + ' pendientes' : ''), function () { m.cerrar(); irA('CHATS'); abrirChat(c); }));
  });
  m.cuerpo.append(boton('📤 Nuevo pedido', function () { m.cerrar(); popupPedido(); }, 'sec'));
}
