/* TAREAS: contactos con fecha de próximo paso, en tres solapas claras: Atrasados, Hoy, Próximos. */
const GRUPOS = [['vencidos', '⏰ Atrasados'], ['hoy', '📅 Hoy'], ['proximos', '🔜 Próximos']];

function tarjetaTarea(x) {
  const k = el('article', 'card tocable');
  k.append(el('h2', null, x.nombre || x.empresa || x.telefono));
  if (x.empresa && x.nombre) k.append(el('p', 'suave', x.empresa));
  if (x.proximo) k.append(el('p', null, '👉 ' + x.proximo));
  const fila = el('p', 'chips');
  fila.append(el('span', 'chip' + (x.dias < 0 ? ' chip-alerta' : ''), '🗓 ' + x.fecha + ' · ' + textoPlazo(x.dias)));
  if (x.chat) fila.append(el('span', 'chip', x.chat));
  if (x.tipo) fila.append(el('span', 'chip', x.tipo));
  k.append(fila);
  k.onclick = function () { abrirFicha(x); };
  return k;
}

async function vistaTareas() {
  vista.textContent = '';
  vista.append(titulo('✅ Tareas', 'Tocá un contacto para ver su ficha y escribirle.'));
  const estado = el('p', 'suave', 'Cargando...');
  vista.append(estado);
  let d;
  try { d = await datosInicio(false); } catch (e) { estado.textContent = 'No se pudo cargar: ' + e.message; return; }
  estado.textContent = cuandoActualizado();
  if (!ESTADO.tareas) ESTADO.tareas = d.agenda.vencidos.length ? 'vencidos' : 'hoy';

  const barra = el('div', 'solapas');
  const fChat = lista([['', 'Todos los chats']].concat(CHATS));
  const zona = el('div');
  const pintar = function () {
    barra.textContent = '';
    GRUPOS.forEach(function (g) {
      const n = d.agenda[g[0]].filter(function (x) { return !fChat.value || x.chat === fChat.value; }).length;
      const b = el('button', ESTADO.tareas === g[0] ? 'activa' : '', g[1] + ' ' + n);
      b.onclick = function () { ESTADO.tareas = g[0]; pintar(); };
      barra.append(b);
    });
    zona.textContent = '';
    const l = d.agenda[ESTADO.tareas].filter(function (x) { return !fChat.value || x.chat === fChat.value; });
    if (!l.length) zona.append(vacio('Nada por acá 🎉'));
    l.forEach(function (x) { zona.append(tarjetaTarea(x)); });
  };
  fChat.onchange = pintar;
  vista.append(barra, fChat, zona, boton('🔄 Actualizar', async function () { await datosInicio(true); vistaTareas(); }, 'sec'));
  pintar();
}
