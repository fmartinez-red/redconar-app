/* v14: nuevo contacto (texto/foto), historial de gestionados por etapas, cruce con WhatsApp. */

function extraerContacto(t) {
  const o = { nombre: '', apellido: '', empresa: '', telefono: '', email: '', notas: '' };
  const mail = t.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/);
  if (mail) o.email = mail[0];
  const tels = (t.replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, ' ').match(/(\+?\d[\d\s().-]{7,17}\d)/g) || []).map(function (x) { return x.trim(); });
  if (tels.length) o.telefono = tels[0].replace(/[^\d+]/g, '');
  const lineas = t.split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
  const libres = lineas.filter(function (l) { return !/@/.test(l) && !/\d{6,}/.test(l.replace(/[\s().-]/g, '')); });
  libres.forEach(function (l) {
    const s = l.replace(/^(nombre|name|contacto|empresa|administraci[oó]n)\s*[:=-]\s*/i, '');
    if (/admin|estudio|consorcio|s\.?r\.?l|propiedades/i.test(s) && !o.empresa) o.empresa = s;
    else if (!o.nombre && s.length < 60) { const p = s.split(/\s+/); o.nombre = p[0]; o.apellido = p.slice(1).join(' '); }
  });
  if (!o.nombre && o.email) o.nombre = o.email.split('@')[0];
  return o;
}

function comprimirFoto(archivo) {
  return new Promise(function (ok, mal) {
    const img = new Image(), url = URL.createObjectURL(archivo);
    img.onload = function () {
      const k = Math.min(1, 1400 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL('image/jpeg', 0.8).split(',')[1]);
    };
    img.onerror = function () { mal(new Error('No se pudo leer la foto')); };
    img.src = url;
  });
}

function popupNuevoContacto() {
  const m = abrirModal('➕ Nuevo contacto');
  const c = m.cuerpo;
  c.append(el('p', 'suave', 'Pegá un texto, sacá una foto o completá a mano. Se carga en la base y empezás a gestionar.'));
  const pega = campo('📋 Pegá acá el texto (mensaje, firma, tarjeta...)', 'area');
  pega.rows = 3;
  const nom = campo('Nombre'), ape = campo('Apellido'), emp = campo('Administración / empresa'), tel = campo('Teléfono (con característica)', 'tel'), mail = campo('Mail', 'email');
  const bExt = boton('🪄 Extraer datos del texto', function () {
    const o = extraerContacto(pega.value);
    if (o.nombre) nom.value = o.nombre;
    if (o.apellido) ape.value = o.apellido;
    if (o.empresa) emp.value = o.empresa;
    if (o.telefono) tel.value = o.telefono;
    if (o.email) mail.value = o.email;
    aviso('Revisá los datos');
  }, 'sec');
  const fuente = lista([['Lead Magnet', 'Origen: Lead Magnet'], ['Evento', 'Origen: Evento'], ['Referido', 'Origen: Referido'], ['Llamado en frío', 'Origen: Llamado en frío'], ['WhatsApp entrante', 'Origen: WhatsApp entrante'], ['Otro', 'Origen: Otro']]);
  const accion = lista([['plantilla', 'Después: mandar plantilla Lead Magnet'], ['cargar', 'Después: solo cargar'], ['llamar', 'Después: llamar']]);
  const notas = campo('Notas (opcional)', 'area');
  notas.rows = 2;
  const foto = el('input');
  foto.type = 'file'; foto.accept = 'image/*'; foto.setAttribute('capture', 'environment');
  c.append(pega, bExt, nom, ape, emp, tel, mail, fuente, accion, notas, el('p', 'suave', '📷 Foto (tarjeta, captura de chat, lista). Opcional.'), foto);

  const datos = function () { return { nombre: nom.value.trim(), apellido: ape.value.trim(), empresa: emp.value.trim(), telefono: tel.value.trim(), email: mail.value.trim(), fuente: fuente.value, notas: notas.value.trim() }; };

  c.append(boton('✅ Cargar y gestionar ahora', async function () {
    const d = datos();
    if (!d.nombre && !d.telefono && !d.email && !d.empresa) { aviso('Falta al menos nombre, teléfono o mail'); return; }
    const r = await api('contactoNuevo', d);
    invalidarInicio();
    aviso(r.existia ? 'Ya estaba en la base: se abre su ficha' : 'Cargado en Base Viva');
    m.cerrar();
    popupContacto({ fila: r.fila, telefono: d.telefono });
  }), boton('📤 Mandar al chat de VENTAS (él carga y gestiona)', async function () {
    const d = datos();
    if (!d.nombre && !d.telefono && !d.email && !d.empresa && !pega.value.trim() && !foto.files[0]) { aviso('Pegá un texto, sacá una foto o completá datos'); return; }
    let link = '';
    if (foto.files[0]) { aviso('Subiendo foto...'); link = (await api('subirFoto', { base64: await comprimirFoto(foto.files[0]) })).url; }
    const que = { plantilla: 'enviar la plantilla de WhatsApp Lead Magnet', cargar: 'solo cargarlo y dejar el próximo paso', llamar: 'dejarlo para llamar' }[accion.value];
    await api('pedido', {
      chat: 'VENTAS REDCONAR', tipo: 'SEGUIMIENTO', prioridad: 'alta', contacto: (d.nombre + ' ' + d.apellido).trim() || d.empresa || 'CONTACTO NUEVO', telefono: d.telefono, email: d.email, clientifyId: '',
      detalle: 'CONTACTO NUEVO desde la app. Origen: ' + d.fuente + '. Acción pedida: ' + que + '.\n' +
        'Cargarlo en Base Viva (si no está), crearlo en Clientify con etiqueta del origen, registrar la gestión y empezar a gestionarlo.' +
        (link ? '\nFOTO (leerla para sacar los datos): ' + link : '') +
        (pega.value.trim() ? '\nTEXTO PEGADO:\n' + pega.value.trim().slice(0, 1200) : '') +
        (d.empresa ? '\nEmpresa: ' + d.empresa : '') + (d.notas ? '\nNotas: ' + d.notas : '')
    });
    invalidarInicio();
    aviso('Pedido dejado a VENTAS');
    m.cerrar();
  }, 'sec'));
}

