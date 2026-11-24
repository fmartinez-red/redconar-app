/* v22: semáforo, agenda Calendar, tandas, captura OCR, órdenes al agente. */

const PILOTO = [
  // [nombre, teléfono, grupo, nota]  B=frío T1 · A=personalizar · C=sin chat · D=descartado · E=esperar respuesta
  ['Fernando Scarpa', '1149869292', 'B', ''], ['Carmen Nieto', '1140413931', 'B', ''], ['Liliana Andres', '1144120201', 'B', ''], ['Marta Noemi Marco', '1132870256', 'B', ''],
  ['Claudia Gonzalez', '1150211052', 'B', ''], ['Rocío Leguizamón', '1130738604', 'B', ''], ['Norma Beatriz Gianni', '1559930681', 'B', ''], ['Susana Tassone', '1569477541', 'B', ''],
  ['Nora Chena', '1159659700', 'B', ''], ['Alexander Lavielle', '1160101915', 'B', 'chequear Contactos_Consolidados'], ['Leandro Danko', '1162929884', 'B', ''], ['Raul Pastoriza', '1158887421', 'B', ''],
  ['Maria Lorena Salerno', '1161071777', 'B', 'chequear Contactos_Consolidados'], ['María Elena Ibaceta Moya', '1140914702', 'B', ''], ['Elisa Ines Canaves', '1154798272', 'B', ''], ['Antonio Dominguez', '1140489968', 'B', ''],
  ['Fabian Diaz', '1164605960', 'B', ''], ['Mabel Rodriguez', '1141964163', 'B', ''], ['Silvia Iriarte', '2236001599', 'B', ''], ['Mariano Sangroni', '1168032371', 'B', ''],
  ['Adriana Armenia', '1159400959', 'B', ''], ['Andres Esteban David Martinez', '1121705633', 'B', ''],
  ['Vanesa Agote', '1168768059', 'B', ''], ['Fernanda Munilla', '1151569057', 'B', ''], ['Veronica Primozic', '1536813644', 'B', ''], ['Hernan Alejandro Galante', '1165014314', 'B', ''],
  ['Ariel Coppari', '2214400252', 'B', ''], ['Maria Cecilia Videla', '1154952531', 'B', ''], ['Lorena Samacoits', '1128606007', 'B', ''], ['Viviana Paula Julis', '41814375', 'B', 'teléfono corto, verificar'],
  ['Nerina Purrinos de Marco', '2914258444', 'B', ''], ['Leonardo Indiveri', '2616797706', 'B', ''], ['Nestor Daniel Heinzmann', '3513909531', 'B', ''], ['Claudio Filloy', '3516522759', 'B', ''],
  ['Vittorio Cappello', '2954672540', 'B', ''], ['Mariela Antonello', '3416770729', 'B', ''], ['Paola Sofia Vidal', '3515529961', 'B', ''], ['Sergio Guglielminpietro', '3415883588', 'B', ''],
  ['Yanina Soledad Dell Erba', '3513926040', 'B', ''], ['Javier Echegaray Mas', '3512894287', 'B', ''], ['Julieta Henkel', '3515481508', 'B', ''], ['Carlos Alberto Ieno', '3516324386', 'B', ''],
  ['Jorge Alberto Stabio', '3515156843', 'B', ''], ['Carolina Fassi', '3571417818', 'B', ''], ['Daniel Martinis', '3516093424', 'B', ''], ['Eugenia Moreno Redolez', '3794542894', 'B', ''],
  ['Santiago Villalba', '3491435320', 'B', ''], ['Karina Rivas', '3512026611', 'B', ''], ['Oscar Gimenez Lascano', '3815014573', 'B', 'mailing 20/10'], ['Jorge Alberto Bernardi', '40544754', 'B', 'teléfono corto, verificar'],
  ['Maira Gonzalez', '1164771490', 'A', 'caliente'], ['Luciana Scuri', '1157182437', 'A', 'caliente'], ['Leonardo Cortes', '1152296448', 'A', 'caliente'], ['Ema Noemi Quiquinte', '1168278205', 'A', 'caliente'],
  ['Daniel Argento', '1149388515', 'A', 'tibio'], ['Nilda Sosa', '1164566536', 'A', 'tibio'], ['Claudio Garcia de Rivas', '1159813791', 'A', 'tibio'], ['Sergio Méndez', '1166346467', 'A', 'tibio'],
  ['Cecilia Vega', '1166241332', 'A', 'mensaje sin leer'], ['Mariano Zorzut', '1148890897', 'A', 'activo, le escribiste el 4/11'], ['Georgina Montenegro', '1163097070', 'A', 'tibio'], ['Dora Galvan', '1149146669', 'A', 'stand by'],
  ['Alfredo Iglesias', '1145454841', 'C', 'historial en Clientify y Base Viva (Siro)'], ['Juan Manuel Grossi', '1160417314', 'C', 'n° inválido, pendiente mail'], ['Martha Blanco', '1176158763', 'C', 'mail 4/11, WhatsApp no funciona'],
  ['Diego Soriano', '1128777563', 'C', 'video IA 5/8, sin chat'], ['Oscar Rodriguez', '11477893123', 'C', 'teléfono inválido'],
  ['Eduardo González', '48486129', 'C', 'revisar antes de enviar'], ['Alejandro Del Brutto', '22901739', 'C', 'revisar antes de enviar'], ['Silvia Marina Velarde', '5402236912051', 'C', 'revisar antes de enviar'], ['Susana Gimenez', '261155590053', 'C', 'revisar antes de enviar'],
  ['Juan Luciani', '1155798855', 'D', 'no es administrador'], ['Micaela Figueredo', '1169631760', 'D', 'no es administradora'], ['Martin Dome Nuñez', '1134719264', 'D', 'número equivocado'],
  ['Cecilia Inés García Chescotta', '1157008018', 'D', 'ex rubro'], ['Laura Andrea Laza', '2254590927', 'D', 'no ejerce hace 2 años'],
  ['Silvia Amado', '3513172117', 'E', 'sin leer'], ['Graciela Noseda', '3513161839', 'E', 'sin leer'], ['Nicolas Vides', '3814488266', 'E', 'respondió el 23/10'],
  ['Cristina Calvo', '2255506198', 'E', 'reaccionó con ❤️ el 5/8'], ['Nicolas Ignacio Alvarez', '2914986090', 'E', 'leyó el 24/6'], ['Mario Chaves', '2615999750', 'E', 'leyó el 24/6']
];

