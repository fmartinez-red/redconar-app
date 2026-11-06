/* Plantillas de WhatsApp. Para agregar o cambiar una, editar solo este archivo.
   {nombre} se reemplaza por " Nombre" (o queda vacío si no hay nombre). {vendedor} = Facundo.
   Los textos salen de Respuestas_Modelo.md (aprobados por Facu). */
const PLANTILLAS = [
  {
    id: 'lead-magnet',
    nombre: 'Lead Magnet: Informe de Morosidad (primer mensaje)',
    cuando: 'Leads que pidieron el Informe de Morosidad 2026 (formulario o Facebook).',
    texto: 'Hola{nombre}, soy {vendedor}, de Redconar 👋\nTe escribo por el Informe de Morosidad 2026 que pediste, el que compara la morosidad de más de 4.500 consorcios por barrio y localidad.\n¿Pudiste ubicar tu consorcio en el mapa? ¿Quedó por debajo o por encima del promedio de tu zona?'
  },
  {
    id: 'todavia-no',
    nombre: 'Respuesta a "todavía no vi el mapa"',
    cuando: 'El lead contestó que todavía no lo vio. Objetivo: saber si administra.',
    texto: 'Hola{nombre},\nGracias por responder, quedate tranquilo/a que no hay apuro con el mapa.\nContame, hoy estás administrando algún consorcio o te interesa el tema para más adelante? Así veo en qué te puedo ayudar.'
  },
  {
    id: 'presupuestos',
    nombre: 'Envío de presupuestos (pie del primer PDF)',
    cuando: 'Cuando mandás los PDFs de los presupuestos por WhatsApp.',
    texto: 'Acá te paso los dos PDFs con los dos presupuestos'
  },
  {
    id: 'libre',
    nombre: 'Mensaje libre (vacío)',
    cuando: 'Abre WhatsApp sin texto.',
    texto: ''
  }
];

function primerNombre(f) {
  const n = String((f && f.nombre) || '').trim().split(/\s+/)[0] || '';
  return n ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : '';
}

function armarTexto(p, f) {
  const n = primerNombre(f);
  return p.texto.replace('{nombre}', n ? ' ' + n : '').replace('{vendedor}', 'Facundo');
}
