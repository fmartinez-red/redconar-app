/* v26: Google Chat dentro de la app (ver espacios y mensajes, responder) */
let CWS_ESP = null;
function cwsNombre(s) { return String(s.nombre || '').split(', ').filter(function (x) { return x !== 'Facundo Martinez'; }).join(', ') || s.nombre || 'Chat'; }
function cwsHora(f) { try { const d = new Date(f); return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
function abrirChatWS() { return irA('GOOGLE'); }
async function vistaGoogle() {
  vista.textContent = '';
  vista.append(titulo('🗨️ Chat de Google', 'Tus chats de Google Workspace: ves quién te escribió y respondés desde acá.'));
  const cont = el('div'); vista.append(cont);
  async function lista() {
    cont.textContent = '';
    const q = campo('Buscar chat o persona', 'text', '');
    const res = el('div'); cont.append(q, res);
    res.append(el('p', 'suave', 'Cargando...'));
    try { if (!CWS_ESP) CWS_ESP = (await api('chatEspacios')).espacios; } catch (e) { res.textContent = ''; res.append(el('p', null, 'No se pudo leer Chat: ' + e.message)); return; }
    function pintar() {
      res.textContent = '';
      const t = (q.value || '').toLowerCase();
      CWS_ESP.filter(function (s) { return !t || cwsNombre(s).toLowerCase().indexOf(t) >= 0; }).slice(0, 60).forEach(function (s) {
        const b = el('button', 'tarjeta-chat', (s.tipo === 'DIRECT_MESSAGE' ? '👤 ' : '👥 ') + cwsNombre(s) + (s.ultima ? '  ·  ' + cwsHora(s.ultima) : ''));
        b.style.cssText = 'display:block;width:100%;text-align:left;padding:10px;margin:4px 0;border-radius:8px;border:1px solid #333;background:transparent;color:inherit;font:inherit';
        b.onclick = function () { conversacion(s); }; res.append(b);
      });
    }
    q.addEventListener('input', pintar); pintar();
  }
  async function conversacion(s) {
    cont.textContent = '';
    cont.append(boton('← Volver', lista, 'sec'), el('strong', null, cwsNombre(s)));
    const caja = el('div'); caja.style.cssText = 'max-height:50vh;overflow:auto;margin:8px 0';
    cont.append(caja);
    const t = campo('Escribí tu respuesta', 'area', ''); t.rows = 3;
    cont.append(t);
    async function cargar() {
      caja.textContent = ''; caja.append(el('p', 'suave', 'Cargando...'));
      let r; try { r = await api('chatMensajes', { espacio: s.id }); } catch (e) { caja.textContent = ''; caja.append(el('p', null, 'Error: ' + e.message)); return; }
      caja.textContent = '';
      r.mensajes.forEach(function (x) {
        const mio = x.de === 'Facundo Martinez';
        const b = el('div'); b.style.cssText = 'margin:6px 0;padding:8px 10px;border-radius:10px;max-width:90%;white-space:pre-wrap;' + (mio ? 'margin-left:auto;background:#1d4ed8;color:#fff' : 'background:#2a2f3a');
        b.append(el('div', 'suave', (mio ? 'Vos' : x.de) + ' · ' + cwsHora(x.fecha)), el('div', null, x.texto || '(adjunto o mensaje sin texto)'));
        caja.append(b);
      });
      caja.scrollTop = caja.scrollHeight;
    }
    cont.append(boton('📤 Enviar', async function () {
      if (!t.value.trim()) return;
      try { await api('chatEnviar', { espacio: s.id, texto: t.value.trim() }); t.value = ''; aviso('Enviado'); cargar(); } catch (e) { aviso('Error: ' + e.message); }
    }), boton('🔄 Actualizar', cargar, 'sec'));
    cargar();
  }
  lista();
}
