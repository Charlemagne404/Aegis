import { UNIT_GROUPS } from './constants.js';
import { $, formatNumber, safeText } from './shared.js';

export function initUnitConverter() {
  const categorySelect = $('#unit-category');
  const valueInput = $('#unit-value');
  const fromSelect = $('#unit-from');
  const toSelect = $('#unit-to');
  const result = $('#unit-result');
  const formula = $('#unit-formula');
  const swapButton = $('#unit-swap');

  const populateCategories = () => {
    if (!categorySelect) return;
    categorySelect.innerHTML = Object.entries(UNIT_GROUPS)
      .map(([key, group]) => `<option value="${key}">${group.label}</option>`)
      .join('');
  };

  const populateUnits = () => {
    const group = UNIT_GROUPS[categorySelect?.value] || UNIT_GROUPS['length'];
    const options = Object.entries(group.units)
      .map(([key, unit]) => `<option value="${key}">${unit.label}</option>`)
      .join('');

    if (fromSelect) fromSelect.innerHTML = options;
    if (toSelect) toSelect.innerHTML = options;

    const unitKeys = Object.keys(group.units);
    if (toSelect && unitKeys.length > 1) toSelect.value = unitKeys[1];
  };

  const convert = () => {
    const group = UNIT_GROUPS[categorySelect?.value];
    const fromUnit = group?.units[fromSelect?.value];
    const toUnit = group?.units[toSelect?.value];
    const value = Number(valueInput?.value ?? 0);

    if (!group || !fromUnit || !toUnit || !result || !Number.isFinite(value)) {
      return;
    }

    const baseValue = fromUnit.toBase ? fromUnit.toBase(value) : value * fromUnit.factor;
    const converted = toUnit.fromBase ? toUnit.fromBase(baseValue) : baseValue / toUnit.factor;
    const readable = formatNumber(converted, 6);
    const oneUnitBase = fromUnit.toBase ? fromUnit.toBase(1) : fromUnit.factor;
    const oneUnitConverted = toUnit.fromBase ? toUnit.fromBase(oneUnitBase) : oneUnitBase / toUnit.factor;

    result.innerHTML = `
      <strong>${readable}</strong>
      <small>${toUnit.label} from ${formatNumber(value, 6)} ${fromUnit.label.toLowerCase()}</small>
    `;
    safeText(formula, `1 ${fromUnit.label.toLowerCase()} = ${formatNumber(oneUnitConverted, 6)} ${toUnit.label.toLowerCase()}`);
  };

  populateCategories();
  populateUnits();
  convert();

  categorySelect?.addEventListener('change', () => {
    populateUnits();
    convert();
  });
  [valueInput, fromSelect, toSelect].forEach((element) => element?.addEventListener('input', convert));
  [fromSelect, toSelect].forEach((element) => element?.addEventListener('change', convert));
  swapButton?.addEventListener('click', () => {
    if (!fromSelect || !toSelect) return;
    const previous = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = previous;
    convert();
  });
}
