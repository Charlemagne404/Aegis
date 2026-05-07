export function parseDateTimeLocal(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  };
}

export function getTimeZoneOffsetMs(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return asUtc - date.getTime();
}

export function zonedTimeToUtc(parts, timeZone) {
  const guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  const firstOffset = getTimeZoneOffsetMs(new Date(guess), timeZone);
  let utcTime = guess - firstOffset;
  const secondOffset = getTimeZoneOffsetMs(new Date(utcTime), timeZone);

  if (firstOffset !== secondOffset) {
    utcTime = guess - secondOffset;
  }

  return new Date(utcTime);
}

export function formatInTimeZone(date, timeZone, overrides = {}) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    ...overrides,
  }).format(date);
}

function getCalendarParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
}

export function getDayShiftLabel(date, fromZone, toZone) {
  const from = getCalendarParts(date, fromZone);
  const to = getCalendarParts(date, toZone);
  const fromDate = Date.UTC(from.year, from.month - 1, from.day);
  const toDate = Date.UTC(to.year, to.month - 1, to.day);
  const dayDifference = Math.round((toDate - fromDate) / 86400000);

  if (dayDifference === 0) return 'Same day';
  if (dayDifference > 0) return dayDifference === 1 ? 'Next day' : `+${dayDifference} days`;
  return dayDifference === -1 ? 'Previous day' : `${dayDifference} days`;
}

export function formatSignedHourDifference(hours) {
  if (!Number.isFinite(hours) || hours === 0) return 'No difference';
  const sign = hours > 0 ? '+' : '−';
  const absolute = Math.abs(hours);
  const wholeHours = Math.trunc(absolute);
  const minutes = Math.round((absolute - wholeHours) * 60);
  if (minutes === 0) return `${sign}${wholeHours}h`;
  return `${sign}${wholeHours}h ${minutes}m`;
}
