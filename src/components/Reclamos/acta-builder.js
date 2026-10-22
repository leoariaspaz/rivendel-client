import { Reclamos } from '../../api/repositories/reclamos.js';
import ReportData from './DTOs/reportData.js';
import { ACUERDO } from './tiposResoluciones.js';
import { tiptapDocumentToPdfMake } from './tiptap-to-pdfmake.js';
import { PRESENCIALES, INCOMPARENDOS, getComparecientes, joinPartes } from './acta.utils.js';

const PARAGRAPH_SPACING_PT = 10;
const _EMPTY_PARAGRAPH_HEIGHT_PT = 12;
const EMPTY_SIGN = ' ';

const preTitulo = (data) => ({
  text: `RECLAMO Nº ${data.numero}`,
  margin: [0, 0, 0, PARAGRAPH_SPACING_PT],
})

const titulo = (data) => ({
  text: data?.titulo,
  style: 'header',
})

function partes(data) {
  const row = (value, label) => ({
    columns: [
      { text: label, width: 70 },
      { text: value, bold: true },
    ],
  });

  return {
    margin: [0, 0, 0, PARAGRAPH_SPACING_PT],
    stack: [
      row(data?.nombresReclamantes, 'Reclamante/s: '),
      row(data?.nombresReclamados, 'Reclamado/s: '),
    ],
  };
};

const rubros = (data) => ({
  margin: [0, 0, 0, PARAGRAPH_SPACING_PT],
  text: [{ text: 'OBJETO DEL RECLAMO/RUBROS Y PERÍODOS: ' }, { text: data?.rubros }],
})

const getPostergacion = (proximaAudiencia) => 
  (proximaAudiencia)
  ? ( `Esta conciliadora le fija una SEGUNDA FECHA para el día ${proximaAudiencia.dia} de ${proximaAudiencia.mes}` +
      ` de ${proximaAudiencia.anio} a las ${proximaAudiencia.hora} horas, bajo apercibimiento de requerir la aplicación` +
      ` de la multa establecida en el Art.14 párrafo 5º de la ley 7330. Se solicita desde la DICLO se realice la` +
      ` notificación respectiva.`)
  : ''

function getDeclaracion(data) {
  if (data.idResolucion === ACUERDO) {
    return 'las partes expresan lo siguiente:';
  }

  let partesIncomparendas = joinPartes(data, INCOMPARENDOS);
  if (partesIncomparendas) {
    if (partesIncomparendas.endsWith('.')) {
      partesIncomparendas = partesIncomparendas.slice(0, -1);
    }
    return (
      'se deja constancia de la imposibilidad de celebrar la audiencia fijada para el día de ' +
      `la fecha atento a la incomparencia ${partesIncomparendas}. ${getPostergacion(data.proximaAudiencia)}`
    );
  }

  return (
    'Las partes manifiestan que luego de un breve intercambio respecto de los reclamos enunciados, ' +
    'no es posible arribar a un acuerdo conciliatorio. En razón de ello se deja constancia que con ' +
    'esta audiencia culmina el procedimiento de conciliación laboral obligatorio, extendiéndose la ' +
    'correspondiente CERTIFICACIÓN DE FRACASO (art. 16 ley 7.330 y 15, 21, Dec. Reg), quedando expedita ' +
    'la instancia judicial para el reclamo de los rubros arriba identificados. '
  );
};

function getFinalizacion(data) {
  if (data.idResolucion === ACUERDO) return '';

  const { existenReclamantes, existenReclamados, existenLetradosReclamantes, 
    existenLetradosReclamados } = getComparecientes(data);
  if (!existenReclamantes && !existenReclamados && !existenLetradosReclamantes && !existenLetradosReclamados) {
    return `Siendo las ${data?.horaFin} horas se da por finalizado el acto, previa lectura ante mí, conciliadora autorizante.`;
  }

  return (
    `Siendo las ${data?.horaFin} horas, se da por finalizado el acto, previa lectura, firmando los comparecientes al pie ` +
    `de la presente ante mí, conciliadora autorizante.`
  );
};