/* ---------- GESTIONADOS por etapas (historial) ---------- */
bloqueGestionados = function () {
  const G = leerLocal('redconar_gestper', { per: '1', desde: '', hasta: '' });
  const caja = el('section', 'card');
  caja.id = 'g-gest';
  const cab = el('h2', null, '✅ Gestionados');
  const per = lista(PERIODOS, G.per);
  const d1 = campo('', 'date', G.desde), d2 = campo('', 'date', G.hasta);
  const fechas = el('div');
  fechas.append(el('p', 'suave', 'Desde'), d1, el('p', 'suave', 'Hasta'), d2);
  fechas.style.display = G.per === 'x' ? 'block' : 'none';
  const pills = el('div', 'pills'), zona = el('div');
  caja.append(cab, per, fechas, pills, zona);
  let items = [], etapaSel = '';

  async function cargar() {
    G.per = per.value; G.desde = d1.value; G.hasta = d2.value;
    guardarLocal('redconar_gestper', G);
    fechas.style.display = G.per === 'x' ? 'block' : 'none';
    let desde, hasta = new Date();
    if (G.per === 'x') {
      if (!G.desde || !G.hasta) { zona.textContent = ''; zona.append(vacio('Elegí las dos fechas.')); return; }
      desde = G.desde; hasta = G.hasta;
    } else { const a = new Date(); a.setDate(a.getDate() - (Number(G.per) - 1)); desde = isoLocal(a); hasta = isoLocal(hasta); }
    zona.textContent = ''; zona.append(vacio('Cargando...'));
    try { items = (await api('historial', { desde: desde, hasta: hasta })).items; }
    catch (e) { zona.textContent = ''; zona.append(vacio(e.message)); return; }
    cab.textContent = '✅ Gestionados (' + items.length + ')';
    pintar();
  }

  function pintar() {
    zona.textContent = ''; pills.textContent = '';
    if (!items.length) { zona.append(vacio('Sin contactos gestionados en este período.')); return; }
    const cuenta = {};
    items.forEach(function (x) { cuenta[x.etapa] = (cuenta[x.etapa] || 0) + 1; });
    const todo = el('button', 'pill' + (!etapaSel ? ' on' : ''), 'Todas');
    todo.append(el('small', null, String(items.length)));
    todo.onclick = function () { etapaSel = ''; pintar(); };
    pills.append(todo);
    ETAPAS.concat(Object.keys(cuenta).filter(function (k) { return ETAPAS.indexOf(k) < 0; })).forEach(function (e) {
      if (!cuenta[e]) return;
      const b = el('button', 'pill' + (etapaSel === e ? ' on' : ''), e);
      b.append(el('small', null, String(cuenta[e])));
      b.onclick = function () { etapaSel = etapaSel === e ? '' : e; pintar(); };
      pills.append(b);
    });
    const vis = items.filter(function (x) { return !etapaSel || x.etapa === etapaSel; });
    const sel = {}, lis = el('div'), barra = el('div', 'barra-sel');
    const elegidos = function () { return vis.filter(function (x) { return sel[x.fila]; }); };
    const objetivo = function () { const e = elegidos(); return e.length ? e : vis.filter(function (x) { return !x.respuesta && x.etapa !== 'Respondió'; }); };
    const pintarBarra = function () { barra.style.display = Object.keys(sel).length ? 'block' : 'none'; };
    function filas() {
      lis.textContent = '';
      vis.forEach(function (x) {
        const k = el('div', 'fila'), t = el('div', 'tocable');
        const ch = el('p', 'chips'), e = el('span', 't-chip', x.etapa);
        e.style.background = COLOR_ETAPA[x.etapa] || '#475569';
        ch.append(e);
        t.append(el('strong', null, x.nombre || x.empresa || x.telefono), el('p', 'suave', x.fecha + ' · ' + (x.mensaje || '').slice(0, 60)), ch);
        if (x.respuesta) t.append(el('p', 'plazo', '💬 ' + x.respuesta.slice(0, 70)));
        t.onclick = function () { popupContacto({ telefono: x.telefono, nombre: x.nombre, empresa: x.empresa }); };
        k.append(casilla(Boolean(sel[x.fila]), function (v) { if (v) sel[x.fila] = 1; else delete sel[x.fila]; pintarBarra(); }), t);
        lis.append(k);
      });
      pintarBarra();
    }
    const etapaSelect = lista(ETAPAS.map(function (x) { return [x, 'Pasar a: ' + x]; }));
    barra.append(etapaSelect, boton('Aplicar etapa a los elegidos', async function () {
      const f = elegidos();
      for (let i = 0; i < f.length; i++) {
        const x = f[i], p = (x.nombre || '').split(' ');
        await api('gestion', { nombre: p[0] || '', apellido: p.slice(1).join(' '), empresa: x.empresa, telefono: x.telefono, tipo: '', mensaje: 'Etapa: ' + etapaSelect.value, respuesta: x.respuesta || '', proximo: '', fechaProximo: '', etapa: etapaSelect.value });
        x.etapa = etapaSelect.value; delete sel[x.fila];
      }
      invalidarInicio(); aviso('Etapa actualizada'); pintar();
    }, 'sec'));
    zona.append(boton('☑ Seleccionar todos los de esta vista', function () { vis.forEach(function (x) { sel[x.fila] = 1; }); filas(); }, 'sec'), lis, barra,
      boton('🔎 Cruzar con WhatsApp (elegidos o sin respuesta)', async function () {
        const f = objetivo();
        if (!f.length) { aviso('No hay contactos sin respuesta en esta vista'); return; }
        await api('pedido', {
          chat: 'VENTAS REDCONAR', tipo: 'SEGUIMIENTO', prioridad: 'alta', contacto: 'CRUCE WHATSAPP ' + f.length + ' CONTACTOS', telefono: '', email: '', clientifyId: '',
          detalle: 'Cruzar con WhatsApp Web estos contactos gestionados por Facu (leer solo estos chats, sin abrir los demás). Para cada uno: si respondió, registrar la respuesta y la etapa en Log_Actividades y en Base Viva (y nota en Clientify); si no respondió, dejarlo en "Sin respuesta" con próximo paso. Traerme resumen: quiénes respondieron, quiénes no y qué sigue. Si alguno no está en Base Viva, cargarlo.\n' +
            f.map(function (x) { return '- ' + (x.nombre || x.empresa) + ' | ' + x.telefono + ' | etapa: ' + x.etapa; }).join('\n')
        });
        invalidarInicio();
        aviso('Pedido de cruce dejado a VENTAS (' + f.length + ')');
      }, 'wa'));
    filas();
  }
  [per, d1, d2].forEach(function (x) { x.onchange = cargar; });
  cargar();
  return caja;
};
