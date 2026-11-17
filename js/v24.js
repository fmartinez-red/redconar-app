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
  const o = L[0];
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
    L.slice(1, 8).forEach(function (x) { h.append(el('p', 'suave', x.fecha + ' · ' + x.tipo + ' · ' + x.estado)); });
    caja.append(h);
  }
  caja.append(boton('🔄 Actualizar', function () { panelAgente(caja); }, 'sec'));
};