function semaforo(x) {
  const d = -x.dias;
  if (d <= 1) return ['#16a34a', '🟢', 'Reciente'];
  if (d <= 7) return ['#eab308', '🟡', 'Algo viejo'];
  return ['#dc2626', '🔴', 'Muy viejo'];
}

/* ---------- carga masiva ---------- */
async function cargarPiloto(fin) {
  const hoy = fechaHabil(0), tipo = 'Base Encuentro Facu';
  let n = 0;
  for (const p of PILOTO) {
    const x = { nombre: p[0], telefono: p[1], tipo: tipo };
    const g = p[2], nota = p[3];
    try {
      if (g === 'B') await registrar(x, { proximo: etiquetaPaso(1), fecha: hoy, respuesta: nota });
      else if (g === 'A') await registrar(x, { proximo: 'Personalizar mensaje (' + nota + ')', fecha: hoy, estado: /caliente|tibio/.test(nota) ? nota : '' });
      else if (g === 'C') await registrar(x, { proximo: 'Revisar canal sin WhatsApp: ' + nota, fecha: hoy });
      else if (g === 'D') await registrar(x, { respuesta: 'Descartado: ' + nota, estado: 'descartado' });
      else await registrar(x, { proximo: 'Esperar respuesta: ' + nota, fecha: fechaHabil(3) });
      n++;
    } catch (e) { /* sigue */ }
    if (n % 15 === 0) aviso(n + ' de ' + PILOTO.length + '...');
  }
  guardarLocal('redconar_piloto', true);
  aviso(n + ' contactos cargados');
  if (fin) fin();
}
async function cargarLineas(lineas, nomLista, conBase) {
  const vistos = {}; let n = 0, mal = 0;
  for (const l of lineas) {
    const tel = (l.match(/(\d[\d\s-]{6,}\d)\s*(?:\(.*\))?\s*$/) || l.match(/(\d[\d\s-]{6,}\d)/) || [])[1];
    if (!tel) { mal++; continue; }
    const dig = tel.replace(/\D/g, '');
    if (vistos[dig]) continue; vistos[dig] = 1;
    const nombre = l.replace(tel, '').replace(/\(.*?\)/g, '').replace(/[·,;-]+\s*$/, '').trim();
    try {
      if (conBase) await api('altaBase', { nombre: nombre, telefono: dig, fuente: nomLista });
      await registrar({ nombre: nombre, telefono: dig, tipo: nomLista }, { proximo: etiquetaPaso(1), fecha: fechaHabil(0) });
      n++;
    } catch (e) { mal++; }
  }
  invalidarInicio();
  aviso(n + ' cargados' + (mal ? ', ' + mal + ' sin teléfono o con error' : ''));
  return n;
}

