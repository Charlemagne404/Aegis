import { $, formatNumber, safeText } from './shared.js';

export function initCounterTool() {
  const input = $('#counter-input');
  const characterCount = $('#counter-characters');
  const characterCountNoSpaces = $('#counter-characters-no-spaces');
  const wordCount = $('#counter-words');
  const sentenceCount = $('#counter-sentences');
  const paragraphCount = $('#counter-paragraphs');
  const readingTime = $('#counter-reading-time');

  const update = () => {
    const text = input?.value || '';
    const trimmed = text.trim();
    const words = trimmed.match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu) || [];
    const sentences = trimmed
      .split(/[.!?]+/)
      .filter((sentence) => /[\p{L}\p{N}]/u.test(sentence));
    const paragraphs = trimmed
      ? trimmed.split(/\n\s*\n/gu).filter((paragraph) => /[\p{L}\p{N}]/u.test(paragraph))
      : [];
    const minutes = words.length / 200;

    safeText(characterCount, formatNumber(text.length, 0));
    safeText(characterCountNoSpaces, formatNumber(text.replace(/\s/gu, '').length, 0));
    safeText(wordCount, formatNumber(words.length, 0));
    safeText(sentenceCount, formatNumber(sentences.length, 0));
    safeText(paragraphCount, formatNumber(paragraphs.length, 0));
    safeText(readingTime, words.length ? (minutes < 1 ? '<1 min' : `${Math.ceil(minutes)} min`) : '0 min');
  };

  input?.addEventListener('input', update);
  update();
}
