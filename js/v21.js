/* v21: pantalla HOY = cola de trabajo con secuencia calculada por la app. */

// Pegar acá los links de los chats de Claude si faltan en el celular.
const URLS_DEFAULT = {};
(function () {
  const u = leerLocal(CLAVE_URLS, {}) || {};
  let cambio = false;
  Object.keys(URLS_DEFAULT).forEach(function (k) { if (!u[k] && URLS_DEFAULT[k]) { u[k] = URLS_DEFAULT[k]; cambio = true; } });
  if (cambio) guardarLocal(CLAVE_URLS, u);
})();

const VIDEO_T2 = 'https://www.youtube.com/shorts/DrBHB-r4hs8';
const PASOS = {
  1: { nom: 'Toque 1 · P1 + P2', gap: 2, sig: 2 },
  2: { nom: 'Toque 2 · video', gap: 2, sig: 3 },
  3: { nom: 'Toque 3 · prueba social', gap: 3, sig: 4 },
  4: { nom: 'Cierre por mail', gap: 0, sig: 0 }
};
function pasoDe(texto) { const m = String(texto || '').match(/^\s*T([1-4])\b/i); return m ? Number(m[1]) : 0; }
function etiquetaPaso(n) { return 'T' + n + ' · ' + PASOS[n].nom.split(' · ')[1]; }
function fechaHabil(dias) {
  const d = new Date(); let n = dias;
  while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) n--; }
  return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
}
function primerNombre(n) {
  const w = String(n || '').trim().split(/\s+/)[0] || '';
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}
function textoPaso(n, nombre) {
  const h = primerNombre(nombre);
  if (n === 1) return 'Hola ' + h + '! ¿Cómo estás? Soy Facundo de Redconar.\nTe quería hacer una pregunta, ¿cuántas horas a la semana se te van respondiendo consultas de vecinos?';
  if (n === 2) return 'Hola ' + h + ', ¿cómo andás? Te escribí días atrás por el tema de las consultas de vecinos. Mirá cómo las responde solo el WhatsApp de Redconar 👇 ' + VIDEO_T2 + '\n¿Cómo lo resolvés hoy en tu administración?';
  if (n === 3) return 'Hola ' + h + ', +800 administraciones ya validan la herramienta. ¿Te muestro en 15 minutos cómo funciona en tu administración?';
  return 'Hola ' + h + ', te escribí por WhatsApp estos días y no quiero ser insistente. Te dejo mi contacto por si más adelante querés ver cómo ordenar las consultas de vecinos. Saludos, Facundo Martinez, Redconar.';
}
const BORRADOR = { 3: true, 4: true };

const PERFILES = [
  ['🚫 Irrelevante', 'descartado', '', 0],
  ['👋 Ya no administra', 'descartado', 'Pedir quién tomó los consorcios', 0],
  ['🧩 Usa otro sistema', 'stand_by', 'Nurturing contenido de valor', 15],
  ['🙂 Interesado', 'tibio', 'Preguntar y ofrecer llamada', 0],
  ['📅 Pide demo', 'caliente', 'Agendar demo y armar legajo', 0],
  ['✅ Pide alta', 'caliente', 'Preparar alta', 0]
];

async function filaDe(tel) {
  try { const r = await api('buscar', { q: tel }); const a = Array.isArray(r) ? r : (r.items || []); return a[0] && a[0].fila; } catch (e) { return null; }
}
async function registrar(x, o) {
  await api('gestion', { nombre: x.nombre || '', apellido: '', empresa: x.empresa || '', telefono: x.telefono || '', id: '', tipo: x.tipo || '',
    mensaje: o.mensaje || '', respuesta: o.respuesta || '', proximo: o.proximo || '', fechaProximo: o.fecha || '', etapa: o.estado || '' });
  if (o.estado) { const f = await filaDe(x.telefono); if (f) { try { await api('estado', { fila: f, estado: o.estado }); } catch (e) { /* sigue */ } } }
  invalidarInicio();
}