/* ---------- tanda generada por la app ---------- */
async function popupTanda() {
  const m = abrirModal('🎯 Generar tanda', null);
  m.cuerpo.classList.add('angosto');
  m.cuerpo.append(el('p', 'suave', 'Qué toma la app: contactos de tu base con teléfono, sin gestión previa, que no sean clientes ni descartados. Primero los que están en el rango de UFs, después los que no tienen dato de UFs. Vos decidís cuántos sacar de cada lista (dejá vacío o 0 para no usar esa lista).'));
  const umin = campo('UFs mínimo', 'number', '200'), umax = campo('UFs máximo', 'number', '1000');
  let fuentes = [];
  try { const r = await api('bases'); fuentes = r.fuentes.slice(0, 40); } catch (e) { m.cuerpo.append(el('p', null, 'No se pudieron leer las listas: ' + e.message)); return; }
  m.cuerpo.append(umin, umax, el('strong', null, 'Cantidad por lista'));
  const filas = fuentes.map(function (f) {
    const c = campo(f[0].replace(/_/g, ' ') + ' (' + f[1] + ' contactos en la lista)', 'number', ''); c.min = 0; m.cuerpo.append(c); return { f: f[0], c: c };
  });
  const prev = el('div');
  let elegidos = [];
  m.cuerpo.append(boton('Armar tanda', async function () {
    const pedidas = filas.filter(function (x) { return Number(x.c.value) > 0; });
    if (!pedidas.length) { aviso('Poné una cantidad en al menos una lista'); return; }
    prev.textContent = 'Buscando...';
    const lo = Number(umin.value) || 0, hi = Number(umax.value) || 1e9;
    const ufDe = function (c) { const n = parseInt(String(c.ufSistema || '').replace(/\D/g, ''), 10); return isNaN(n) ? null : n; };
    const usados = {}; elegidos = [];
    prev.textContent = '';
    for (const x of pedidas) {
      const r = await api('lista', { fuente: x.f });
      const ok = (r.items || []).filter(function (c) { const k = waNumero(c.telefono); return k && !usados[k] && !c.gest && !/descart|stand|cliente|perdid/i.test((c.estado || '') + ' ' + (c.tipo || '')); });
      const dentro = ok.filter(function (c) { const u = ufDe(c); return u !== null && u >= lo && u <= hi; });
      const sinDato = ok.filter(function (c) { return ufDe(c) === null; });
      const sel = dentro.concat(sinDato).slice(0, Number(x.c.value));
      sel.forEach(function (c) { usados[waNumero(c.telefono)] = 1; c._f = x.f; });
      elegidos = elegidos.concat(sel);
      prev.append(el('p', null, x.f.replace(/_/g, ' ') + ': ' + sel.length + ' de ' + x.c.value + ' pedidos (' + Math.min(dentro.length, sel.length) + ' en rango de UFs, ' + Math.max(0, sel.length - dentro.length) + ' sin dato de UFs; disponibles ' + ok.length + ')'));
    }
    prev.append(el('strong', null, 'Total: ' + elegidos.length + ' contactos'));
    elegidos.slice(0, 15).forEach(function (c) { prev.append(el('p', 'suave', '• ' + [c.nombre, c.apellido].filter(Boolean).join(' ') + (c.empresa ? ' · ' + c.empresa : '') + (c.ufSistema ? ' · ' + c.ufSistema + ' UF' : '') + ' · ' + c._f.replace(/_/g, ' '))); });
    if (elegidos.length > 15) prev.append(el('p', 'suave', '... y ' + (elegidos.length - 15) + ' más'));
    if (elegidos.length) {
      prev.append(boton('✅ Cargar a la secuencia', async function () {
        for (const c of elegidos) await registrar({ nombre: [c.nombre, c.apellido].filter(Boolean).join(' '), empresa: c.empresa, telefono: c.telefono, tipo: c._f || 'Tanda' }, { proximo: etiquetaPaso(1), fecha: fechaHabil(0) });
        aviso(elegidos.length + ' cargados'); m.cerrar(); vistaPanel();
      }));
    }
  }, 'sec'), prev);
}

