import { $, $$, safeText, setTemporaryStatus } from './shared.js';

export function initCaseConverter() {
  const input = $('#case-input');
  const output = $('#case-output');
  const copyButton = $('#case-copy');
  const status = $('#case-status');
  const modeLabel = $('#case-mode-label');
  const modeButtons = $$('[data-case-mode]');
  const labels = {
    lower: 'lowercase',
    upper: 'UPPERCASE',
    sentence: 'Sentence case',
    title: 'Title Case',
    camel: 'camelCase',
    snake: 'snake_case',
    kebab: 'kebab-case',
    constant: 'CONSTANT_CASE',
  };
  let activeMode = 'lower';

  const convert = () => {
    const text = input?.value || '';
    safeText(output, convertTextCase(text, activeMode));
    safeText(modeLabel, labels[activeMode]);
    modeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.caseMode === activeMode));
    });
  };

  input?.addEventListener('input', convert);
  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeMode = button.dataset.caseMode || 'lower';
      convert();
    });
  });
  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output?.textContent || '');
      setTemporaryStatus(status, 'Copied');
    } catch {
      setTemporaryStatus(status, 'Clipboard unavailable');
    }
  });

  convert();
}

function convertTextCase(text, mode) {
  const words = text.match(/[\p{L}\p{N}]+/gu) || [];

  if (mode === 'upper') return text.toUpperCase();
  if (mode === 'sentence') {
    return text
      .toLowerCase()
      .replace(/(^\s*[\p{L}\p{N}]|[.!?]\s+[\p{L}\p{N}])/gu, (match) => match.toUpperCase());
  }
  if (mode === 'title') {
    return text
      .toLowerCase()
      .replace(/(^|[^\p{L}\p{N}])([\p{L}\p{N}])/gu, (match, prefix, character) => `${prefix}${character.toUpperCase()}`);
  }
  if (mode === 'camel') {
    return words
      .map((word, index) => {
        const lower = word.toLowerCase();
        return index === 0 ? lower : `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
      })
      .join('');
  }
  if (mode === 'snake') return words.map((word) => word.toLowerCase()).join('_');
  if (mode === 'kebab') return words.map((word) => word.toLowerCase()).join('-');
  if (mode === 'constant') return words.map((word) => word.toUpperCase()).join('_');

  return text.toLowerCase();
}
