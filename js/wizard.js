/* Wizard 🪄: base de conocimiento de la app. REGLA: cada cambio en la app suma o corrige una entrada acá. */
const WIZ_VERSION = 'v26';
const WIZ = [
  { t: 'Pantalla Hoy y semáforo', k: 'hoy semaforo colores atrasados gestionar vencidos',
    d: 'Hoy muestra "A gestionar hoy": contactos que tocaban hoy más los atrasados. El color dice hace cuánto: 🟢 verde 0 a 1 día, 🟡 amarillo hasta 7 días, 🔴 rojo más de 7. Tocá los chips de color para filtrar. "Próximos" son los de días siguientes. La app calcula todo sola según la secuencia.' },
  { t: 'Secuencia T1 a T4', k: 'secuencia toque t1 t2 t3 t4 pasos dias habiles stand by nurturing',
    d: 'T1 pregunta (P1+P2) el día 0. T2 video a +2 días hábiles. T3 prueba social a +2. T4 cierre por mail a +3. Después queda stand by y vuelve en +20 días hábiles con nurturing. La app calcula la fecha sola cuando marcás "Ya lo envié" o cuando lo manda el agente.' },
  { t: 'Tarjeta de contacto', k: 'tarjeta contacto enviado respondio descartar historial mensaje whatsapp',
    d: 'Cada tarjeta muestra por qué toca, el historial y el mensaje listo. Botones: 💬 abre WhatsApp con el texto, ✅ Ya lo envié (calcula el próximo paso), 🗨 Respondió (elegís el perfil: interesado, pide demo, otro sistema, ya no administra, irrelevante), 🚫 Descartar (queda registrado).' },
  { t: 'Arrancar', k: 'arrancar agente empezar jornada plan tanda',
    d: 'Toca ▶️ Arrancar y el agente de tu PC lo toma en menos de 1 minuto. Hace solo una cosa sin consultarte: mandar el primer contacto básico (plantilla de su lista) a contactos nuevos sin ninguna contactación. Todo lo demás lo arma como PLAN de hoy (30 a 40 contactos, tandas de 10) y espera tu OK. Si ya hay una orden activa, no crea otra.' },
  { t: 'Panel del agente: progreso, plan y reporte', k: 'agente panel progreso barra plan aprobar corregir reporte orden',
    d: 'Mientras trabaja ves una barra "12 de 30 · enviando a Ana" que se actualiza cada 10 s. Cuando termina una tanda o necesita algo, queda en 🟠 Esperando tu OK: leés el plan con el texto exacto de cada mensaje, lo podés editar, y tocás ✅ OK, enviar esta tanda. ✏️ Corregir le pide un cambio. Al final aparece 📋 Reporte: a quién contactó y qué mandó, quién respondió, descartados, sin WhatsApp, llamadas agendadas, lo que necesita de vos y lo de mañana.' },
  { t: 'Requisitos del agente en la PC', k: 'pc agente prendida chrome whatsapp clientify programador tareas instalar',
    d: 'El agente corre en tu PC (Facu-Work). Debe estar prendida con Chrome abierto, WhatsApp Web y Clientify con sesión iniciada y la extensión de Claude en Chrome. Una tarea de Windows revisa la app cada minuto (gratis) y solo lanza Claude cuando hay una orden. Se apaga con Agente\\DESINSTALAR.bat. El registro está en Agente\\agente.log.' },
  { t: 'Aprobar una plantilla', k: 'aprobar plantilla texto t3 t4 borrador guardar',
    d: 'En una tarjeta de un toque en borrador (hoy T3 y T4) tocá ✏️ Revisar y aprobar texto. Lo editás y ✅ Aprobar y empezar: el agente lo guarda en el proyecto (Plantillas_Campana.txt) como aprobado y lo usa. No se guarda en el celular. Cada mensaje igual lo personaliza el agente, pero por ahora todo pasa por tu OK en el plan.' },
  { t: 'Generar tanda', k: 'generar tanda parametros ufs lista cantidad piloto',
    d: '🎯 Generar tanda arma una lista según parámetros: de qué lista, cuántos, rango de UFs (200 a 1000), solo sin gestión previa, con teléfono, sin descartados/stand by/clientes/perdidos. Ves la vista previa y la cargás a la secuencia. También tiene el botón para cargar la lista piloto.' },
  { t: 'Captura a contactos', k: 'captura foto screenshot ocr imagen contactos',
    d: '📷 Captura → contactos: subís una captura (por ejemplo de WhatsApp o de una lista), la app lee el texto en el celular (OCR) y te propone los contactos para cargarlos. Revisá los datos antes de confirmar: el OCR puede equivocarse.' },
  { t: 'Agenda y llamadas', k: 'agenda calendario llamadas llamar reunion meet agendar hueco',
    d: 'La tarjeta 📅 Agenda trae tus eventos de Google Calendar. Si alguien es interesado o pide demo, la app (o el agente con tu OK) busca el primer hueco libre de 30 min entre 9 y 18 en días hábiles y crea "📞 Llamar a X (WhatsApp)". Las videollamadas van por Meet.' },
  { t: 'Pedido y Aplicar resultado', k: 'pedido caja claude chat ventas datos presupuestos plataforma aplicar resultado',
    d: '🧠 Pedido: escribís o dictás lo que necesitás y la app elige sola el chat de Claude (Ventas, Datos, Presupuestos o Plataforma), arma el prompt con la ficha del contacto y te lleva al chat. 📥 Aplicar resultado: copiás la respuesta de Claude y la app registra todo (gestión y estado) sin que tipees.' },
  { t: 'Cargar lista', k: 'cargar lista contactos csv pegar alta base',
    d: '➕ Cargar lista: pegás contactos (nombre, teléfono, fuente) y la app los da de alta en la Base Viva y los pone en la secuencia en T1.' },
  { t: 'Chats de Claude', k: 'chats links ventas redconar plataforma datos presupuestos',
    d: 'Los cuatro chats (VENTAS, PLATAFORMA, DATOS y PRESUPUESTOS REDCONAR) tienen su link guardado en la app. Cuando mandás algo, la app copia el prompt y abre el chat correcto.' },
  { t: 'Chat de Google (Workspace)', k: 'chat google workspace mensajes espacios responder conversacion',
    d: 'Botón 💬 Chat de Google en Hoy: ves tus espacios y chats directos (ordenados por última actividad), buscás por nombre, abrís una conversación, leés los últimos 30 mensajes y respondés con 📤 Enviar. Usa tu cuenta de Redconar. Si dice que no pudo leer Chat, hay que volver a autorizar el script en Apps Script.' },
  { t: 'Si algo falla', k: 'error falla no anda problema arreglar actualizar version cache',
    d: 'Cerrá la app y volvela a abrir para cargar la última versión (abajo en Ajustes ves el número). Si el agente no responde: verificá que la PC esté prendida con Chrome abierto y mirá Agente\\agente.log. Si una orden queda en error, el motivo está en el panel del agente.' }
];
function wizNorm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function abrirWizard() {
  const m = abrirModal('🪄 Asistente de la app', null);
  const q = campo('¿Qué querés saber? (ej: progreso, plantilla, semáforo)', 'text', '');
  const res = el('div');
  function pintar() {
    res.textContent = '';
    const txt = wizNorm(q.value).split(/\s+/).filter(Boolean);
    const L = WIZ.map(function (x) { const base = wizNorm(x.t + ' ' + x.k + ' ' + x.d); let p = 0; txt.forEach(function (w) { if (base.indexOf(w) >= 0) p++; }); return { x: x, p: p }; })
      .filter(function (r) { return !txt.length || r.p > 0; }).sort(function (a, b) { return b.p - a.p; });
    if (!L.length) res.append(el('p', 'suave', 'No encontré eso en la guía.'));
    L.forEach(function (r) {
      const d = el('details'); if (txt.length && L.length <= 2) d.open = true;
      d.append(el('summary', null, r.x.t), el('p', null, r.x.d)); res.append(d);
    });
    res.append(boton('🧠 Preguntarle a Claude', async function () {
      const pregunta = q.value || 'Explicame cómo se usa la app';
      await copiarYAbrir('PLATAFORMA REDCONAR', 'Pregunta sobre cómo usar la app Redconar (versión ' + WIZ_VERSION + '): ' + pregunta);
    }, 'sec'));
  }
  q.addEventListener('input', pintar);
  m.cuerpo.append(q, res); pintar();
}
(function () { const v = document.getElementById('varita'); if (v) v.onclick = function () { abrirWizard(); }; })();
