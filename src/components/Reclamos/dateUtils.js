import dayjs from 'dayjs';

export function apiDateToInput(date) {
  if (date && dayjs(date, 'DD/MM/YYYY HH:mm', true).isValid()) {
    return dayjs(date, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DDTHH:mm');
	}
  return '';
}

export function apiHourToInput(hour) {
  if (!hour) return '';
  return dayjs(hour, 'HH:mm', true).isValid() ? dayjs(hour, 'HH:mm').format('HH:mm') : '';
}

export function combineDateAndHour(fecha = dayjs(), hora) {
  if (!hora) return null;

  const [h, m] = hora.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) {
    throw new Error("Formato de hora inválido. Debe ser 'hh:mm'.");
  }
  return dayjs(fecha).hour(h).minute(m).second(0).millisecond(0).format('YYYY-MM-DDTHH:mm:ss') + '-03:00';
}

export function isValidDateTime(dateTimeStr) {
  return dayjs(dateTimeStr, 'YYYY-MM-DDTHH:mm', true).isValid();
}

export function isValidHour(hourStr) {
  if (typeof hourStr !== 'string' || !/^\d{2}:\d{2}$/.test(hourStr)) return false;
  const [hours, minutes] = hourStr.split(':').map(Number);
  return hours < 24 && minutes < 60;
}

export const isChronological = (firstDate, secondDate) => {
  if (!secondDate) return true;
  const d1 = dayjs(firstDate);
  const d2 = dayjs(secondDate);
  return d1.isValid() && d2.isValid() && d2.isAfter(d1, 'days');
};

export function inputDateToApi(dateTimeStr) {
  return dayjs(dateTimeStr, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DDTHH:mm:ss') + '-03:00';
}