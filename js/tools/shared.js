export const $ = (selector, parent = document) => parent.querySelector(selector);
export const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const pad = (value, length = 2) => String(value).padStart(length, '0');

export const formatNumber = (value, maximumFractionDigits = 2) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(value);

export const formatDuration = (milliseconds, showHundredths = false) => {
  const safeMs = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.floor((safeMs % 1000) / 10);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${showHundredths ? `.${pad(hundredths)}` : ''}`;
};

export const toDateTimeLocalValue = (date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const safeText = (node, text) => {
  if (node) {
    node.textContent = text;
  }
};

export const setTemporaryStatus = (node, message, delay = 1800) => {
  safeText(node, message);
  if (message) {
    window.setTimeout(() => {
      if (node?.textContent === message) safeText(node, '');
    }, delay);
  }
};

export const flashButtonLabel = (button, label, delay = 1400) => {
  if (!(button instanceof HTMLElement)) return;
  const original = button.textContent;
  safeText(button, label);
  window.setTimeout(() => {
    if (button.isConnected) safeText(button, original || '');
  }, delay);
};

export const formatMetric = (value) => formatNumber(value, value >= 100 ? 0 : 1);

export function readLocalJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocalJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures so the tool still runs in restricted contexts.
  }
}

export function formatHistoryTimestamp(timestamp) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function downloadTextFile(filename, contents, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function randomDecimal(min, max, decimals = 0) {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  const unit = buffer[0] / 0xffffffff;
  const value = min + ((max - min) * unit);
  return Number(value.toFixed(decimals));
}

export function formatRandomValue(value, decimals = 0) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function randomInt(min, max) {
  const range = max - min + 1;
  const maxUint = 0xffffffff;
  const limit = Math.floor(maxUint / range) * range;
  const buffer = new Uint32Array(1);
  let value;

  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);

  return min + (value % range);
}