/* ---------- captura de pantalla a contactos (OCR en el celular) ---------- */
function cargarTesseract() {
  return new Promise(function (ok, mal) {
    if (window.Tesseract) return ok(window.Tesseract);
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
    s.onload = function () { ok(window.Tesseract); }; s.onerror = function () { mal(new Error('No se pudo cargar el lector de imágenes')); };
    document.head.append(s);
  });
}
function popupCaptura() {
  const m = abrirModal('📷 Captura a contactos', null);
  m.cuerpo.classList.add('angosto');
  const foto = el('input'); foto.type = 'file'; foto.accept = 'image/*';
  const estado = el('p', 'suave', 'Elegí la captura (lista, chat, tarjeta). La app lee nombres y teléfonos.');
  const txt = campo('Revisá y corregí: un contacto por línea (Nombre 1155551234)', 'area', ''); txt.rows = 9;
  const nom = campo('Nombre de la lista (de dónde vienen)', null, 'Captura ' + ddmmyyyy(0).slice(0, 5));
  m.cuerpo.append(foto, estado, txt, nom);
  foto.onchange = async function () {
    if (!foto.files[0]) return;
    estado.textContent = 'Leyendo imagen... (la primera vez descarga el idioma, tarda un poco)';
    try {
      const T = await cargarTesseract();
      const r = await T.recognize(foto.files[0], 'spa', { logger: function (p) { if (p.status) estado.textContent = p.status + (p.progress ? ' ' + Math.round(p.progress * 100) + '%' : ''); } });
      const lineas = r.data.text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      const out = []; let nombrePend = '';
      lineas.forEach(function (l) {
        const tel = (l.match(/(\+?\d[\d\s().-]{7,}\d)/) || [])[1];
        const nombre = l.replace(tel || '', '').replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ\s]/g, ' ').replace(/\s+/g, ' ').trim();
        if (tel) { out.push((nombre.length > 2 ? nombre : nombrePend) + ' ' + tel.replace(/[^\d+]/g, '')); nombrePend = ''; }
        else if (nombre.length > 2) nombrePend = nombre;
      });
      txt.value = out.join('\n') || r.data.text;
      estado.textContent = out.length ? out.length + ' contactos detectados. Revisalos.' : 'No encontré teléfonos, corregí a mano.';
    } catch (e) { estado.textContent = 'Error: ' + e.message; }
  };
  m.cuerpo.append(boton('✅ Cargar a Base Viva y a la secuencia', async function () {
    const l = txt.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    if (!l.length) { aviso('Nada para cargar'); return; }
    await cargarLineas(l, nom.value.trim() || 'Captura', true);
    m.cerrar(); vistaPanel();
  }));
}

