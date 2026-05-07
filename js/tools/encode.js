import { $, formatNumber, safeText, setTemporaryStatus } from './shared.js';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8', { fatal: true });

function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return window.btoa(binary);
}

function base64ToBytes(value) {
  const normalized = value.replace(/\s+/g, '');
  if (!normalized) return new Uint8Array();

  const padding = (4 - (normalized.length % 4)) % 4;
  const padded = normalized.padEnd(normalized.length + padding, '=');
  const binary = window.atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toBase64Url(value) {
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  return value.replace(/-/g, '+').replace(/_/g, '/');
}

export function initEncoderTool() {
  const input = $('#encode-input');
  const output = $('#encode-output');
  const modeSelect = $('#encode-mode');
  const directionSelect = $('#encode-direction');
  const status = $('#encode-status');
  const detail = $('#encode-detail');
  const inputBytesNode = $('#encode-input-bytes');
  const outputBytesNode = $('#encode-output-bytes');
  const formatNode = $('#encode-format');
  const directionNode = $('#encode-direction-label');
  const copyButton = $('#encode-copy');
  const swapButton = $('#encode-swap');
  const actionStatus = $('#encode-action-status');
  let currentOutput = '';

  const setActionsEnabled = (enabled) => {
    if (copyButton) copyButton.disabled = !enabled;
    if (swapButton) swapButton.disabled = !enabled;
  };

  const updateStats = (inputBytes = '--', outputBytes = '--') => {
    safeText(inputBytesNode, inputBytes);
    safeText(outputBytesNode, outputBytes);
    safeText(formatNode, modeSelect?.selectedOptions[0]?.textContent || 'Base64');
    safeText(directionNode, directionSelect?.value === 'decode' ? 'Decode' : 'Encode');
  };

  const render = () => {
    const source = input?.value || '';
    const mode = modeSelect?.value || 'base64';
    const direction = directionSelect?.value || 'encode';

    if (!source) {
      currentOutput = '';
      if (output) output.value = '';
      safeText(status, 'Ready');
      safeText(detail, 'Convert UTF-8 text with Base64, URL-safe Base64, or percent-encoding.');
      updateStats();
      setActionsEnabled(false);
      return;
    }

    try {
      let result = '';

      if (direction === 'encode') {
        if (mode === 'url') {
          result = encodeURIComponent(source);
        } else {
          const base64 = bytesToBase64(textEncoder.encode(source));
          result = mode === 'base64url' ? toBase64Url(base64) : base64;
        }
      } else if (mode === 'url') {
        result = decodeURIComponent(source);
      } else {
        const decodedBytes = base64ToBytes(mode === 'base64url' ? fromBase64Url(source) : source);
        result = textDecoder.decode(decodedBytes);
      }

      currentOutput = result;
      if (output) output.value = result;
      safeText(status, 'Converted');
      safeText(
        detail,
        mode === 'url'
          ? 'URL encoding uses UTF-8 percent escapes.'
          : 'Base64 conversions preserve UTF-8 text in the browser.',
      );
      updateStats(
        formatNumber(textEncoder.encode(source).byteLength, 0),
        formatNumber(textEncoder.encode(result).byteLength, 0),
      );
      setActionsEnabled(Boolean(result));
    } catch (error) {
      currentOutput = '';
      if (output) output.value = '';
      safeText(status, 'Invalid input');
      safeText(detail, error instanceof Error ? error.message : 'The input could not be converted.');
      updateStats(formatNumber(textEncoder.encode(source).byteLength, 0), '--');
      setActionsEnabled(false);
    }
  };

  [input, modeSelect, directionSelect].forEach((element) => {
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

  swapButton?.addEventListener('click', () => {
    if (!currentOutput || !input) return;

    input.value = currentOutput;
    if (directionSelect) {
      directionSelect.value = directionSelect.value === 'encode' ? 'decode' : 'encode';
    }
    render();
    setTemporaryStatus(actionStatus, 'Moved to input');
  });

  setActionsEnabled(false);
  render();
}
