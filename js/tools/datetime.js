import { $, formatNumber, safeText, setTemporaryStatus, toDateTimeLocalValue } from './shared.js';

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function hasExplicitTimeZone(value) {
  return /(?:z|[+-]\d{2}:?\d{2})$/iu.test(value.trim());
}

function createAssumedDate(parts, assumeTimeZone) {
  const [rawYear, rawMonth, rawDay, rawHours = '0', rawMinutes = '0', rawSeconds = '0'] = parts;
  const year = Number(rawYear);
  const month = Number(rawMonth);
  const day = Number(rawDay);
  const hours = Number(rawHours ?? '0');
  const minutes = Number(rawMinutes ?? '0');
  const seconds = Number(rawSeconds ?? '0');

  return assumeTimeZone === 'utc'
    ? new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds))
    : new Date(year, month - 1, day, hours, minutes, seconds);
}

function parseFlexibleDateInput(value, assumeTimeZone) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^-?\d+(?:\.\d+)?$/u.test(trimmed)) {
    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric)) return null;
    const milliseconds = Math.abs(numeric) >= 1e12 ? numeric : numeric * 1000;
    return {
      date: new Date(milliseconds),
      sourceLabel: Math.abs(numeric) >= 1e12 ? 'Parsed as Unix milliseconds.' : 'Parsed as Unix seconds.',
    };
  }

  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/u);
  if (dateOnlyMatch) {
    return {
      date: createAssumedDate(dateOnlyMatch.slice(1), assumeTimeZone),
      sourceLabel: assumeTimeZone === 'utc' ? 'Parsed as a UTC calendar date.' : 'Parsed as a local calendar date.',
    };
  }

  const dateTimeMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/u);
  if (dateTimeMatch) {
    return {
      date: createAssumedDate(dateTimeMatch.slice(1), assumeTimeZone),
      sourceLabel: assumeTimeZone === 'utc' ? 'Parsed as a UTC date-time.' : 'Parsed as a local date-time.',
    };
  }

  const normalized = trimmed.includes(' ') && !hasExplicitTimeZone(trimmed)
    ? trimmed.replace(' ', 'T')
    : trimmed;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) return null;

  return {
    date: parsed,
    sourceLabel: hasExplicitTimeZone(trimmed)
      ? 'Parsed as an absolute timestamp with an explicit offset.'
      : 'Parsed with the browser date parser.',
  };
}

function formatReadableDate(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone,
  }).format(date);
}

function formatRelative(date) {
  const diffMs = date.getTime() - Date.now();
  const absSeconds = Math.abs(diffMs) / 1000;

  if (absSeconds < 60) return relativeFormatter.format(Math.round(diffMs / 1000), 'second');
  if (absSeconds < 3600) return relativeFormatter.format(Math.round(diffMs / 60000), 'minute');
  if (absSeconds < 86400) return relativeFormatter.format(Math.round(diffMs / 3600000), 'hour');
  if (absSeconds < 2629800) return relativeFormatter.format(Math.round(diffMs / 86400000), 'day');
  if (absSeconds < 31557600) return relativeFormatter.format(Math.round(diffMs / 2629800), 'month');
  return relativeFormatter.format(Math.round(diffMs / 31557600), 'year');
}

function formatDurationLabel(milliseconds) {
  const absoluteSeconds = Math.abs(Math.round(milliseconds / 1000));
  const days = Math.floor(absoluteSeconds / 86400);
  const hours = Math.floor((absoluteSeconds % 86400) / 3600);
  const minutes = Math.floor((absoluteSeconds % 3600) / 60);
  const seconds = absoluteSeconds % 60;
  const parts = [];

  if (days) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  if (hours) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`);
  if (minutes) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
  if ((!parts.length || parts.length < 2) && seconds) parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`);

  return parts.length ? parts.join(', ') : '0 seconds';
}

