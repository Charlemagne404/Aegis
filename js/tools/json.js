import { $, downloadTextFile, formatNumber, safeText, setTemporaryStatus } from './shared.js';

const textEncoder = new TextEncoder();

function sortJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .reduce((result, key) => {
        result[key] = sortJsonValue(value[key]);
        return result;
      }, {});
  }

  return value;
}

function getJsonDepth(value) {
  if (!value || typeof value !== 'object') return 1;

  const children = Array.isArray(value) ? value : Object.values(value);
  if (!children.length) return 1;

  return 1 + Math.max(...children.map((entry) => getJsonDepth(entry)));
}

function describeJsonType(value) {
  if (Array.isArray(value)) return 'Array';
  if (value === null) return 'Null';
  return typeof value === 'object'
    ? 'Object'
    : `${String(typeof value).slice(0, 1).toUpperCase()}${String(typeof value).slice(1)}`;
}

export function initJsonFormatter() {
  const input = $('#json-input');
  const modeSelect = $('#json-mode');
  const indentSelect = $('#json-indent');
  const sortKeysInput = $('#json-sort-keys');
  const output = $('#json-output');
  const status = $('#json-status');
  const detail = $('#json-detail');
  const typeNode = $('#json-type');
  const lineNode = $('#json-lines');
  const byteNode = $('#json-bytes');
  const depthNode = $('#json-depth');
  const copyButton = $('#json-copy');
  const downloadButton = $('#json-download');
  const actionStatus = $('#json-action-status');
  let currentOutput = '';

  const setActionsEnabled = (enabled) => {
    if (copyButton) copyButton.disabled = !enabled;
    if (downloadButton) downloadButton.disabled = !enabled;
  };

  const updateStats = (nextType = '--', lines = '--', bytes = '--', depth = '--') => {
    safeText(typeNode, nextType);
    safeText(lineNode, lines);
    safeText(byteNode, bytes);
    safeText(depthNode, depth);
  };

  const render = () => {
    const source = input?.value || '';
    const mode = modeSelect?.value || 'pretty';
    const indent = Math.max(2, Math.min(8, Number(indentSelect?.value || 2)));

    if (indentSelect) indentSelect.disabled = mode === 'minify';

    if (!source.trim()) {
      currentOutput = '';
      if (output) output.value = '';
      safeText(status, 'Ready');
      safeText(detail, 'Paste JSON to validate, format, minify, and export it locally.');
      updateStats();
      setActionsEnabled(false);
      return;
    }

    try {
      const parsed = JSON.parse(source);
      const normalized = sortKeysInput?.checked ? sortJsonValue(parsed) : parsed;
      const formatted = mode === 'minify'
        ? JSON.stringify(normalized)
        : JSON.stringify(normalized, null, indent);

      currentOutput = formatted;
      if (output) output.value = formatted;

      const lineCount = formatted ? formatted.split('\n').length : 0;
      const byteCount = textEncoder.encode(formatted).byteLength;

      safeText(status, 'Valid JSON');
      safeText(
        detail,
        mode === 'minify'
          ? 'Minified output updates instantly.'
          : `Formatted with ${indent} spaces${sortKeysInput?.checked ? ' and recursively sorted keys.' : '.'}`,
      );
      updateStats(
        describeJsonType(normalized),
        formatNumber(lineCount, 0),
        formatNumber(byteCount, 0),
        formatNumber(getJsonDepth(normalized), 0),
      );
      setActionsEnabled(true);
    } catch (error) {
      currentOutput = '';
      if (output) output.value = '';
      safeText(status, 'Invalid JSON');
      safeText(detail, error instanceof Error ? error.message : 'JSON could not be parsed.');
      updateStats(
        '--',
        formatNumber(source.split('\n').length, 0),
        formatNumber(textEncoder.encode(source).byteLength, 0),
        '--',
      );
      setActionsEnabled(false);
    }
  };

  [input, modeSelect, indentSelect, sortKeysInput].forEach((element) => {
    element?.addEventListener('input', render);
    element?.addEventListener('change', render);
  });

  copyButton?.addEventListener('click', async () => {
    if (!currentOutput) return;

    try {
      await navigator.clipboard.writeText(currentOutput);
      setTemporaryStatus(actionStatus, 'Copied');
    } catch {
      setTemporaryStatus(actionStatus, 'Clipboard unavailable');
    }
  });

  downloadButton?.addEventListener('click', () => {
    if (!currentOutput) return;
    downloadTextFile('formatted.json', currentOutput, 'application/json;charset=utf-8');
    setTemporaryStatus(actionStatus, 'Downloaded');
  });

  setActionsEnabled(false);
  render();
}
