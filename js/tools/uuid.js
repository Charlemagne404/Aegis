import { $, clamp, downloadTextFile, formatNumber, safeText, setTemporaryStatus } from './shared.js';

function createUuidV4() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function formatUuid(uuid, caseMode, wrapped) {
  const normalized = caseMode === 'upper' ? uuid.toUpperCase() : uuid.toLowerCase();
  return wrapped ? `{${normalized}}` : normalized;
}

export function initUuidGenerator() {
  const countInput = $('#uuid-count');
  const caseSelect = $('#uuid-case');
  const separatorSelect = $('#uuid-separator');
  const bracesInput = $('#uuid-braces');
  const output = $('#uuid-output');
  const status = $('#uuid-status');
  const countNode = $('#uuid-generated-count');
  const uniqueNode = $('#uuid-unique-count');
  const formatNode = $('#uuid-format');
  const charNode = $('#uuid-characters');
  const generateButton = $('#uuid-generate');
  const copyButton = $('#uuid-copy');
  const downloadButton = $('#uuid-download');
  const actionStatus = $('#uuid-action-status');
  let currentOutput = '';

  const setActionsEnabled = (enabled) => {
    if (copyButton) copyButton.disabled = !enabled;
    if (downloadButton) downloadButton.disabled = !enabled;
  };

  const generate = () => {
    const quantity = clamp(Math.trunc(Number(countInput?.value || 1)), 1, 100);
    const caseMode = caseSelect?.value || 'lower';
    const separator = separatorSelect?.value || 'lines';
    const wrapped = bracesInput?.checked ?? false;

    if (countInput) countInput.value = String(quantity);

    const values = Array.from({ length: quantity }, () => formatUuid(createUuidV4(), caseMode, wrapped));
    currentOutput = separator === 'comma' ? values.join(', ') : values.join('\n');

    if (output) output.value = currentOutput;
    safeText(status, `Generated ${quantity} UUID${quantity === 1 ? '' : 's'}.`);
    safeText(countNode, formatNumber(values.length, 0));
    safeText(uniqueNode, formatNumber(new Set(values).size, 0));
    safeText(formatNode, `${caseMode === 'upper' ? 'Uppercase' : 'Lowercase'}${wrapped ? ' · Braced' : ''}`);
    safeText(charNode, formatNumber(currentOutput.length, 0));
    setActionsEnabled(Boolean(currentOutput));
  };

  [countInput, caseSelect, separatorSelect, bracesInput].forEach((element) => {
    element?.addEventListener('input', generate);
    element?.addEventListener('change', generate);
  });

  generateButton?.addEventListener('click', generate);

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
    downloadTextFile('uuids.txt', currentOutput, 'text/plain;charset=utf-8');
    setTemporaryStatus(actionStatus, 'Downloaded');
  });

  setActionsEnabled(false);
  generate();
}
