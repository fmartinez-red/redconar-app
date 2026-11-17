/* v20: caja única con ruteo a chat, Aplicar resultado, Arrancar (cola del día). */

const SECUENCIA = [
  [0, 'Día 0: P1 + P2 juntos (plantilla Base Encuentro)'],
  [2, 'Día +2: Touch 2 (video + "Cómo lo resolvés hoy en tu administración?")'],
  [4, 'Día +4: Touch 3 (prueba social)'],
  [7, 'Día +7: mail de cierre y pasa a stand_by']
];
const RUTAS = [
  ['PRESUPUESTOS REDCONAR', /presupuest|cotiz|precio|tarifa|propuesta|\bUF\b|descuento/i],
  ['DATOS REDCONAR', /planilla|excel|sheet|cruce|cruzar|limpi|base de datos|duplicad|csv|lista de contactos|importar/i],
  ['PLATAFORMA REDCONAR', /redconar\.net|plataforma|landing|sitio|web\b|formulario|bug|app\b/i]
];
function rutear(texto) {
  for (let i = 0; i < RUTAS.length; i++) if (RUTAS[i][1].test(texto)) return RUTAS[i][0];
  return 'VENTAS REDCONAR';
}
const FORMATO_RESULTADO =
  'AL TERMINAR respondé con un bloque así (JSON válido, una entrada por contacto trabajado, fechas dd/mm/aaaa):\n' +
  'RESULTADO\n```json\n[{"nombre":"","apellido":"","empresa":"","telefono":"","fila":"","estado":"","mensaje":"","respuesta":"","proximo":"","fechaProximo":"","tipo":""}]\n```\n' +
  'Aplicá Redconar/Protocolo_Prospeccion_Sistematica.md (secuencia, registro, reglas). Calculá fechaProximo con la secuencia (días hábiles) y escribí proximo empezando con T2, T3, T4 o la acción (ej: "T2 · Touch 2 video").';

function armarPrompt(chat, texto, ficha) {
  let p = 'Hoy es ' + ddmmyyyy(0) + '. Pedido para ' + chat + ':\n' + texto.trim();
  if (ficha) {
    p += '\n\nFicha del contacto: ' + [ficha.nombre + ' ' + (ficha.apellido || ''), ficha.empresa, 'tel ' + ficha.telefono, ficha.email, 'estado ' + ficha.estado,
      ficha.ultimoContacto && 'último contacto ' + ficha.ultimoContacto, ficha.proximoPaso && 'próximo paso ' + ficha.proximoPaso, ficha.fila && 'fila ' + ficha.fila].filter(Boolean).join(' | ');
  }
  return p + '\n\n' + FORMATO_RESULTADO;
}

function popupCaja(textoInicial) {
  const m = abrirModal('🧠 Pedido', null);
  m.cuerpo.classList.add('angosto');
  const t = campo('Qué necesitás (no hace falta elegir el chat)', 'area', textoInicial || '');
  t.rows = 6;
  const destino = el('p', 'suave', 'Chat: VENTAS REDCONAR');
  const fichaBox = el('div');
  let chat = 'VENTAS REDCONAR', ficha = null, ultimaQ = '';
  const detectar = async function () {
    chat = rutear(t.value);
    destino.textContent = 'Chat: ' + chat;
    const mm = t.value.match(/([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)/);
    const q = mm ? mm[1] : '';
    if (q && q !== ultimaQ) {
      ultimaQ = q;
      try {
        const r = await api('buscar', { q: q });
        const arr = Array.isArray(r) ? r : (r.items || []);
        ficha = arr[0] || null;
      } catch (e) { ficha = null; }
      fichaBox.textContent = '';
      if (ficha) fichaBox.append(el('p', 'suave', '👤 ' + (ficha.nombre || '') + ' ' + (ficha.apellido || '') + ' · ' + (ficha.estado || 'sin estado') + ' (se agrega al prompt)'));
    }
  };
  t.oninput = function () { destino.textContent = 'Chat: ' + rutear(t.value); clearTimeout(detectar.t); detectar.t = setTimeout(detectar, 700); };
  m.cuerpo.append(t, destino, fichaBox);
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let rec = null;
    const mic = boton('🎤 Dictar', function () {
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = 'es-AR'; rec.interimResults = false; rec.continuous = true;
      rec.onresult = function (e) { let s = ''; for (let i = e.resultIndex; i < e.results.length; i++) s += e.results[i][0].transcript; t.value += (t.value && !/\s$/.test(t.value) ? ' ' : '') + s; t.oninput(); };
      rec.onend = function () { rec = null; mic.textContent = '🎤 Dictar'; };
      rec.start(); mic.textContent = '⏹ Parar';
    }, 'sec');
    m.cuerpo.append(mic);
  }
  const sel = lista(CHATS, 'VENTAS REDCONAR');
  sel.onchange = function () { chat = sel.value; destino.textContent = 'Chat: ' + chat + ' (manual)'; t.oninput = null; };
  m.cuerpo.append(el('p', 'suave', 'Cambiar chat:'), sel);
  m.cuerpo.append(boton('📤 Ir al chat con el prompt listo', async function () {
    if (!t.value.trim()) { aviso('Escribí el pedido'); return; }
    if (!ficha) await detectar();
    await copiarYAbrir(chat, armarPrompt(chat, t.value, ficha));
    m.cerrar();
  }));
  m.cuerpo.append(boton('📥 Aplicar resultado', function () { m.cerrar(); popupAplicar(); }, 'sec'));
}

