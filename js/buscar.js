/* BUSCAR: por nombre, empresa, mail o teléfono, con filtros por Fuentes, Estado y Tipo. */

async function vistaBuscar() {
  vista.textContent = '';
  vista.append(titulo('BUSCAR', 'Escribí al menos 3 letras, o elegí un filtro. Tocá un resultado para ver su ficha.'));
  const q = campo('Nombre, empresa, mail o teléfono', 'search');
  vista.append(q);

  // Los filtros salen de los datos de inicio (ya en el celular casi siempre).
  let f = { fuentes: [], estados: [], tipos: [] };
  try { f = (await datosInicio(false)).filtros; } catch (e) { /* se busca igual, sin filtros */ }
  const fFuente = lista([['', 'Todas las fuentes']].concat(f.fuentes));
  const fEstado = lista([['', 'Todos los estados']].concat(f.estados));
  const fTipo = lista([['', 'Todos los tipos']].concat(f.tipos));
  vista.append(fFuente, fEstado, fTipo);

  const res = el('div');
  const buscar = async function () {
    res.textContent = 'Buscando...';
    const l = await api('buscar', { q: q.value, fuente: fFuente.value, estado: fEstado.value, tipo: fTipo.value });
    res.textContent = '';
    if (!l.length) res.append(vacio('Sin resultados.'));
    l.forEach(function (c) {
      const k = el('article', 'card tocable');
      k.append(el('h2', null, (c.nombre + ' ' + c.apellido).trim() || c.empresa || 'Sin nombre'));
      if (c.empresa) k.append(el('p', 'suave', c.empresa));
      const datos = [c.telefono, c.email].filter(Boolean).join(' · ');
      if (datos) k.append(el('p', 'suave', datos));
      const est = [c.estado, c.tipo, c.fuentes].filter(Boolean).join(' · ');
      if (est) k.append(el('p', 'suave', est));
      k.onclick = function () { abrirFicha({ fila: c.fila }); };
      res.append(k);
    });
  };
  q.onkeydown = function (e) { if (e.key === 'Enter') buscar().catch(function (x) { res.textContent = x.message; }); };
  vista.append(boton('Buscar', buscar), res);
}