export function initDateTimeTool() {
  const sourceInput = $('#datetime-source');
  const assumeSelect = $('#datetime-assume-timezone');
  const relativeNode = $('#datetime-relative');
  const parseNoteNode = $('#datetime-parse-note');
  const status = $('#datetime-status');
  const localNode = $('#datetime-local');
  const utcNode = $('#datetime-utc');
  const unixSecondsNode = $('#datetime-unix-seconds');
  const unixMsNode = $('#datetime-unix-ms');
  const startInput = $('#datetime-start');
  const endInput = $('#datetime-end');
  const rangeResult = $('#datetime-range-result');
  const rangeNote = $('#datetime-range-note');
  const rangeStatus = $('#datetime-range-status');
  const daysNode = $('#datetime-range-days');
  const hoursNode = $('#datetime-range-hours');
  const minutesNode = $('#datetime-range-minutes');
  const secondsNode = $('#datetime-range-seconds');
  const nowButton = $('#datetime-now');
  const swapButton = $('#datetime-swap');
  const copyButton = $('#datetime-copy');
  const actionStatus = $('#datetime-action-status');
  let baseSummary = '';
  let currentSummary = '';

  const renderRange = () => {
    const startValue = startInput?.value;
    const endValue = endInput?.value;

    if (!startValue || !endValue) {
      safeText(rangeStatus, 'Awaiting range');
      if (rangeResult) {
        rangeResult.innerHTML = '<strong>Select two date-times</strong><small>Compare exact elapsed time between any two moments.</small>';
      }
      safeText(rangeNote, 'Range calculations use the local values entered here.');
      safeText(daysNode, '--');
      safeText(hoursNode, '--');
      safeText(minutesNode, '--');
      safeText(secondsNode, '--');
      currentSummary = baseSummary;
      return;
    }

    const startDate = new Date(startValue);
    const endDate = new Date(endValue);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      safeText(rangeStatus, 'Invalid range');
      if (rangeResult) {
        rangeResult.innerHTML = '<strong>Invalid date range</strong><small>Check that both date-time values are valid.</small>';
      }
      safeText(rangeNote, 'Both values must resolve to valid date-times.');
      safeText(daysNode, '--');
      safeText(hoursNode, '--');
      safeText(minutesNode, '--');
      safeText(secondsNode, '--');
      currentSummary = baseSummary;
      return;
    }

    const diffMs = endDate.getTime() - startDate.getTime();
    const absMs = Math.abs(diffMs);
    const direction = diffMs === 0
      ? 'Start and end are the same moment.'
      : diffMs > 0
        ? 'End is after start.'
        : 'End is before start.';

    safeText(rangeStatus, 'Range ready');
    if (rangeResult) {
      rangeResult.innerHTML = `
        <strong>${formatDurationLabel(diffMs)}</strong>
        <small>${direction}</small>
      `;
    }
    safeText(rangeNote, `${formatReadableDate(startDate, 'UTC')} to ${formatReadableDate(endDate, 'UTC')}`);
    safeText(daysNode, formatNumber(absMs / 86400000, 3));
    safeText(hoursNode, formatNumber(absMs / 3600000, 2));
    safeText(minutesNode, formatNumber(absMs / 60000, 1));
    safeText(secondsNode, formatNumber(absMs / 1000, 0));

    currentSummary = `${baseSummary}\nRange: ${formatDurationLabel(diffMs)}`;
  };

  const renderInput = () => {
    const parsed = parseFlexibleDateInput(sourceInput?.value || '', assumeSelect?.value || 'local');

    if (!parsed) {
      baseSummary = '';
      currentSummary = '';
      safeText(status, 'Awaiting input');
      safeText(relativeNode, 'Enter a date or timestamp');
      safeText(parseNoteNode, 'Examples: 2026-05-07 14:30, 2026-05-07T14:30:00Z, or 1746628200');
      safeText(localNode, '--');
      safeText(utcNode, '--');
      safeText(unixSecondsNode, '--');
      safeText(unixMsNode, '--');
      renderRange();
      return;
    }

    const { date, sourceLabel } = parsed;
    safeText(status, 'Parsed');
    safeText(relativeNode, formatRelative(date));
    safeText(parseNoteNode, sourceLabel);
    safeText(localNode, formatReadableDate(date, Intl.DateTimeFormat().resolvedOptions().timeZone));
    safeText(utcNode, date.toISOString());
    safeText(unixSecondsNode, formatNumber(date.getTime() / 1000, 3));
    safeText(unixMsNode, formatNumber(date.getTime(), 0));
    baseSummary = [
      `Input: ${sourceInput?.value || '—'}`,
      `Relative: ${relativeNode?.textContent || '—'}`,
      `Unix seconds: ${unixSecondsNode?.textContent || '—'}`,
      `Unix milliseconds: ${unixMsNode?.textContent || '—'}`,
    ].join('\n');
    currentSummary = baseSummary;
    renderRange();
  };

  [sourceInput, assumeSelect, startInput, endInput].forEach((element) => {
    element?.addEventListener('input', renderInput);
    element?.addEventListener('change', renderInput);
  });

  nowButton?.addEventListener('click', () => {
    if (sourceInput) {
      sourceInput.value = toDateTimeLocalValue(new Date()).replace('T', ' ');
    }
    renderInput();
  });

  swapButton?.addEventListener('click', () => {
    if (!startInput || !endInput) return;
    const previous = startInput.value;
    startInput.value = endInput.value;
    endInput.value = previous;
    renderInput();
  });

  copyButton?.addEventListener('click', async () => {
    if (!currentSummary) return;

    try {
      await navigator.clipboard.writeText(currentSummary);
      setTemporaryStatus(actionStatus, 'Copied');
    } catch {
      setTemporaryStatus(actionStatus, 'Clipboard unavailable');
    }
  });

  const now = new Date();
  const later = new Date(now.getTime() + (24 * 60 * 60 * 1000));
  if (sourceInput) sourceInput.value = toDateTimeLocalValue(now).replace('T', ' ');
  if (startInput) startInput.value = toDateTimeLocalValue(now);
  if (endInput) endInput.value = toDateTimeLocalValue(later);
  renderInput();
}
