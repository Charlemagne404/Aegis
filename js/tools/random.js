import { $, clamp, formatRandomValue, randomDecimal, randomInt, safeText } from './shared.js';

export function initRandomGenerator() {
  const minInput = $('#random-min');
  const maxInput = $('#random-max');
  const countInput = $('#random-count');
  const decimalsInput = $('#random-decimals');
  const uniqueInput = $('#random-unique');
  const sortSelect = $('#random-sort');
  const generateButton = $('#random-generate');
  const copyButton = $('#random-copy');
  const result = $('#random-result');
  const status = $('#random-status');
  const minResult = $('#random-min-result');
  const maxResult = $('#random-max-result');
  const averageResult = $('#random-average-result');
  const sumResult = $('#random-sum-result');
  let currentResult = '42';

  const setStatus = (message) => {
    safeText(status, message);
    if (message) {
      window.setTimeout(() => safeText(status, ''), 1800);
    }
  };

  const syncModeState = () => {
    const decimals = clamp(Math.trunc(Number(decimalsInput?.value ?? 0)), 0, 6);
    if (decimalsInput) decimalsInput.value = String(decimals);
    if (uniqueInput) {
      uniqueInput.disabled = decimals > 0;
      if (decimals > 0) uniqueInput.checked = false;
    }
  };

  const generate = () => {
    syncModeState();
    let min = Number(minInput?.value ?? 1);
    let max = Number(maxInput?.value ?? 100);
    const count = clamp(Math.trunc(Number(countInput?.value ?? 1)), 1, 100);
    const decimals = clamp(Math.trunc(Number(decimalsInput?.value ?? 0)), 0, 6);
    const unique = Boolean(uniqueInput?.checked);
    const sort = sortSelect?.value || 'none';

    if (min > max) [min, max] = [max, min];

    const range = max - min + 1;
    if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
      safeText(result, 'Enter a valid range.');
      return;
    }

    if (decimals === 0 && (!Number.isFinite(range) || range <= 0 || range > 0xffffffff)) {
      safeText(result, 'Range is too large.');
      return;
    }

    if (unique && count > range) {
      safeText(result, 'Unique quantity exceeds the range.');
      return;
    }

    const values = [];
    const used = new Set();

    while (values.length < count) {
      const value = decimals > 0 ? randomDecimal(min, max, decimals) : randomInt(Math.trunc(min), Math.trunc(max));
      if (unique && used.has(value)) continue;
      used.add(value);
      values.push(value);
    }

    if (sort === 'asc') values.sort((left, right) => left - right);
    if (sort === 'desc') values.sort((left, right) => right - left);

    currentResult = values.map((value) => formatRandomValue(value, decimals)).join(', ');
    safeText(result, currentResult);
    safeText(minResult, formatRandomValue(Math.min(...values), decimals));
    safeText(maxResult, formatRandomValue(Math.max(...values), decimals));
    safeText(averageResult, formatRandomValue(values.reduce((sum, value) => sum + value, 0) / values.length, decimals));
    safeText(sumResult, formatRandomValue(values.reduce((sum, value) => sum + value, 0), decimals));
    setStatus('Generated');
  };

  decimalsInput?.addEventListener('input', syncModeState);
  generateButton?.addEventListener('click', generate);
  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentResult);
      setStatus('Copied');
    } catch {
      setStatus('Clipboard unavailable');
    }
  });

  syncModeState();
  generate();
}
