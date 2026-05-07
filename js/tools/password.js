import { PASSWORD_AMBIGUOUS_CHARACTERS, PASSWORD_SETS } from './constants.js';
import { $, clamp, formatNumber, randomInt, safeText, setTemporaryStatus } from './shared.js';

export function initPasswordTool() {
  const lengthInput = $('#password-length');
  const lengthLabel = $('#password-length-label');
  const generateButton = $('#password-generate');
  const copyButton = $('#password-copy');
  const output = $('#password-output');
  const status = $('#password-status');
  const strengthLabel = $('#password-strength-label');
  const strengthBar = $('#password-strength-bar');
  const entropyNode = $('#password-entropy');
  const charsetSizeNode = $('#password-charset-size');
  const options = {
    lowercase: $('#password-lowercase'),
    uppercase: $('#password-uppercase'),
    numbers: $('#password-numbers'),
    symbols: $('#password-symbols'),
    ambiguous: $('#password-ambiguous'),
  };
  let currentPassword = '';

  const selectedSets = () => {
    const excludeAmbiguous = options.ambiguous?.checked;
    return Object.entries(options)
      .filter(([key, input]) => key !== 'ambiguous' && input?.checked)
      .map(([key]) => {
        const characters = PASSWORD_SETS[key];
        if (!excludeAmbiguous) return characters;
        return [...characters].filter((character) => !PASSWORD_AMBIGUOUS_CHARACTERS.has(character)).join('');
      })
      .filter(Boolean);
  };

  const updatePasswordMeta = (entropy, characterSetSize) => {
    safeText(entropyNode, `${formatNumber(entropy, 1)} bits`);
    safeText(charsetSizeNode, formatNumber(characterSetSize, 0));
  };

  const setStrength = (entropy) => {
    let label = 'Weak';
    let percent = 18;

    if (entropy >= 90) {
      label = 'Strong';
      percent = 100;
    } else if (entropy >= 70) {
      label = 'Good';
      percent = 76;
    } else if (entropy >= 48) {
      label = 'Fair';
      percent = 52;
    }

    safeText(strengthLabel, label);
    if (strengthBar) {
      strengthBar.style.width = `${percent}%`;
      strengthBar.dataset.strength = label.toLowerCase();
    }
  };

  const generate = () => {
    const length = clamp(Number(lengthInput?.value || 18), 8, 64);
    const sets = selectedSets();
    const combined = sets.join('');
    const entropy = combined.length > 0 ? length * Math.log2(combined.length) : 0;

    safeText(lengthLabel, `${length} characters`);
    updatePasswordMeta(entropy, combined.length);
    if (!combined) {
      currentPassword = '';
      safeText(output, 'Select at least one character type.');
      setStrength(0);
      return;
    }

    const characters = sets.map((set) => set[randomInt(0, set.length - 1)]);
    while (characters.length < length) {
      characters.push(combined[randomInt(0, combined.length - 1)]);
    }

    for (let index = characters.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInt(0, index);
      [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
    }

    currentPassword = characters.join('');
    safeText(output, currentPassword);
    setStrength(entropy);
  };

  lengthInput?.addEventListener('input', generate);
  Object.values(options).forEach((input) => input?.addEventListener('change', generate));
  generateButton?.addEventListener('click', generate);
  copyButton?.addEventListener('click', async () => {
    if (!currentPassword) return;

    try {
      await navigator.clipboard.writeText(currentPassword);
      setTemporaryStatus(status, 'Copied');
    } catch {
      setTemporaryStatus(status, 'Clipboard unavailable');
    }
  });

  generate();
}