/* ---------- agenda y llamadas ---------- */
async function agendaDatos() {
  try { const r = await api('agendaCal', { dias: 7 }); return r.eventos || []; } catch (e) { return null; }
}
function horaDe(iso) { return iso.slice(11, 16); }
function libreDesde(eventos, min) {
  const d = new Date(); d.setSeconds(0, 0); d.setMinutes(Math.ceil((d.getMinutes() + 30) / 30) * 30);
  for (let i = 0; i < 400; i++) {
    const h = d.getHours() + d.getMinutes() / 60, dow = d.getDay();
    if (dow !== 0 && dow !== 6 && h >= 9 && h + min / 60 <= 18) {
      const ini = d.getTime(), fin = ini + min * 60000;
      const choca = eventos.some(function (e) { if (e.todoDia) return false; const a = new Date(e.inicio).getTime(), b = new Date(e.fin).getTime(); return ini < b && fin > a; });
      if (!choca) return new Date(ini);
    }
    d.setMinutes(d.getMinutes() + 30);
  }
  return new Date();
}
function aLocalISO(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + 'T' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
async function popupAgendar(x, motivo) {
  const m = abrirModal('📞 Agendar llamada', null);
  m.cuerpo.classList.add('angosto');
  const ev = (await agendaDatos()) || [];
  const cuando = campo('Fecha y hora', 'datetime-local', aLocalISO(libreDesde(ev, 30)));
  const dur = lista([['30', '30 min'], ['15', '15 min'], ['45', '45 min'], ['60', '60 min']]);
  m.cuerpo.append(el('p', 'suave', 'Propuse el primer hueco libre de tu agenda (9 a 18). Cambialo si querés.'), cuando, dur);
  m.cuerpo.append(boton('Agendar en mi Calendar', async function () {
    await api('crearEvento', { titulo: '📞 Llamar a ' + (x.nombre || x.telefono) + ' (WhatsApp)', inicio: cuando.value + ':00-03:00', minutos: Number(dur.value), descripcion: (motivo || '') + '\nTel: ' + x.telefono + '\nhttps://wa.me/' + waNumero(x.telefono) });
    aviso('Llamada agendada'); m.cerrar(); vistaPanel();
  }));
}

popupRespondio = function (x, alTerminar) {
  const m = abrirModal('🗨 Respondió: ' + (x.nombre || x.telefono), null);
  m.cuerpo.classList.add('angosto');
  const nota = campo('Qué contestó (opcional)', 'area', ''); nota.rows = 3;
  m.cuerpo.append(nota, el('p', 'suave', '¿Qué es?'));
  PERFILES.forEach(function (p) {
    m.cuerpo.append(boton(p[0], async function () {
      await registrar(x, { respuesta: nota.value || p[0], proximo: p[2], fecha: p[2] ? fechaHabil(p[3]) : '', estado: p[1] });
      aviso('Registrado: ' + p[1]); m.cerrar();
      if (/Interesado|demo/i.test(p[0])) { await popupAgendar(x, p[2]); return; }
      if (['tibio', 'caliente'].indexOf(p[1]) >= 0 || /quién/.test(p[2])) {
        await api('ordenNueva', { tipo: 'respuesta', texto: 'Contacto ' + (x.nombre || '') + ' ' + x.telefono + ' respondió: "' + (nota.value || p[0]) + '". Perfil: ' + p[0] + '. Próximo paso: ' + p[2] + '. Proponé la respuesta, esperá mi OK.' }).catch(function () { });
      }
      alTerminar();
    }, 'sec'));
  });
};

/* ---------- órdenes al agente ---------- */
arrancar = async function () {
  let d;
  try { d = await datosInicio(true); } catch (e) { aviso('No se pudo cargar: ' + e.message); return; }
  const cola = d.agenda.vencidos.concat(d.agenda.hoy);
  const franja = new Date().getHours() < 13 ? 'Mañana (9-13): contactación intensa.' : 'Tarde (13-18): seguimiento y respuestas.';
  const texto = 'ARRANCAR ' + ddmmyyyy(0) + '. ' + franja + ' Cola de gestión (' + cola.length + '):\n' +
    cola.slice(0, 80).map(function (x) { return '- ' + (x.nombre || x.telefono) + ' | ' + x.telefono + ' | ' + (x.proximo || '') + ' | ' + (x.dias < 0 ? 'atrasado ' + (-x.dias) + 'd' : 'hoy'); }).join('\n');
  let r;
  try { r = await api('ordenNueva', { tipo: 'arrancar', texto: texto }); } catch (e) { aviso('Error: ' + e.message); return; }
  if (r.disparo && r.disparo.ok) aviso('Orden enviada al agente en tu PC');
  else { aviso('Orden guardada. Falta conectar la rutina del agente: copio el prompt'); await copiarYAbrir('VENTAS REDCONAR', armarPrompt('VENTAS REDCONAR', texto, null)); }
  vistaPanel();
};
async function panelAgente(caja) {
  caja.textContent = '';
  caja.append(el('h2', null, '🤖 Agente'));
  let r;
  try { r = await api('ordenes'); } catch (e) { caja.append(el('p', 'suave', 'No se pudieron leer las órdenes.')); return; }
  if (!r.ordenes.length) { caja.append(el('p', 'suave', 'Todavía no hay órdenes. Tocá Arrancar.')); return; }
  r.ordenes.slice(0, 5).forEach(function (o) {
    const k = el('article', 'card');
    const col = { pendiente: '🟡', en_curso: '🔵', espera_ok: '🟠', aprobada: '🔵', hecha: '🟢', error: '🔴' }[o.estado] || '⚪';
    k.append(el('strong', null, col + ' ' + o.tipo + ' · ' + o.estado), el('p', 'suave', o.fecha + ' · ' + (o.texto || '').slice(0, 90)));
    if (o.resultado) k.append(el('p', null, o.resultado));
    if (o.estado === 'espera_ok') {
      k.append(el('p', 'suave', '✋ El agente espera tu OK sobre:'));
      const t = campo('Propuesta', 'area', o.propuesta || ''); t.rows = 6; k.append(t);
      k.append(boton('✅ Aprobar y enviar', async function () { await api('ordenResponder', { id: o.id, estado: 'aprobada', respuesta: 'OK. Texto final:\n' + t.value }); aviso('Aprobado'); panelAgente(caja); }));
      k.append(boton('✏️ Corregir', async function () { const c = prompt('¿Qué cambio?'); if (!c) return; await api('ordenResponder', { id: o.id, estado: 'corregir', respuesta: c }); aviso('Enviado'); panelAgente(caja); }, 'sec'));
    }
    caja.append(k);
  });
  caja.append(boton('🔄 Actualizar', function () { panelAgente(caja); }, 'sec'));
}

/* ---------- pantalla principal ---------- */
let FILTRO_SEM = 'todos', SOLAPA = 'gestionar', TIMER_AG = null;
vistaPanel = async function () {
  clearInterval(TIMER_AG);
  vista.textContent = '';
  vista.append(titulo('Hoy ' + ddmmyyyy(0).slice(0, 5)));
  const resumen = el('div', 'chips'); vista.append(resumen);
  const barra = el('div'); barra.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0';
  barra.append(boton('▶️ Arrancar', function () { arrancar(); }), boton('🎯 Generar tanda', popupTanda, 'sec'),
    boton('📷 Captura → contactos', popupCaptura, 'sec'), boton('➕ Cargar lista', popupCargarLista, 'sec'),
    boton('✍️ Pedido a Claude', function () { popupCaja(); }, 'sec'));
  vista.append(barra);
  const ag = el('section', 'card'); vista.append(ag);
  const agenda = el('section', 'card'); vista.append(agenda);
  agenda.append(el('h2', null, '📅 Agenda'), el('p', 'suave', 'Cargando...'));
  const cola = el('div'); vista.append(cola);
  panelAgente(ag); TIMER_AG = setInterval(function () { if (document.body.contains(ag)) panelAgente(ag); else clearInterval(TIMER_AG); }, 30000);
  let d;
  try { d = await datosInicio(true); } catch (e) { cola.textContent = 'No se pudo cargar: ' + e.message; return; }
  const gest = d.agenda.vencidos.concat(d.agenda.hoy);
  const cnt = { v: 0, a: 0, r: 0 };
  gest.forEach(function (x) { const s = semaforo(x)[1]; if (s === '🟢') cnt.v++; else if (s === '🟡') cnt.a++; else cnt.r++; });
  [['A gestionar ' + gest.length], ['🟢 ' + cnt.v], ['🟡 ' + cnt.a], ['🔴 ' + cnt.r]].forEach(function (c) { resumen.append(el('span', 'chip', c[0])); });
  // agenda
  agendaDatos().then(function (ev) {
    agenda.textContent = ''; agenda.append(el('h2', null, '📅 Agenda'));
    if (ev === null) { agenda.append(el('p', 'suave', 'No se pudo leer el Calendar.')); return; }
    const hoyS = aLocalISO(new Date()).slice(0, 10);
    const dias = {};
    ev.forEach(function (e) { const k = e.inicio.slice(0, 10); (dias[k] = dias[k] || []).push(e); });
    const claves = Object.keys(dias).sort().slice(0, 4);
    if (!claves.length) agenda.append(el('p', 'suave', 'Sin eventos.'));
    claves.forEach(function (k) {
      agenda.append(el('strong', null, k === hoyS ? 'Hoy' : k.slice(8, 10) + '/' + k.slice(5, 7)));
      dias[k].forEach(function (e) {
        const llam = /📞|llamar/i.test(e.titulo);
        agenda.append(el('p', llam ? '' : 'suave', (e.todoDia ? 'Todo el día' : horaDe(e.inicio) + '–' + horaDe(e.fin)) + ' · ' + e.titulo));
      });
    });
    const llamadas = ev.filter(function (e) { return /📞/.test(e.titulo); }).length;
    resumen.append(el('span', 'chip', '📞 ' + llamadas + ' llamadas agendadas'));
  });
  // cola con semáforo
  const solapas = el('div', 'solapas'), chips = el('div', 'chips'), lst = el('div');
  cola.append(solapas, chips, lst);
  const pintar = function () {
    solapas.textContent = ''; chips.textContent = ''; lst.textContent = '';
    [['gestionar', 'A gestionar hoy ' + gest.length], ['proximos', 'Próximos ' + d.agenda.proximos.length]].forEach(function (g) {
      const b = el('button', SOLAPA === g[0] ? 'activa' : '', g[1]); b.onclick = function () { SOLAPA = g[0]; pintar(); }; solapas.append(b);
    });
    let items = SOLAPA === 'gestionar' ? gest.slice().sort(function (a, b) { return a.dias - b.dias; }) : d.agenda.proximos;
    if (SOLAPA === 'gestionar') {
      [['todos', 'Todos'], ['🟢', '🟢 Recientes'], ['🟡', '🟡 Algo viejos'], ['🔴', '🔴 Muy viejos']].forEach(function (f) {
        const b = el('button', 'chip' + (FILTRO_SEM === f[0] ? ' chip-alerta' : ''), f[1]); b.onclick = function () { FILTRO_SEM = f[0]; pintar(); }; chips.append(b);
      });
      if (FILTRO_SEM !== 'todos') items = items.filter(function (x) { return semaforo(x)[1] === FILTRO_SEM; });
    }
    if (!items.length) lst.append(vacio('Nada por acá. Generá una tanda o cargá una lista.'));
    items.slice(0, 40).forEach(function (x) {
      const k = tarjeta(x, pasoDe(x.proximo), function () { vistaPanel(); });
      const s = semaforo(x);
      k.style.borderLeft = '6px solid ' + s[0];
      const tag = el('p', 'suave', s[1] + ' ' + s[2] + (x.dias < 0 ? ' · atrasado ' + (-x.dias) + ' día' + (x.dias === -1 ? '' : 's') : ' · toca hoy'));
      k.insertBefore(tag, k.children[1]);
      lst.append(k);
    });
    if (items.length > 40) lst.append(el('p', 'suave', 'Mostrando 40 de ' + items.length + '.'));
  };
  pintar();
};

/* ---------- textos aprobados (T3 y T4 borrador): revisar, editar, aprobar ---------- */
const CLAVE_TEXTOS = 'redconar_textos_aprobados';
function textosGuardados() { return leerLocal(CLAVE_TEXTOS, {}) || {}; }
textoPaso = (function (orig) {
  return function (n, nombre) {
    const g = textosGuardados()[n];
    if (g) return g.replace(/\{n\}/g, primerNombre(nombre));
    return orig(n, nombre);
  };
})(textoPaso);
Object.keys(textosGuardados()).forEach(function (n) { BORRADOR[n] = false; });
function popupAprobarTexto(paso, nombre) {
  const m = abrirModal('✏️ Texto del ' + PASOS[paso].nom.split(' · ')[0], null);
  m.cuerpo.classList.add('angosto');
  const t = campo('Texto (el nombre del contacto se pone solo)', 'area', textoPaso(paso, nombre).split(primerNombre(nombre)).join('{n}')); t.rows = 7;
  m.cuerpo.append(t, el('p', 'suave', 'Si lo aprobás o lo editás, te llevo a Claude (Ventas) con el texto listo para que lo guarde como plantilla aprobada.'));
  m.cuerpo.append(boton('✅ Aprobar este texto', async function () {
    const g = textosGuardados(); g[paso] = t.value; guardarLocal(CLAVE_TEXTOS, g); BORRADOR[paso] = false;
    m.cerrar();
    await copiarYAbrir('VENTAS REDCONAR', 'Aprobé este texto para el ' + PASOS[paso].nom + ' de la secuencia ({n} = primer nombre). Guardalo como plantilla aprobada en el proyecto y usalo desde ahora:\n\n' + t.value);
    vistaPanel();
  }));
  m.cuerpo.append(boton('🧠 Mandar a Claude para que lo mejore', async function () {
    m.cerrar();
    await copiarYAbrir('VENTAS REDCONAR', 'Revisá y mejorá este borrador del ' + PASOS[paso].nom + ' aplicando las 5 reglas de redacción (tono positivo, pregunta sola, sin condicionar el interés). Proponeme la versión final y esperá mi OK:\n\n' + t.value);
  }, 'sec'));
}
tarjeta = (function (orig) {
  return function (x, paso, fin) {
    const k = orig(x, paso, fin);
    if (paso && BORRADOR[paso]) k.append(boton('✏️ Revisar y aprobar texto', function () { popupAprobarTexto(paso, x.nombre); }));
    return k;
  };
})(tarjeta);
