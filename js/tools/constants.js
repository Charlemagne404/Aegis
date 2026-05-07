export const TIME_ZONES = [
  'UTC',
  'Europe/Stockholm',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Helsinki',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Denver',
  'America/Sao_Paulo',
  'Asia/Tokyo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Seoul',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export const UNIT_GROUPS = {
  length: {
    label: 'Length',
    baseLabel: 'meters',
    units: {
      meter: { label: 'Meters', factor: 1 },
      kilometer: { label: 'Kilometers', factor: 1000 },
      centimeter: { label: 'Centimeters', factor: 0.01 },
      mile: { label: 'Miles', factor: 1609.344 },
      foot: { label: 'Feet', factor: 0.3048 },
      inch: { label: 'Inches', factor: 0.0254 },
    },
  },
  area: {
    label: 'Area',
    baseLabel: 'square meters',
    units: {
      square_meter: { label: 'Square meters', factor: 1 },
      square_kilometer: { label: 'Square kilometers', factor: 1_000_000 },
      square_foot: { label: 'Square feet', factor: 0.09290304 },
      acre: { label: 'Acres', factor: 4046.8564224 },
      hectare: { label: 'Hectares', factor: 10000 },
    },
  },
  volume: {
    label: 'Volume',
    baseLabel: 'liters',
    units: {
      liter: { label: 'Liters', factor: 1 },
      milliliter: { label: 'Milliliters', factor: 0.001 },
      cubic_meter: { label: 'Cubic meters', factor: 1000 },
      gallon_us: { label: 'US gallons', factor: 3.785411784 },
      quart_us: { label: 'US quarts', factor: 0.946352946 },
      cup_us: { label: 'US cups', factor: 0.2365882365 },
    },
  },
  weight: {
    label: 'Weight',
    baseLabel: 'kilograms',
    units: {
      kilogram: { label: 'Kilograms', factor: 1 },
      gram: { label: 'Grams', factor: 0.001 },
      pound: { label: 'Pounds', factor: 0.45359237 },
      ounce: { label: 'Ounces', factor: 0.028349523125 },
    },
  },
  temperature: {
    label: 'Temperature',
    baseLabel: 'celsius',
    units: {
      celsius: {
        label: 'Celsius',
        toBase: (value) => value,
        fromBase: (value) => value,
      },
      fahrenheit: {
        label: 'Fahrenheit',
        toBase: (value) => (value - 32) * (5 / 9),
        fromBase: (value) => value * (9 / 5) + 32,
      },
      kelvin: {
        label: 'Kelvin',
        toBase: (value) => value - 273.15,
        fromBase: (value) => value + 273.15,
      },
    },
  },
  data: {
    label: 'Digital storage',
    baseLabel: 'bytes',
    units: {
      byte: { label: 'Bytes', factor: 1 },
      kilobyte: { label: 'Kilobytes', factor: 1000 },
      megabyte: { label: 'Megabytes', factor: 1000 ** 2 },
      gigabyte: { label: 'Gigabytes', factor: 1000 ** 3 },
      kibibyte: { label: 'Kibibytes', factor: 1024 },
      mebibyte: { label: 'Mebibytes', factor: 1024 ** 2 },
      gibibyte: { label: 'Gibibytes', factor: 1024 ** 3 },
    },
  },
  speed: {
    label: 'Speed',
    baseLabel: 'meters per second',
    units: {
      meter_per_second: { label: 'Meters per second', factor: 1 },
      kilometer_per_hour: { label: 'Kilometers per hour', factor: 0.2777777778 },
      mile_per_hour: { label: 'Miles per hour', factor: 0.44704 },
      knot: { label: 'Knots', factor: 0.5144444444 },
    },
  },
  energy: {
    label: 'Energy',
    baseLabel: 'joules',
    units: {
      joule: { label: 'Joules', factor: 1 },
      kilojoule: { label: 'Kilojoules', factor: 1000 },
      calorie: { label: 'Calories', factor: 4.184 },
      kilowatt_hour: { label: 'Kilowatt-hours', factor: 3_600_000 },
    },
  },
};

export const PASSWORD_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/|~',
};

export const PASSWORD_AMBIGUOUS_CHARACTERS = new Set(['0', 'O', 'o', '1', 'l', 'I', '|']);
export const SPEED_HISTORY_STORAGE_KEY = 'aegis-speed-test-history';

export const QR_VERSION_TABLE = [
  null,
  { ecCodewords: 10, blocks: [16], alignment: [] },
  { ecCodewords: 16, blocks: [28], alignment: [6, 18] },
  { ecCodewords: 26, blocks: [44], alignment: [6, 22] },
  { ecCodewords: 18, blocks: [32, 32], alignment: [6, 26] },
  { ecCodewords: 24, blocks: [43, 43], alignment: [6, 30] },
  { ecCodewords: 16, blocks: [27, 27, 27, 27], alignment: [6, 34] },
  { ecCodewords: 18, blocks: [31, 31, 31, 31], alignment: [6, 22, 38] },
  { ecCodewords: 22, blocks: [38, 38, 39, 39], alignment: [6, 24, 42] },
  { ecCodewords: 22, blocks: [36, 36, 36, 37, 37], alignment: [6, 26, 46] },
  { ecCodewords: 26, blocks: [43, 43, 43, 43, 44], alignment: [6, 28, 50] },
];
