/* HOY: lo que hay que contactar, separado en Vencidos, Hoy y Próximos. */

const DIAS_VENCIDOS_VISIBLES = 7; // los vencidos con mas atraso que esto van colapsados

function tarjetaAgenda(x) {
  const k = el('article', 'card tocable');
  k.append(el('h2', null, x.nombre || x.empresa || x.telefono));
  if (x.empresa && x.nombre) k.append(el('p', 'suave', x.empresa));
  if (x.proximo) k.append(el('p', null, x.proximo));
  const fecha = el('p', x.dias < 0 ? 'plazo atrasado' : 'plazo', x.fecha + ' · ' + textoPlazo(x.dias));
  k.append(fecha);
  const etiquetas = [x.chat, x.tipo].filter(Boolean).join(' · ');
  if (etiquetas) k.append(el('p', 'suave', etiquetas));
  k.onclick = function () { abrirFicha(x); };
  return k;
}

function grupoAgenda(nombre, lista_, ayuda) {
  const s = bloque(nombre + ' (' + lista_.length + ')', ayuda);
  if (!lista_.length) s.append(vacio('Nada por acá.'));
  return s;
}

async function vistaHoy() {
  vista.textContent = '';
  vista.append(titulo('HOY', 'Contactos con fecha de próximo paso. Tocá uno para ver su ficha.'));
  const estado = el('p', 'suave', 'Cargando...');
  vista.append(estado);
  let d;
  try { d = await datosInicio(false); } catch (e) { estado.textContent = 'No se pudo cargar: ' + e.message; return; }
  estado.textContent = cuandoActualizado();

  const filtros = el('div', 'filtros');
  const fChat = lista([['', 'Todos los chats']].concat(CHATS));
  const tipos = d.filtros.tipos.length ? d.filtros.tipos : [];
  const fTipo = lista([['', 'Todos los tipos']].concat(tipos));
  const actualizar = boton('Actualizar', async function () { await datosInicio(true); vistaHoy(); }, 'sec');
  filtros.append(fChat, fTipo, actualizar);
  vista.append(filtros);

  const zona = el('div');
  vista.append(zona);
  const pintar = function () {
    zona.textContent = '';
    const ok = function (x) { return (!fChat.value || x.chat === fChat.value) && (!fTipo.value || x.tipo === fTipo.value); };
    const venc = d.agenda.vencidos.filter(ok);
    const recientes = venc.filter(function (x) { return -x.dias <= DIAS_VENCIDOS_VISIBLES; });
    const viejos = venc.filter(function (x) { return -x.dias > DIAS_VENCIDOS_VISIBLES; });

    const gV = grupoAgenda('Vencidos', venc, 'Pasó la fecha y no hay una gestión nueva. Primero los menos atrasados.');
    recientes.forEach(function (x) { gV.append(tarjetaAgenda(x)); });
    if (viejos.length) {
      const det = el('details');
      det.append(el('summary', null, 'Con más de ' + DIAS_VENCIDOS_VISIBLES + ' días de atraso (' + viejos.length + ')'));
      viejos.forEach(function (x) { det.append(tarjetaAgenda(x)); });
      gV.append(det);
    }
    zona.append(gV);

    const hoy = d.agenda.hoy.filter(ok);
    const gH = grupoAgenda('Hoy', hoy, 'Les toca hoy.');
    hoy.forEach(function (x) { gH.append(tarjetaAgenda(x)); });
    zona.append(gH);

    const prox = d.agenda.proximos.filter(ok);
    const gP = grupoAgenda('Próximos', prox, 'Los próximos 14 días.');
    prox.forEach(function (x) { gP.append(tarjetaAgenda(x)); });
    zona.append(gP);
  };
  fChat.onchange = pintar;
  fTipo.onchange = pintar;
  pintar();
}