function getMultas(data) {
  if (data.idResolucion === ACUERDO) return '';

  let s = '';
  const reclamantesMultados = (data?.reclamantes || []).filter(p => p.multado).length;
  const reclamadosMultados = (data?.reclamados || []).filter(p => p.multado).length;
  
  if ((reclamantesMultados + reclamadosMultados) === 0) return '';

  let partesMultadas = '';
  if (reclamantesMultados > 0) {
    partesMultadas = 'el empleado'
  }
  if (reclamadosMultados > 0) {
    partesMultadas += (partesMultadas.length > 0 ? ' y ' : '') + 'la patronal'
  }

  s +=
    'Asimismo se solicita para las partes que no comparecieron la aplicación de la multa establecida  ' +
    ' en el Artículo 8°, del Anexo II de la Ley Nacional N° 25.212 Régimen General de Sanciones por' + 
    ' Infracciones Laborales por ser considerada la conducta de ' + partesMultadas + ' como obstructiva' + 
    ' y, como tal, sancionable de conformidad a la  normativa nombrada anteriormente.';

  return s;
}

function cuerpo(data) {
  let s =
    `En la ciudad de Santiago del Estero, provincia del mismo nombre, a los ${data?.fechaInicio.dia} días ` +
    `del mes de ${data?.fechaInicio.mes} del año ${data?.fechaInicio.anio}, siendo las ${data?.fechaInicio.hora} ` +
    `horas, ante mí ${data.conciliador}, en mi calidad de Conciliador Laboral, habilitación Nº ${data.nroHabilitacion}, en ` +
    `ejercicio de las funciones conferidas por la ley 7.330 y el decreto reglamentario 2.230/22. En el Marco del ` +
    `trámite de referencia, comparecen ${joinPartes(data, PRESENCIALES)}.- Y ABIERTO EL ACTO: ${getDeclaracion(data)}`;
  const multas = getMultas(data);
  if (multas?.length > 0) {
    s += `\n${getMultas(data)}`;
  }
  s += `\n${getFinalizacion(data)}`;
  return {
    margin: [0, 0, 0, PARAGRAPH_SPACING_PT],
    text: s,
  };
};

function clausulas(data) {
  if (!data.clausulas || data.clausulas.length === 0) {
    return {
      text: '',
      margin: [0, 0, 0, PARAGRAPH_SPACING_PT],
    };
  }
  const paragraphs = tiptapDocumentToPdfMake(data.clausulas);
  const result = [];
  paragraphs.forEach((element) => {
    result.push({
      text: element,
      margin: [0, 0, 0, PARAGRAPH_SPACING_PT],
    });
  });
  return result;
};

function panelFirmas(data) {
  const { existenReclamantes, existenReclamados, existenLetradosReclamantes, 
    existenLetradosReclamados } = getComparecientes(data);
  const firmasIzquierda = [];
  const firmasDerecha = [];
  if (existenReclamantes && existenLetradosReclamantes) {
    firmasIzquierda.push('Firma Reclamante');
    firmasIzquierda.push('Aclaración Reclamante');
    firmasIzquierda.push('Tipo y Nro. Documento Reclamante');
    firmasIzquierda.push('Firma Letrado Reclamante');
  } else if (existenReclamantes) {
    firmasIzquierda.push('Firma Reclamante');
    firmasIzquierda.push('Aclaración Reclamante');
    firmasIzquierda.push('Tipo y Nro. Documento Reclamante');
    firmasIzquierda.push(EMPTY_SIGN);
  } else if (existenLetradosReclamantes) {
    firmasIzquierda.push('Firma Letrado Reclamante');
    firmasIzquierda.push(EMPTY_SIGN);
    firmasIzquierda.push(EMPTY_SIGN);
    firmasIzquierda.push(EMPTY_SIGN);
  } else {
    firmasIzquierda.push(EMPTY_SIGN);
    firmasIzquierda.push(EMPTY_SIGN);
    firmasIzquierda.push(EMPTY_SIGN);
    firmasIzquierda.push(EMPTY_SIGN);
  }

  if (existenReclamados && existenLetradosReclamados) {
    firmasDerecha.push('Firma Reclamado');
    firmasDerecha.push('Aclaración Reclamado');
    firmasDerecha.push('Tipo y Nro. Documento Reclamado');
    firmasDerecha.push('Firma Letrado Reclamado');
  } else if (existenReclamados) {
    firmasDerecha.push('Firma Reclamado');
    firmasDerecha.push('Aclaración Reclamado');
    firmasDerecha.push('Tipo y Nro. Documento Reclamado');
    firmasDerecha.push(EMPTY_SIGN);
  } else if (existenLetradosReclamados) {
    firmasDerecha.push('Firma Letrado Reclamado');
    firmasDerecha.push(EMPTY_SIGN);
    firmasDerecha.push(EMPTY_SIGN);
    firmasDerecha.push(EMPTY_SIGN);
  } else {
    firmasDerecha.push(EMPTY_SIGN);
    firmasDerecha.push(EMPTY_SIGN);
    firmasDerecha.push(EMPTY_SIGN);
    firmasDerecha.push(EMPTY_SIGN);
  }

  return [
    firmaRow(firmasIzquierda[0], firmasDerecha[0]),
    firmaRow(firmasIzquierda[1], firmasDerecha[1]),
    firmaRow(firmasIzquierda[2], firmasDerecha[2]),
    firmaRow(firmasIzquierda[3], firmasDerecha[3]),
  ];
};

