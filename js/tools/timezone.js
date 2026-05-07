import { TIME_ZONES } from './constants.js';
import { $, flashButtonLabel, safeText, toDateTimeLocalValue } from './shared.js';
import { formatInTimeZone, formatSignedHourDifference, getDayShiftLabel, getTimeZoneOffsetMs, parseDateTimeLocal, zonedTimeToUtc } from './timezone-utils.js';

export function initTimezoneConverter() {
  const input = $('#timezone-input');
  const fromSelect = $('#timezone-from');
  const toSelect = $('#timezone-to');
  const result = $('#timezone-result');
  const clocks = $('#timezone-clocks');
  const nowButton = $('#timezone-now');
  const swapButton = $('#timezone-swap');
  const copyButton = $('#timezone-copy');
  const differenceNode = $('#timezone-difference');
  const dayShiftNode = $('#timezone-day-shift');
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const zones = TIME_ZONES.includes(localZone) ? TIME_ZONES : [localZone, ...TIME_ZONES];
  let latestTargetText = '';

  const populateZoneSelect = (select, selected) => {
    if (!select) return;
    select.innerHTML = zones
      .map((zone) => `<option value="${zone}"${zone === selected ? ' selected' : ''}>${zone.replace('_', ' ')}</option>`)
      .join('');
  };

  const renderClocks = () => {
    if (!clocks) return;
    const visibleZones = [...new Set([fromSelect?.value, toSelect?.value, 'UTC', 'Asia/Tokyo'].filter(Boolean))].slice(0, 4);
    const now = new Date();
    clocks.innerHTML = visibleZones
      .map(
        (zone) => `
          <div class="clock-card">
            <span>${zone.replace('_', ' ')}</span>
            <strong>${formatInTimeZone(now, zone, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
          </div>
        `,
      )
      .join('');
  };

  const convert = () => {
    if (!input?.value || !fromSelect?.value || !toSelect?.value || !result) {
      return;
    }

    const parsed = parseDateTimeLocal(input.value);
    if (!parsed) {
      result.textContent = 'Enter a valid date and time.';
      safeText(differenceNode, '--');
      safeText(dayShiftNode, 'Invalid');
      return;
    }

    const utcDate = zonedTimeToUtc(parsed, fromSelect.value);
    const targetText = formatInTimeZone(utcDate, toSelect.value, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    const sourceText = formatInTimeZone(utcDate, fromSelect.value, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    const sourceOffsetMs = getTimeZoneOffsetMs(utcDate, fromSelect.value);
    const targetOffsetMs = getTimeZoneOffsetMs(utcDate, toSelect.value);
    latestTargetText = targetText;

    result.innerHTML = `
      <span>${sourceText}</span>
      <strong>${targetText}</strong>
    `;
    safeText(differenceNode, formatSignedHourDifference((targetOffsetMs - sourceOffsetMs) / 3600000));
    safeText(dayShiftNode, getDayShiftLabel(utcDate, fromSelect.value, toSelect.value));
    renderClocks();
  };

  populateZoneSelect(fromSelect, localZone);
  populateZoneSelect(toSelect, localZone === 'UTC' ? 'Europe/Stockholm' : 'UTC');
  if (input) input.value = toDateTimeLocalValue(new Date());

  input?.addEventListener('input', convert);
  fromSelect?.addEventListener('change', convert);
  toSelect?.addEventListener('change', convert);
  nowButton?.addEventListener('click', () => {
    if (input) input.value = toDateTimeLocalValue(new Date());
    convert();
  });
  swapButton?.addEventListener('click', () => {
    if (!fromSelect || !toSelect) return;
    const previous = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = previous;
    convert();
  });
  copyButton?.addEventListener('click', async () => {
    if (!latestTargetText) return;
    try {
      await navigator.clipboard.writeText(latestTargetText);
      flashButtonLabel(copyButton, 'Copied');
    } catch {
      flashButtonLabel(copyButton, 'Clipboard off');
    }
  });
  convert();
  window.setInterval(renderClocks, 1000);
}