/* ---------- Aplicar resultado ---------- */
function extraerResultado(txt) {
  let s = String(txt || '');
  const i = s.search(/RESULTADO/i);
  if (i >= 0) s = s.slice(i);
  const f = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let j = f ? f[1] : s.slice(Math.min.apply(null, ['[', '{'].map(function (c) { const k = s.indexOf(c); return k < 0 ? 1e9 : k; })));
  const a = JSON.parse(j.trim());
  return Array.isArray(a) ? a : [a];
}
async function popupAplicar() {
  const m = abrirModal('📥 Aplicar resultado', null);
  m.cuerpo.classList.add('angosto');
  const caja = campo('Pegá acá la respuesta del chat (o tocá "Leer portapapeles")', 'area', '');
  caja.rows = 6;
  const prev = el('div');
  let items = [];
  const leer = function () {
    prev.textContent = '';
    try { items = extraerResultado(caja.value); } catch (e) { items = []; prev.append(el('p', 'suave', 'No encuentro el bloque RESULTADO en el texto.')); return; }
    prev.append(el('p', null, items.length + ' contacto(s) a registrar:'));
    items.forEach(function (x) {
      prev.append(el('p', 'suave', '• ' + [x.nombre, x.apellido].filter(Boolean).join(' ') + (x.estado ? ' → ' + x.estado : '') + (x.proximo ? ' · ' + x.proximo : '') + (x.fechaProximo ? ' (' + x.fechaProximo + ')' : '')));
    });
  };
  caja.oninput = leer;
  m.cuerpo.append(boton('📋 Leer portapapeles', async function () {
    try { caja.value = await navigator.clipboard.readText(); } catch (e) { aviso('Pegalo a mano'); return; }
    leer();
  }, 'sec'), caja, prev);
  m.cuerpo.append(boton('✅ Aplicar', async function () {
    if (!items.length) { aviso('Nada para aplicar'); return; }
    let n = 0, err = 0;
    for (const x of items) {
      try {
        await api('gestion', { nombre: x.nombre || '', apellido: x.apellido || '', empresa: x.empresa || '', telefono: x.telefono || '', id: x.id || '', tipo: x.tipo || '',
          mensaje: x.mensaje || '', respuesta: x.respuesta || '', proximo: x.proximo || '', fechaProximo: x.fechaProximo || '', etapa: x.estado || '' });
        if (x.fila && x.estado) await api('estado', { fila: x.fila, estado: x.estado });
        n++;
      } catch (e) { err++; }
    }
    invalidarInicio();
    aviso(n + ' registrados' + (err ? ', ' + err + ' con error' : ''));
    m.cerrar();
  }));
  try { const c = await navigator.clipboard.readText(); if (/RESULTADO/i.test(c)) { caja.value = c; leer(); } } catch (e) { /* manual */ }
}

/* ---------- Arrancar: cola del día ---------- */
async function arrancar() {
  let d;
  try { d = await datosInicio(true); } catch (e) { aviso('No se pudo cargar: ' + e.message); return; }
  const cola = d.agenda.vencidos.concat(d.agenda.hoy);
  const hora = new Date().getHours();
  const franja = hora < 13 ? 'Mañana (9-13): contactación intensa, 3 tandas de 10 con chequeo previo.' : 'Tarde (13-18): seguimiento y respuestas.';
  let p = 'ARRANCAR. Hoy es ' + ddmmyyyy(0) + '. ' + franja + '\nRevisá mi Google Calendar (9-18) y no pises bloques.\n' +
    'Cola de hoy (' + cola.length + ' por vencer o atrasados):\n' +
    cola.slice(0, 60).map(function (x) { return '- ' + (x.nombre || x.empresa || x.telefono) + ' · ' + x.telefono + ' · ' + (x.proximo || '') + ' · ' + (x.dias < 0 ? 'atrasado ' + (-x.dias) + 'd' : 'hoy'); }).join('\n') +
    '\n\nSecuencia: ' + SECUENCIA.map(function (s) { return s[1]; }).join(' | ') + '\n' +
    'Primero revisá respuestas nuevas en WhatsApp Web y clasificalas. Después ejecutá la cola según el protocolo, registrando cada acción.\n\n' + FORMATO_RESULTADO;
  await copiarYAbrir('VENTAS REDCONAR', p);
}

ATAJOS.caja = ['🧠', 'Pedido', function () { popupCaja(); }];
ATAJOS.aplicar = ['📥', 'Aplicar', function () { popupAplicar(); }];
ATAJOS.arrancar = ['▶️', 'Arrancar', function () { arrancar(); }];
ATAJOS.claude = ['🧠', 'Pedido', function () { popupCaja(); }];
popupDictar = function () { popupCaja(); };
ATAJOS_DEF.splice(0, ATAJOS_DEF.length, 'arrancar', 'caja', 'aplicar', 'nuevo', 'chats', 'semana', 'plantillas', 'config');