function firmaCell(margins, label) {
  if (label === EMPTY_SIGN) return {};

  return {
    table: {
      widths: ['*'],
      body: [
        [
          {
            text: label,
            border: [false, true, false, false],
            fontSize: 8,
            verticalAlignment: 'bottom',
            alignment: 'center',
          },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 0.2,
      hLineColor: () => '#000',
    },
    margin: margins,
  };
};

const firmaRow = (label1, label2) => ({
  columns: [
    {
      stack: [firmaCell([0, 20, 5, 0], label1)],
    },
    {
      stack: [firmaCell([5, 20, 0, 0], label2)],
    },
  ],
});

function content(data) {
  const result = [];
  if (data.idResolucion === ACUERDO) {
    result.push([preTitulo(data), titulo(data), cuerpo(data), clausulas(data)]);
  } else {
    result.push([titulo(data), partes(data), rubros(data), cuerpo(data)]);
  }
  result.push(panelFirmas(data));
  return result;
}

const newActa = (data) => ({
  pageSize: {
    width: 609.5,
    height: 935.5,
  },
  pageMargins: [85, 70, 85, 70],
  defaultStyle: {
    font: 'Times',
    fontSize: 12,
    lineHeight: 1.5,
    alignment: 'justify',
  },
  content: content(data),
  styles: {
    header: {
      bold: true,
      alignment: 'center',
      decoration: 'underline',
      margin: [0, 0, 0, 15],
    },
  },
});

const newErrorDocument = (message) => ({
  content: [
    {
      text: message,
      color: 'red',
      bold: true,
      fontSize: 14,
      alignment: 'center',
      margin: [0, 50, 0, 0],
      font: 'Times',
    },
  ],
});

export async function buildDocument(id) {
  const response = await Reclamos.get(id);
  let doc;
  if (!response.ok) {
    doc = newErrorDocument('Error: Se produjo un error al obtener los datos del reclamo.');
  } else {
    const data = response.data;
    if (!data || Object.keys(data).length === 0) {
      doc = newErrorDocument('Error: No se encontraron datos para el reclamo solicitado.');
    } else {
      doc = newActa(new ReportData(data));
    }
  }
  return doc;
};

export default async function createActa(id) {
  const doc = await buildDocument(id);
  const { default: pdfMake } = await import('pdfmake/build/pdfmake');
  const { default: vfs } = await import('../../assets/vfs_fonts.js');
  pdfMake.vfs = vfs;
  pdfMake.fonts = {
    Times: {
      normal: 'LiberationSerif-Regular.ttf',
      bold: 'LiberationSerif-Bold.ttf',
      italics: 'LiberationSerif-Italic.ttf',
      bolditalics: 'LiberationSerif-BoldItalic.ttf',
    },
  };
  return pdfMake.createPdf(doc).open();
};