function popupRespondio(x, alTerminar) {
  const m = abrirModal('🗨 Respondió: ' + (x.nombre || x.telefono), null);
  m.cuerpo.classList.add('angosto');
  const nota = campo('Qué contestó (opcional)', 'area', ''); nota.rows = 3;
  m.cuerpo.append(nota, el('p', 'suave', '¿Qué es?'));
  PERFILES.forEach(function (p) {
    m.cuerpo.append(boton(p[0], async function () {
      const fecha = p[3] > 0 ? fechaHabil(p[3]) : fechaHabil(0);
      await registrar(x, { respuesta: nota.value || p[0], proximo: p[2], fecha: p[2] ? fecha : '', estado: p[1] });
      aviso('Registrado: ' + p[1]);
      m.cerrar();
      if (['tibio', 'caliente'].indexOf(p[1]) >= 0 || /quién/.test(p[2])) {
        const t = 'Contacto ' + (x.nombre || '') + ' ' + x.telefono + ' respondió: "' + (nota.value || p[0]) + '". Perfil: ' + p[0] + '. Próximo paso: ' + p[2] + '. Preparame la respuesta y lo que haga falta.';
        await copiarYAbrir('VENTAS REDCONAR', armarPrompt('VENTAS REDCONAR', t, null));
      }
      alTerminar();
    }, 'sec'));
  });
}

function tarjeta(x, paso, alTerminar) {
  const k = el('article', 'card');
  const atras = x.dias < 0;
  const cab = el('div'); cab.style.cssText = 'display:flex;justify-content:space-between;gap:8px;align-items:baseline';
  cab.append(el('strong', null, x.nombre || x.empresa || x.telefono), el('span', atras ? 'chip chip-alerta' : 'chip', paso ? etiquetaPaso(paso) : 'Sin paso'));
  k.append(cab);
  const why = el('p', 'suave', 'Tocaba el ' + x.fecha + ' (' + textoPlazo(x.dias).toLowerCase() + ') · ' + (x.proximo || 'sin próximo paso') + (x.tipo ? ' · lista: ' + x.tipo : '') + (x.chat ? ' · de ' + x.chat : ''));
  k.append(why);
  const hist = el('p', 'suave', '');
  k.append(hist);
  const cargarHist = async function () {
    hist.textContent = 'Cargando historial...';
    try {
      const r = await api('contacto', { tel: x.telefono });
      const h = r.historial || [];
      const f = r.ficha || {};
      hist.textContent = [f.estado && 'Estado: ' + f.estado, f.fuentes && 'Fuentes: ' + f.fuentes, h[0] && ('Último (' + h[0].fecha + '): ' + (h[0].respuesta ? 'respondió "' + h[0].respuesta + '"' : h[0].mensaje || h[0].proximo || '')).slice(0, 160)].filter(Boolean).join(' · ') || 'Sin historial previo.';
    } catch (e) { hist.textContent = 'No se pudo cargar el historial.'; }
  };
  k.append(boton('🔎 Ver historial', cargarHist, 'sec'));
  if (!paso) {
    k.append(el('p', 'suave', 'No tiene paso de secuencia. Asignale uno:'));
    [1, 2, 3, 4].forEach(function (n) {
      k.append(boton('Asignar ' + etiquetaPaso(n), async function () { await registrar(x, { proximo: etiquetaPaso(n), fecha: fechaHabil(0) }); aviso('Asignado'); alTerminar(); }, 'sec'));
    });
    k.append(boton('🗨 Respondió', function () { popupRespondio(x, alTerminar); }, 'sec'));
    return k;
  }
  const txt = textoPaso(paso, x.nombre);
  const caja = el('pre'); caja.style.cssText = 'white-space:pre-wrap;font:inherit;background:rgba(127,127,127,.12);padding:10px;border-radius:10px;margin:8px 0';
  caja.textContent = txt;
  k.append(caja);
  if (BORRADOR[paso]) k.append(el('p', 'suave', '⚠ Texto borrador, falta tu aprobación.'));
  const wa = waNumero(x.telefono);
  if (paso < 4 && wa) k.append(boton('💬 Abrir WhatsApp con el mensaje', function () { window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(txt), '_blank'); }));
  k.append(boton('✅ Ya lo envié', async function () {
    const p = PASOS[paso];
    if (p.sig) await registrar(x, { mensaje: txt, proximo: etiquetaPaso(p.sig), fecha: fechaHabil(p.gap) });
    else await registrar(x, { mensaje: txt, proximo: 'Nurturing 1-2 veces al mes', fecha: fechaHabil(20), estado: 'stand_by' });
    aviso(p.sig ? 'Siguiente: ' + etiquetaPaso(p.sig) + ' el ' + fechaHabil(p.gap) : 'Pasó a stand_by');
    alTerminar();
  }, 'sec'));
  k.append(boton('🗨 Respondió', function () { popupRespondio(x, alTerminar); }, 'sec'));
  k.append(boton('🚫 Descartar', async function () { await registrar(x, { respuesta: 'Descartado', estado: 'descartado' }); aviso('Descartado'); alTerminar(); }, 'sec'));
  if (!k.dataset.auto) { k.dataset.auto = 1; }
  return k;
}

