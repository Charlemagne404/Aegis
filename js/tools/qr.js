import { $ } from './shared.js';
import { clamp, downloadTextFile, flashButtonLabel, safeText } from './shared.js';
import { createQrMatrix, createQrSvg, drawQrCanvas, drawQrPlaceholder } from './qr-core.js';

export function initQrGenerator() {
  const input = $('#qr-input');
  const sizeSelect = $('#qr-size');
  const quietZoneInput = $('#qr-quiet-zone');
  const canvas = $('#qr-canvas');
  const downloadButton = $('#qr-download');
  const downloadSvgButton = $('#qr-download-svg');
  const copySourceButton = $('#qr-copy-source');
  const status = $('#qr-status');
  let currentMatrix = null;
  let currentOptions = { size: 768, quietZone: 4 };

  const getRenderOptions = () => ({
    size: clamp(Number(sizeSelect?.value || 768), 256, 2048),
    quietZone: clamp(Number(quietZoneInput?.value || 4), 0, 12),
  });

  const render = () => {
    const text = input?.value || '';
    currentOptions = getRenderOptions();

    if (!text) {
      currentMatrix = null;
      drawQrPlaceholder(canvas);
      safeText(status, 'Enter text');
      if (downloadButton) downloadButton.disabled = true;
      if (downloadSvgButton) downloadSvgButton.disabled = true;
      return;
    }

    try {
      const matrix = createQrMatrix(text);
      drawQrCanvas(canvas, matrix, currentOptions);
      currentMatrix = matrix;
      safeText(status, `${matrix.length} x ${matrix.length} · ${currentOptions.size}px`);
      if (downloadButton) downloadButton.disabled = false;
      if (downloadSvgButton) downloadSvgButton.disabled = false;
    } catch (error) {
      currentMatrix = null;
      drawQrPlaceholder(canvas);
      safeText(status, error.message || 'Unable to generate');
      if (downloadButton) downloadButton.disabled = true;
      if (downloadSvgButton) downloadButton.disabled = true;
    }
  };

  input?.addEventListener('input', render);
  sizeSelect?.addEventListener('change', render);
  quietZoneInput?.addEventListener('input', render);
  copySourceButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(input?.value || '');
      flashButtonLabel(copySourceButton, 'Copied');
    } catch {
      flashButtonLabel(copySourceButton, 'Clipboard off');
    }
  });
  downloadButton?.addEventListener('click', () => {
    if (!canvas || !currentMatrix) return;

    const link = document.createElement('a');
    link.download = 'aegis-qr-code.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
  downloadSvgButton?.addEventListener('click', () => {
    if (!currentMatrix) return;
    downloadTextFile('aegis-qr-code.svg', createQrSvg(currentMatrix, currentOptions), 'image/svg+xml');
  });

  render();
}
