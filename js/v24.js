/* v24: panel del agente con progreso, plan por tandas y reporte */
let TM_AG = null;
panelAgente = async function (caja) {
  clearTimeout(TM_AG);
  caja.textContent = '';
  caja.append(el('h2', null, '🤖 Agente'));
  let r;
  try { r = await api('ordenes'); } catch (e) { caja.append(el('p', 'suave', 'No se pudieron leer las órdenes.')); return; }
  const L = r.ordenes || [];
  if (!L.length) { caja.append(el('p', 'suave', 'Todavía no hay órdenes. Tocá Arrancar.')); return; }
  const o = L.filter(function (x) { return x.estado === 'espera_ok'; })[0] || L.filter(function (x) { return ['pendiente', 'en_curso', 'aprobada', 'corregir'].indexOf(x.estado) >= 0; })[0] || L[0];
  const activo = ['pendiente', 'en_curso', 'aprobada', 'corregir'].indexOf(o.estado) >= 0;
  const k = el('article', 'card');
  const col = { pendiente: '🟡 En cola', en_curso: '🔵 Trabajando', aprobada: '🔵 Trabajando', corregir: '🔵 Corrigiendo', espera_ok: '🟠 Esperando tu OK', hecha: '🟢 Terminó', error: '🔴 Error' }[o.estado] || o.estado;
  k.append(el('strong', null, col + ' · ' + o.tipo), el('p', 'suave', o.fecha));
  if (activo) {
    const m = /PROGRESO\s+(\d+)\/(\d+)\s*\|\s*(.*)/.exec(o.resultado || '');
    const hechos = m ? +m[1] : 0, total = m ? +m[2] : 0;
    const pct = total ? Math.min(100, Math.round(hechos / total * 100)) : 8;
    const bar = el('div'); bar.style.cssText = 'height:14px;background:#2a2f3a;border-radius:8px;overflow:hidden;margin:8px 0';
    const fill = el('div'); fill.style.cssText = 'height:100%;width:' + pct + '%;background:#3b82f6;transition:width .5s';
    bar.append(fill); k.append(bar);
    k.append(el('p', null, (total ? hechos + ' de ' + total + ' · ' : '') + (m ? m[3] : o.estado === 'pendiente' ? 'Esperando que el agente la tome (menos de 1 minuto)' : 'Trabajando')));
    TM_AG = setTimeout(function () { if (document.body.contains(caja)) panelAgente(caja); }, 10000);
  }
  if (o.estado === 'espera_ok') {
    const m = /PROGRESO\s+(\d+)\/(\d+)/.exec(o.resultado || '');
    if (m) k.append(el('p', 'suave', 'Hechos hasta ahora: ' + m[1] + ' de ' + m[2]));
    k.append(el('p', 'suave', '✋ Revisá, editá si querés y aprobá. Solo se envía lo que apruebes.'));
    const t = campo('Plan / tanda', 'area', o.propuesta || ''); t.rows = 14; k.append(t);
    k.append(boton('✅ OK, enviar esta tanda', async function () { await api('ordenResponder', { id: o.id, estado: 'aprobada', respuesta: 'OK. Aprobado. Texto final:\n' + t.value }); aviso('Aprobado, el agente arranca'); panelAgente(caja); }));
    k.append(boton('✏️ Corregir', async function () { const c = prompt('¿Qué cambio?'); if (!c) return; await api('ordenResponder', { id: o.id, estado: 'corregir', respuesta: c }); aviso('Enviado'); panelAgente(caja); }, 'sec'));
  }
  if (o.estado === 'hecha' || o.estado === 'error') {
    const rep = el('pre', null, o.resultado || '(sin reporte)'); rep.style.cssText = 'white-space:pre-wrap;font:inherit;margin:6px 0';
    k.append(el('h3', null, o.estado === 'hecha' ? '📋 Reporte' : 'Motivo'), rep);
  }
  caja.append(k);
  if (L.length > 1) {
    const h = el('details'); h.append(el('summary', 'suave', 'Órdenes anteriores'));
    L.filter(function (x) { return x !== o; }).slice(0, 7).forEach(function (x) { h.append(el('p', 'suave', x.fecha + ' · ' + x.tipo + ' · ' + x.estado)); });
    caja.append(h);
  }
  caja.append(boton('🔄 Actualizar', function () { panelAgente(caja); }, 'sec'));
};

/* Arrancar: sin duplicados, y lo toma el agente de la PC en menos de 1 minuto */
arrancar = async function () {
  let r;
  try { r = await api('ordenes'); } catch (e) { aviso('Error: ' + e.message); return; }
  const act = (r.ordenes || []).filter(function (x) { return ['pendiente', 'en_curso', 'aprobada', 'corregir', 'espera_ok'].indexOf(x.estado) >= 0; })[0];
  if (act) { aviso(act.estado === 'espera_ok' ? 'Hay un plan esperando tu OK' : 'El agente ya está trabajando'); vistaPanel(); return; }
  const dias = ddmmyyyy(0);
  const texto = 'ARRANCAR ' + dias + '. Mirá la cola de gestión de la app (inicio) y trabajá según tus instrucciones.';
  try { await api('ordenNueva', { tipo: 'arrancar', texto: texto }); } catch (e) { aviso('Error: ' + e.message); return; }
  aviso('Listo. El agente de tu PC la toma en menos de 1 minuto');
  vistaPanel();
};

/* Aprobar texto: queda guardado en el proyecto (lo hace el agente) y arranca */
popupAprobarTexto = function (paso, nombre) {
  const m = abrirModal('✏️ Texto del ' + PASOS[paso].nom.split(' · ')[0], null);
  m.cuerpo.classList.add('angosto');
  const t = campo('Texto base (el nombre se pone solo)', 'area', textoPaso(paso, nombre).split(primerNombre(nombre)).join('{n}')); t.rows = 7;
  m.cuerpo.append(t, el('p', 'suave', 'Al aprobar, el agente lo guarda como plantilla aprobada en el proyecto y empieza a usarlo. Cada mensaje lo personaliza él.'));
  m.cuerpo.append(boton('✅ Aprobar y empezar', async function () {
    const g = textosGuardados(); g[paso] = t.value; guardarLocal(CLAVE_TEXTOS, g); BORRADOR[paso] = false;
    m.cerrar();
    try { await api('ordenNueva', { tipo: 'aprobar_plantilla', texto: 'APROBÉ la plantilla del ' + PASOS[paso].nom + ' ({n} = primer nombre):\n\n' + t.value }); aviso('Aprobada. El agente la guarda y arranca'); } catch (e) { aviso('Error: ' + e.message); }
    vistaPanel();
  }));
};
