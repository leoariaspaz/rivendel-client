import { isValidResolucion, POSTERGADO } from './tiposResoluciones';
import { isChronological, isValidDateTime, isValidHour } from './dateUtils';

export const validateReclamo = (state) => {
  const errors = [];
  if (state.numero <= 0) errors.push('Ingrese un número de reclamo válido');
  const inicioValido = isValidDateTime(state.fechaHoraInicio);
  if (!inicioValido)
    errors.push('Ingrese una fecha y hora de inicio válidas');
  const horaFinValida = isValidHour(state.horaFin);
  if (!horaFinValida) {
    errors.push('Ingrese una hora de fin válida');
  } else if (inicioValido) {
    const horaInicio = state.fechaHoraInicio.slice(11, 16);
    if (isValidHour(horaInicio)) {
      const minutosInicio = horaInicio.split(':').map(Number).reduce((hours, minutes) => hours * 60 + minutes);
      const minutosFin = state.horaFin.split(':').map(Number).reduce((hours, minutes) => hours * 60 + minutes);
      if (minutosFin < minutosInicio) {
        errors.push('La hora de fin no puede ser anterior a la hora de inicio.');
      }
    }
  }
  if (!isValidResolucion(state.idResolucion)) errors.push('Seleccione una resolución válida');
  if ((state.idResolucion === POSTERGADO) && !isValidDateTime(state.proxAudiencia)) errors.push('Ingrese una próxima fecha válida');
  if (!isChronological(state.fechaHoraInicio, state.proxAudiencia))
    errors.push('La próxima fecha no puede ser anterior a la fecha hora de inicio.');
  return errors;
};
