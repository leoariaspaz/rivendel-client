import { NO_ESPECIFICADO } from '../Shared/constants.js';

export const PRESENCIALES = 1;
export const INCOMPARENDOS = 2;

export function getComparecientes(data) {
  const existeParte = (p) =>
    (p.nroWhatsappParte ?? '') === '' && (p?.incomparendoParte ?? false) === false;
  const existePatrocinante = (p) =>
    p.patrocinante &&
    (p.nroWhatsappPatrocinante ?? '') === '' &&
    (p.incomparendoPatrocinante ?? false) === false;
  return {
    existenReclamantes: data?.reclamantes?.some(existeParte),
    existenReclamados: data?.reclamados?.some(existeParte),
    existenLetradosReclamantes: data?.reclamantes?.some(existePatrocinante),
    existenLetradosReclamados: data?.reclamados?.some(existePatrocinante),
  };
}

function concatenatePartes(partes, esReclamado, cantidadReclamos) {
  let s = '';
  if (!partes || partes.length === 0) {
    return s;
  }
  if (partes.length === 1) {
    s = `por la parte ${esReclamado ? 'reclamada/empleadora' : 'reclamante/trabajadora'}: `;
  } else {
    s = `por las partes ${esReclamado ? 'reclamadas/empleadoras' : 'reclamantes/trabajadoras'}: `;
  }
  partes.forEach((parte, i) => {
    const nombre = parte.nombre;
    const sintetico = parte.sintetico;
    const nroDocumento = parte.nroDocumento;
    const cuil = parte.cuil;
    const domicilio = parte.domicilio || '';
    const localidad = parte.localidad || '';
    const patrocinante = parte.patrocinante || {};

    if (i === partes.length - 1 && partes.length > 1) {
      s += ' y ';
    } else if (i > 0) {
      s += ', ';
    }

    s += nombre;

    //s += ((i === 0)? '' : ', ') + nombre;

    if (nroDocumento !== NO_ESPECIFICADO) {
      s += ` ${sintetico} ${nroDocumento}`;
    }

    if (cuil !== NO_ESPECIFICADO) {
      s += `, CUIL ${cuil}`;
    }

    s += `, con domicilio en ${domicilio}`;

    if (localidad && localidad.trim() !== '') {
      s += `, de la localidad ${localidad}`;
    }

    if (parte.nroWhatsappParte) {
      s += `, quien comparece virtualmente por videollamada de Whatsapp desde el número ${parte.nroWhatsappParte}`;
    }

    if (parte.postergo) {
      s +=
        ' la cual solicitó el cambio de fecha original para el día de hoy, pese a lo cual no compareció';
    }

    if (Object.keys(patrocinante || {}).length > 0) {
      if (parte.esApoderado) {
        s += `, representado por su apoderado el Dr. ${patrocinante.nombre} MP Nº ${patrocinante.nroMatricula}`;
      } else {
        s += `, con el patrocinio letrado del Dr. ${patrocinante.nombre} MP Nº ${patrocinante.nroMatricula}`;
      }

      if (patrocinante.domicilio !== NO_ESPECIFICADO) {
        s += ` ratificando domicilio en ${patrocinante.domicilio}`;
      }

      if (patrocinante.localidad !== NO_ESPECIFICADO) {
        s += ` de la ciudad ${patrocinante.localidad}`;
      }

      if (patrocinante.nroCasillero !== NO_ESPECIFICADO) {
        s += `, casillero Nº ${patrocinante.nroCasillero}`;
      }

      if (parte.nroWhatsappPatrocinante) {
        s += `, quien comparece virtualmente por videollamada de Whatsapp desde el número ${parte.nroWhatsappPatrocinante}`;
      }
    }

    if (parte.incomparendoParte && cantidadReclamos) {
      s += ` quien fue notificada de las ${cantidadReclamos} fechas de audiencia de conciliación, según informe suministrado por la DICLO.`;
    }
  });

  return s;
}

export function joinPartes(data, tipoIncomparecencia) {
  const filtro = tipoIncomparecencia === PRESENCIALES
    ? (r) => r.incomparendoParte === false || (r.patrocinante && r.incomparendoPatrocinante === false)
    : (r) =>
      r.incomparendoParte === true &&
      (!r.patrocinante || (r.patrocinante && (r.incomparendoPatrocinante ?? true) === true));
  const reclamantes = data?.reclamantes?.filter(filtro);
  const reclamados = data?.reclamados?.filter(filtro);

  const partesReclamantes = concatenatePartes(reclamantes, false, data?.cantidad);
  const partesReclamados = concatenatePartes(reclamados, true, data?.cantidad);

  let partes = '';
  if (partesReclamantes) {
    partes = partesReclamantes;
  }

  if (partesReclamados) {
    if (partes) {
      partes += ' y ';
    }
    partes += partesReclamados;
  }

  return partes;
}