function popupCargarLista() {
  const m = abrirModal('➕ Cargar lista a la secuencia', null);
  m.cuerpo.classList.add('angosto');
  const nom = campo('Nombre de la lista (ej: Base Encuentro Facu)', null, '');
  const t = campo('Un contacto por línea: Nombre Apellido 1155551234', 'area', ''); t.rows = 10;
  m.cuerpo.append(nom, t, el('p', 'suave', 'Entran en Toque 1 hoy. Desde ahí la app calcula todos los toques siguientes.'));
  m.cuerpo.append(boton('Cargar', async function () {
    const lineas = t.value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    const vistos = {}; let n = 0, mal = 0;
    for (const l of lineas) {
      const tel = (l.match(/(\d[\d\s-]{6,}\d)\s*(?:\(.*\))?\s*$/) || l.match(/(\d[\d\s-]{6,}\d)/) || [])[1];
      if (!tel) { mal++; continue; }
      const digitos = tel.replace(/\D/g, '');
      if (vistos[digitos]) continue; vistos[digitos] = 1;
      const nombre = l.replace(tel, '').replace(/\(.*?\)/g, '').replace(/[·,;-]+\s*$/, '').trim();
      try { await api('gestion', { nombre: nombre, apellido: '', empresa: '', telefono: digitos, id: '', tipo: nom.value.trim(), mensaje: '', respuesta: '', proximo: etiquetaPaso(1), fechaProximo: fechaHabil(0), etapa: '' }); n++; } catch (e) { mal++; }
      if (n % 10 === 0) aviso(n + ' cargados...');
    }
    invalidarInicio();
    aviso(n + ' cargados' + (mal ? ', ' + mal + ' sin teléfono o con error' : ''));
    m.cerrar(); vistaPanel();
  }));
}

let VISTA_COLA = 'hoy';
vistaPanel = async function () {
  vista.textContent = '';
  vista.append(titulo('Hoy ' + ddmmyyyy(0).slice(0, 5)));
  const barra = el('div'); barra.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px';
  barra.append(boton('▶️ Arrancar (Claude)', function () { arrancar(); }), boton('🧠 Pedido', function () { popupCaja(); }, 'sec'),
    boton('📥 Aplicar resultado', function () { popupAplicar(); }, 'sec'), boton('➕ Cargar lista', popupCargarLista, 'sec'));
  vista.append(barra);
  const estado = el('p', 'suave', 'Cargando...');
  vista.append(estado);
  let d;
  try { d = await datosInicio(true); } catch (e) { estado.textContent = 'No se pudo cargar: ' + e.message; return; }
  estado.textContent = cuandoActualizado();
  const grupos = [['hoy', 'Hoy'], ['vencidos', 'Atrasados'], ['proximos', 'Próximos']];
  const solapas = el('div', 'solapas'), zona = el('div');
  const pintar = function () {
    solapas.textContent = ''; zona.textContent = '';
    grupos.forEach(function (g) { const b = el('button', VISTA_COLA === g[0] ? 'activa' : '', g[1] + ' ' + d.agenda[g[0]].length); b.onclick = function () { VISTA_COLA = g[0]; pintar(); }; solapas.append(b); });
    const items = d.agenda[VISTA_COLA];
    if (!items.length) zona.append(vacio(VISTA_COLA === 'hoy' ? 'Nada para hoy. Cargá una lista o revisá Atrasados.' : 'Nada por acá.'));
    items.slice(0, 40).forEach(function (x) {
      const k = tarjeta(x, pasoDe(x.proximo), function () { vistaPanel(); });
      zona.append(k);
    });
    if (items.length > 40) zona.append(el('p', 'suave', 'Mostrando 40 de ' + items.length + '.'));
  };
  vista.append(solapas, zona);
  pintar();
};
