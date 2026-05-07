const icon = (paths) => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;

export const TOOLS = [
  {
    id: 'password',
    title: 'Password generator and strength checker',
    category: 'Security',
    summary: 'Create secure random passwords with length, character set, strength, and copy controls.',
    icon: icon('<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v2"/>'),
  },
  {
    id: 'case',
    title: 'Text case converter',
    category: 'Text',
    summary: 'Convert text to lowercase, uppercase, title case, camelCase, or snake_case with live previews.',
    icon: icon('<path d="M4 7h9"/><path d="M8.5 7v10"/><path d="M15 17l3-8 3 8"/><path d="M16 14h4"/>'),
  },
  {
    id: 'counter',
    title: 'Character and word counter',
    category: 'Text',
    summary: 'Count characters, words, and sentences as text changes.',
    icon: icon('<path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h8"/><path d="M17 15l2 2 3-4"/>'),
  },
  {
    id: 'qr',
    title: 'QR code generator',
    category: 'Share',
    summary: 'Generate a downloadable QR code from text or a URL instantly.',
    icon: icon('<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h2v2h-2z"/><path d="M18 14h2v6h-4v-2h2z"/>'),
  },
  {
    id: 'speed',
    title: 'Connection speed test',
    category: 'Network',
    summary: 'Measure ping, jitter, download, and upload speeds against your configured speed test server.',
    keywords: 'network speed test latency ping jitter bandwidth download upload',
    icon: icon('<path d="M12 19a7 7 0 1 0-7-7"/><path d="M12 12l4-4"/><path d="M4.6 17.4 3 19"/><path d="M20.9 19l-1.5-1.6"/>'),
  },
  {
    id: 'timezone',
    title: 'Timezone converter',
    category: 'Time',
    summary: 'Convert a date and time between common global timezones using browser Intl data.',
    icon: icon('<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/><path d="M3 12h2"/><path d="M19 12h2"/>'),
  },
  {
    id: 'timer',
    title: 'Countdown and stopwatch',
    category: 'Time',
    summary: 'Run a focused countdown or track elapsed time with quick lap capture.',
    icon: icon('<path d="M9 2h6"/><path d="M12 14l3-3"/><circle cx="12" cy="14" r="8"/><path d="M18 5l1.5 1.5"/>'),
  },
  {
    id: 'random',
    title: 'Random number generator',
    category: 'Numbers',
    summary: 'Generate secure random integers, including optional unique sets.',
    icon: icon('<path d="M4 7h4l8 10h4"/><path d="M18 7h2v2"/><path d="M4 17h4l2.2-2.8"/><path d="M15.8 9.8 18 7"/><path d="M18 17h2v-2"/>'),
  },
  {
    id: 'converter',
    title: 'Unit converter',
    category: 'Measure',
    summary: 'Convert length, weight, temperature, and digital storage values instantly.',
    icon: icon('<path d="M4 7h16"/><path d="M4 17h16"/><path d="M7 7v10"/><path d="M12 7v4"/><path d="M17 7v10"/>'),
  },
];

const TIME_ZONES = [
  'UTC',
  'Europe/Stockholm',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
];

const UNIT_GROUPS = {
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
};

const PASSWORD_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/|~',
};

const QR_VERSION_TABLE = [
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

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const pad = (value, length = 2) => String(value).padStart(length, '0');

const formatNumber = (value, maximumFractionDigits = 2) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(value);

const formatDuration = (milliseconds, showHundredths = false) => {
  const safeMs = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.floor((safeMs % 1000) / 10);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}${showHundredths ? `.${pad(hundredths)}` : ''}`;
};

const toDateTimeLocalValue = (date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const safeText = (node, text) => {
  if (node) {
    node.textContent = text;
  }
};

const setTemporaryStatus = (node, message, delay = 1800) => {
  safeText(node, message);
  if (message) {
    window.setTimeout(() => {
      if (node?.textContent === message) safeText(node, '');
    }, delay);
  }
};

function initPasswordTool() {
  const lengthInput = $('#password-length');
  const lengthLabel = $('#password-length-label');
  const generateButton = $('#password-generate');
  const copyButton = $('#password-copy');
  const output = $('#password-output');
  const status = $('#password-status');
  const strengthLabel = $('#password-strength-label');
  const strengthBar = $('#password-strength-bar');
  const options = {
    lowercase: $('#password-lowercase'),
    uppercase: $('#password-uppercase'),
    numbers: $('#password-numbers'),
    symbols: $('#password-symbols'),
  };
  let currentPassword = '';

  const selectedSets = () =>
    Object.entries(options)
      .filter(([, input]) => input?.checked)
      .map(([key]) => PASSWORD_SETS[key]);

  const setStrength = (passwordLength, characterSetSize) => {
    const entropy = characterSetSize > 0 ? passwordLength * Math.log2(characterSetSize) : 0;
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

    safeText(lengthLabel, `${length} characters`);
    if (!combined) {
      currentPassword = '';
      safeText(output, 'Select at least one character type.');
      setStrength(0, 0);
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
    setStrength(length, combined.length);
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

function initCaseConverter() {
  const input = $('#case-input');
  const output = $('#case-output');
  const modeLabel = $('#case-mode-label');
  const modeButtons = $$('[data-case-mode]');
  const labels = {
    lower: 'lowercase',
    upper: 'UPPERCASE',
    title: 'Title Case',
    camel: 'camelCase',
    snake: 'snake_case',
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

  convert();
}

function initCounterTool() {
  const input = $('#counter-input');
  const characterCount = $('#counter-characters');
  const wordCount = $('#counter-words');
  const sentenceCount = $('#counter-sentences');

  const update = () => {
    const text = input?.value || '';
    const trimmed = text.trim();
    const words = trimmed.match(/[\p{L}\p{N}]+(?:['-][\p{L}\p{N}]+)*/gu) || [];
    const sentences = trimmed
      .split(/[.!?]+/)
      .filter((sentence) => /[\p{L}\p{N}]/u.test(sentence));

    safeText(characterCount, formatNumber(text.length, 0));
    safeText(wordCount, formatNumber(words.length, 0));
    safeText(sentenceCount, formatNumber(sentences.length, 0));
  };

  input?.addEventListener('input', update);
  update();
}

function initQrGenerator() {
  const input = $('#qr-input');
  const canvas = $('#qr-canvas');
  const downloadButton = $('#qr-download');
  const status = $('#qr-status');
  let hasQrCode = false;

  const render = () => {
    const text = input?.value || '';

    if (!text) {
      hasQrCode = false;
      drawQrPlaceholder(canvas);
      safeText(status, 'Enter text');
      if (downloadButton) downloadButton.disabled = true;
      return;
    }

    try {
      const matrix = createQrMatrix(text);
      drawQrCanvas(canvas, matrix);
      hasQrCode = true;
      safeText(status, `${matrix.length} x ${matrix.length}`);
      if (downloadButton) downloadButton.disabled = false;
    } catch (error) {
      hasQrCode = false;
      drawQrPlaceholder(canvas);
      safeText(status, error.message || 'Unable to generate');
      if (downloadButton) downloadButton.disabled = true;
    }
  };

  input?.addEventListener('input', render);
  downloadButton?.addEventListener('click', () => {
    if (!canvas || !hasQrCode) return;

    const link = document.createElement('a');
    link.download = 'aegis-qr-code.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  render();
}

function initSpeedTest() {
  const startButton = $('#speed-start');
  const resetButton = $('#speed-reset');
  const ring = $('.gauge-ring');
  const progressNode = $('#speed-progress');
  const phaseNode = $('#speed-phase');
  const serverNode = $('#speed-server');
  const noteNode = $('#speed-note-inline');
  const configStateNode = $('#speed-config-state');
  const pingNode = $('#speed-ping');
  const jitterNode = $('#speed-jitter');
  const downloadNode = $('#speed-download');
  const uploadNode = $('#speed-upload');
  let controller = null;
  let config = null;

  const setProgress = (progress) => {
    const rounded = Math.round(progress);
    ring?.style.setProperty('--progress', `${rounded * 3.6}deg`);
    safeText(progressNode, `${rounded}%`);
  };

  const resetMetrics = () => {
    safeText(pingNode, '--');
    safeText(jitterNode, '--');
    safeText(downloadNode, '--');
    safeText(uploadNode, '--');
    setProgress(0);
  };

  const setButtonState = ({ ready = false, running = false }) => {
    if (startButton) {
      startButton.disabled = !ready && !running;
      safeText(startButton, running ? 'Cancel test' : 'Start test');
    }

    if (resetButton) {
      resetButton.disabled = false;
    }
  };

  const showStatus = (message, stateLabel = 'Setup required') => {
    safeText(configStateNode, stateLabel);
    safeText(noteNode, message);
  };

  const restoreIdleState = () => {
    safeText(serverNode, `Server: ${config?.serverLabel || 'not configured'}`);
    safeText(phaseNode, config?.ready ? 'Ready to test' : (config ? 'Awaiting configuration' : 'Configuration missing'));

    if (config?.ready) {
      showStatus(
        'Live browser test is ready. Results are approximate and depend on browser, device, and route conditions.',
        'Ready',
      );
      setButtonState({ ready: true });
      return;
    }

    showStatus(describeSpeedTestConfigIssue(config));
    setButtonState({ ready: false });
  };

  const applyConfig = (nextConfig, errorMessage = '') => {
    config = nextConfig;
    if (!config) {
      safeText(serverNode, 'Server: not configured');
      safeText(phaseNode, 'Configuration missing');
      showStatus(errorMessage || 'Add speed-test-config.json to this site to enable live testing.');
      setButtonState({ ready: false });
      return;
    }

    if (!config.ready) {
      safeText(serverNode, `Server: ${config.serverLabel}`);
      safeText(phaseNode, 'Awaiting configuration');
      showStatus(errorMessage || describeSpeedTestConfigIssue(config));
      setButtonState({ ready: false });
      return;
    }

    restoreIdleState();
  };

  const loadConfig = async () => {
    if (window.location.protocol === 'file:') {
      applyConfig(null, 'Serve the site over http:// or https:// before running the speed test.');
      return;
    }

    safeText(phaseNode, 'Loading configuration');
    safeText(serverNode, 'Server: loading');
    showStatus('Reading speed-test-config.json from this site.', 'Loading');
    if (startButton) startButton.disabled = true;

    try {
      applyConfig(await fetchSpeedTestConfig());
    } catch (error) {
      applyConfig(null, error.message || 'Unable to read speed-test-config.json.');
    }
  };

  startButton?.addEventListener('click', async () => {
    if (controller) {
      controller.abort();
      return;
    }

    if (!config?.ready) {
      showStatus(describeSpeedTestConfigIssue(config));
      return;
    }

    controller = new AbortController();
    resetMetrics();
    safeText(serverNode, `Server: ${config.serverLabel}`);
    showStatus('Running live requests against your configured speed test server.', 'Live');
    setButtonState({ ready: true, running: true });

    try {
      safeText(phaseNode, 'Measuring latency');
      const latency = await measureSpeedTestLatency(config, controller.signal, (completed, total) => {
        setProgress((completed / total) * 20);
        safeText(phaseNode, `Measuring latency ${completed}/${total}`);
      });
      safeText(pingNode, formatMetric(latency.ping));
      safeText(jitterNode, formatMetric(latency.jitter));

      safeText(phaseNode, 'Testing download');
      const download = await measureSpeedTestDownload(config, controller.signal, (fraction, sampleIndex, totalSamples) => {
        setProgress(20 + (fraction * 50));
        safeText(phaseNode, `Testing download ${sampleIndex}/${totalSamples}`);
      });
      safeText(downloadNode, formatMetric(download.mbps));

      safeText(phaseNode, 'Testing upload');
      const upload = await measureSpeedTestUpload(config, controller.signal, (fraction, sampleIndex, totalSamples) => {
        setProgress(70 + (fraction * 30));
        safeText(phaseNode, `Testing upload ${sampleIndex}/${totalSamples}`);
      });
      safeText(uploadNode, formatMetric(upload.mbps));

      setProgress(100);
      safeText(phaseNode, 'Test complete');
      showStatus('Latest run completed successfully. Run it again to compare conditions.', 'Complete');
    } catch (error) {
      if (error.name === 'AbortError') {
        safeText(phaseNode, 'Test cancelled');
        showStatus('The test was cancelled before completion.', 'Cancelled');
      } else {
        safeText(phaseNode, 'Test failed');
        showStatus(error.message || 'The speed test could not complete.', 'Error');
      }
    } finally {
      controller = null;
      setButtonState({ ready: Boolean(config?.ready), running: false });
    }
  });

  resetButton?.addEventListener('click', () => {
    controller?.abort();
    resetMetrics();
    restoreIdleState();
  });

  resetMetrics();
  loadConfig();
}

async function fetchSpeedTestConfig() {
  const response = await fetch(resolveSpeedTestUrl('speed-test-config.json'), {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('speed-test-config.json was not found on this site.');
  }

  try {
    return normalizeSpeedTestConfig(await response.json());
  } catch {
    throw new Error('speed-test-config.json is not valid JSON.');
  }
}

function normalizeSpeedTestConfig(rawConfig = {}) {
  const latency = rawConfig.latency || {};
  const download = rawConfig.download || {};
  const upload = rawConfig.upload || {};

  const config = {
    enabled: Boolean(rawConfig.enabled),
    serverLabel: String(rawConfig.serverLabel || rawConfig.server || 'Configured speed test server'),
    latencyUrl: String(latency.url || rawConfig.latencyUrl || '').trim(),
    downloadUrl: String(download.url || rawConfig.downloadUrl || '').trim(),
    uploadUrl: String(upload.url || rawConfig.uploadUrl || '').trim(),
    latencyAttempts: toPositiveInteger(latency.attempts || rawConfig.latencyAttempts, 5),
    latencyTimeoutMs: toPositiveInteger(latency.timeoutMs || rawConfig.latencyTimeoutMs, 4000),
    downloadTimeoutMs: toPositiveInteger(download.timeoutMs || rawConfig.downloadTimeoutMs, 20000),
    uploadTimeoutMs: toPositiveInteger(upload.timeoutMs || rawConfig.uploadTimeoutMs, 20000),
    downloadSizes: normalizeByteList(download.sizes || rawConfig.downloadSizes, [250000, 1000000, 5000000, 10000000]),
    uploadSizes: normalizeByteList(upload.sizes || rawConfig.uploadSizes, [250000, 1000000, 4000000]),
  };

  config.ready = Boolean(config.enabled && config.latencyUrl && config.downloadUrl && config.uploadUrl);
  return config;
}

function describeSpeedTestConfigIssue(config) {
  if (!config) {
    return 'Add speed-test-config.json to this site and point it at your speed test endpoints.';
  }

  if (!config.enabled) {
    return 'speed-test-config.json is present, but `enabled` is still set to false.';
  }

  const missing = [
    !config.latencyUrl && 'latencyUrl',
    !config.downloadUrl && 'downloadUrl',
    !config.uploadUrl && 'uploadUrl',
  ].filter(Boolean);

  if (missing.length) {
    return `Add ${missing.join(', ')} to speed-test-config.json before running the test.`;
  }

  return 'The speed test configuration is incomplete.';
}

async function measureSpeedTestLatency(config, signal, onProgress) {
  const attempts = [];

  for (let index = 0; index < config.latencyAttempts; index += 1) {
    const result = await runSpeedTestRequest({
      url: config.latencyUrl,
      timeoutMs: config.latencyTimeoutMs,
      signal,
    });
    attempts.push(result.elapsedMs);
    onProgress?.(index + 1, config.latencyAttempts);
  }

  const sorted = [...attempts].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const ping = sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
  const jitter = attempts.length < 2
    ? 0
    : attempts
      .slice(1)
      .reduce((total, sample, index) => total + Math.abs(sample - attempts[index]), 0) / (attempts.length - 1);

  return { ping, jitter };
}

async function measureSpeedTestDownload(config, signal, onProgress) {
  const totalExpectedBytes = config.downloadSizes.reduce((total, bytes) => total + bytes, 0);
  let completedBytes = 0;
  let totalMeasuredBytes = 0;
  let totalElapsedMs = 0;

  for (let index = 0; index < config.downloadSizes.length; index += 1) {
    const sampleBytes = config.downloadSizes[index];
    const result = await runSpeedTestRequest({
      url: config.downloadUrl,
      bytes: sampleBytes,
      timeoutMs: config.downloadTimeoutMs,
      signal,
      onProgress: (loadedBytes) => {
        const fraction = clamp((completedBytes + loadedBytes) / totalExpectedBytes, 0, 1);
        onProgress?.(fraction, index + 1, config.downloadSizes.length);
      },
    });

    completedBytes += sampleBytes;
    totalMeasuredBytes += result.bytesTransferred;
    totalElapsedMs += result.elapsedMs;
    onProgress?.(clamp(completedBytes / totalExpectedBytes, 0, 1), index + 1, config.downloadSizes.length);
  }

  return {
    mbps: bytesToMbps(totalMeasuredBytes, totalElapsedMs),
  };
}

async function measureSpeedTestUpload(config, signal, onProgress) {
  const totalExpectedBytes = config.uploadSizes.reduce((total, bytes) => total + bytes, 0);
  let completedBytes = 0;
  let totalElapsedMs = 0;

  for (let index = 0; index < config.uploadSizes.length; index += 1) {
    const sampleBytes = config.uploadSizes[index];
    const payload = new Uint8Array(sampleBytes);
    const result = await runSpeedTestRequest({
      url: config.uploadUrl,
      method: 'POST',
      bytes: sampleBytes,
      body: payload.buffer,
      timeoutMs: config.uploadTimeoutMs,
      signal,
      onUploadProgress: (loadedBytes) => {
        const fraction = clamp((completedBytes + loadedBytes) / totalExpectedBytes, 0, 1);
        onProgress?.(fraction, index + 1, config.uploadSizes.length);
      },
    });

    completedBytes += sampleBytes;
    totalElapsedMs += result.elapsedMs;
    onProgress?.(clamp(completedBytes / totalExpectedBytes, 0, 1), index + 1, config.uploadSizes.length);
  }

  return {
    mbps: bytesToMbps(totalExpectedBytes, totalElapsedMs),
  };
}

function runSpeedTestRequest({
  url,
  method = 'GET',
  bytes = 0,
  body = null,
  timeoutMs = 15000,
  signal,
  onProgress,
  onUploadProgress,
}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const requestUrl = resolveSpeedTestUrl(url, bytes);
    const startedAt = performance.now();
    let abortedExternally = false;

    xhr.open(method, requestUrl, true);
    xhr.responseType = 'arraybuffer';
    xhr.timeout = timeoutMs;

    xhr.onprogress = (event) => {
      const loaded = event.lengthComputable ? event.loaded : (xhr.response?.byteLength || 0);
      onProgress?.(loaded);
    };

    xhr.upload.onprogress = (event) => {
      const loaded = event.lengthComputable ? event.loaded : 0;
      onUploadProgress?.(loaded);
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Speed test server responded with ${xhr.status}.`));
        return;
      }

      const elapsedMs = performance.now() - startedAt;
      const bytesTransferred = xhr.response?.byteLength || bytes || 0;
      resolve({ elapsedMs, bytesTransferred });
    };

    xhr.onerror = () => reject(new Error('The speed test server could not be reached. Check CORS, routing, and endpoint availability.'));
    xhr.ontimeout = () => reject(new Error('The speed test request timed out. Increase the timeout or reduce the sample size.'));
    xhr.onabort = () => reject(abortedExternally ? new DOMException('Aborted', 'AbortError') : new Error('The speed test request was aborted.'));

    const abort = () => {
      abortedExternally = true;
      xhr.abort();
    };

    signal?.addEventListener('abort', abort, { once: true });
    xhr.send(body);
  });
}

function resolveSpeedTestUrl(path, bytes = 0) {
  const templatedPath = bytes ? String(path).replaceAll('{bytes}', String(bytes)) : String(path);
  const resolved = new URL(templatedPath, window.location.href);

  if (bytes && !String(path).includes('{bytes}') && !resolved.searchParams.has('bytes')) {
    resolved.searchParams.set('bytes', String(bytes));
  }

  resolved.searchParams.set('cacheBust', `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  return resolved.toString();
}

function normalizeByteList(input, fallback) {
  if (!Array.isArray(input)) return fallback;

  const parsed = input
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => Math.round(value));

  return parsed.length ? parsed : fallback;
}

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.round(parsed);
}

function bytesToMbps(bytes, elapsedMs) {
  if (!bytes || !elapsedMs) return 0;
  return (bytes * 8) / (elapsedMs / 1000) / 1_000_000;
}

function formatMetric(value) {
  return formatNumber(value, value >= 100 ? 0 : 1);
}

function initTimezoneConverter() {
  const input = $('#timezone-input');
  const fromSelect = $('#timezone-from');
  const toSelect = $('#timezone-to');
  const result = $('#timezone-result');
  const clocks = $('#timezone-clocks');
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const zones = TIME_ZONES.includes(localZone) ? TIME_ZONES : [localZone, ...TIME_ZONES];

  const populateZoneSelect = (select, selected) => {
    if (!select) return;
    select.innerHTML = zones
      .map((zone) => `<option value="${zone}"${zone === selected ? ' selected' : ''}>${zone.replace('_', ' ')}</option>`)
      .join('');
  };

  const renderClocks = () => {
    if (!clocks) return;
    const visibleZones = [...new Set([fromSelect?.value, toSelect?.value, 'UTC', 'Asia/Tokyo'].filter(Boolean))].slice(0, 4);
    const now = new Date();
    clocks.innerHTML = visibleZones
      .map(
        (zone) => `
          <div class="clock-card">
            <span>${zone.replace('_', ' ')}</span>
            <strong>${formatInTimeZone(now, zone, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
          </div>
        `,
      )
      .join('');
  };

  const convert = () => {
    if (!input?.value || !fromSelect?.value || !toSelect?.value || !result) {
      return;
    }

    const parsed = parseDateTimeLocal(input.value);
    if (!parsed) {
      result.textContent = 'Enter a valid date and time.';
      return;
    }

    const utcDate = zonedTimeToUtc(parsed, fromSelect.value);
    const targetText = formatInTimeZone(utcDate, toSelect.value, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
    const sourceText = formatInTimeZone(utcDate, fromSelect.value, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    result.innerHTML = `
      <span>${sourceText}</span>
      <strong>${targetText}</strong>
    `;
    renderClocks();
  };

  populateZoneSelect(fromSelect, localZone);
  populateZoneSelect(toSelect, localZone === 'UTC' ? 'Europe/Stockholm' : 'UTC');
  if (input) input.value = toDateTimeLocalValue(new Date());

  input?.addEventListener('input', convert);
  fromSelect?.addEventListener('change', convert);
  toSelect?.addEventListener('change', convert);
  convert();
  window.setInterval(renderClocks, 1000);
}

function initTimerTool() {
  const timerDisplay = $('#timer-display');
  const timerStatus = $('#timer-status');
  const timerStart = $('#timer-start');
  const timerPause = $('#timer-pause');
  const timerReset = $('#timer-reset');
  const hoursInput = $('#timer-hours');
  const minutesInput = $('#timer-minutes');
  const secondsInput = $('#timer-seconds');
  let timerRemaining = readDuration();
  let timerEnd = 0;
  let timerFrame = null;
  let isTimerRunning = false;

  const updateTimerDisplay = () => {
    safeText(timerDisplay, formatDuration(timerRemaining));
  };

  const setTimerStatus = (status) => safeText(timerStatus, status);

  const tickTimer = () => {
    if (!isTimerRunning) return;
    timerRemaining = Math.max(0, timerEnd - Date.now());
    updateTimerDisplay();

    if (timerRemaining <= 0) {
      isTimerRunning = false;
      window.clearInterval(timerFrame);
      setTimerStatus('Done');
      safeText(timerStart, 'Start');
      window.dispatchEvent(new CustomEvent('aegis:timer-complete'));
      return;
    }
  };

  const syncDuration = () => {
    if (!isTimerRunning) {
      timerRemaining = readDuration();
      updateTimerDisplay();
    }
  };

  [hoursInput, minutesInput, secondsInput].forEach((input) => input?.addEventListener('input', syncDuration));

  timerStart?.addEventListener('click', () => {
    if (isTimerRunning) return;
    if (timerRemaining <= 0) timerRemaining = readDuration();
    if (timerRemaining <= 0) {
      setTimerStatus('Set a duration');
      return;
    }

    timerEnd = Date.now() + timerRemaining;
    isTimerRunning = true;
    setTimerStatus('Running');
    safeText(timerStart, 'Resume');
    window.clearInterval(timerFrame);
    timerFrame = window.setInterval(tickTimer, 100);
    tickTimer();
  });

  timerPause?.addEventListener('click', () => {
    if (!isTimerRunning) return;
    isTimerRunning = false;
    window.clearInterval(timerFrame);
    timerRemaining = Math.max(0, timerEnd - Date.now());
    setTimerStatus('Paused');
    updateTimerDisplay();
  });

  timerReset?.addEventListener('click', () => {
    isTimerRunning = false;
    window.clearInterval(timerFrame);
    timerRemaining = readDuration();
    setTimerStatus('Idle');
    safeText(timerStart, 'Start');
    updateTimerDisplay();
  });

  function readDuration() {
    const hours = clamp(Number(hoursInput?.value || 0), 0, 99);
    const minutes = clamp(Number(minutesInput?.value || 0), 0, 59);
    const seconds = clamp(Number(secondsInput?.value || 0), 0, 59);
    return ((hours * 3600) + (minutes * 60) + seconds) * 1000;
  }

  updateTimerDisplay();
  initStopwatch();
}

function initStopwatch() {
  const display = $('#stopwatch-display');
  const status = $('#stopwatch-status');
  const startButton = $('#stopwatch-start');
  const lapButton = $('#stopwatch-lap');
  const resetButton = $('#stopwatch-reset');
  const lapList = $('#lap-list');
  let running = false;
  let startedAt = 0;
  let elapsed = 0;
  let frame = null;

  const currentElapsed = () => (running ? elapsed + (Date.now() - startedAt) : elapsed);

  const render = () => {
    safeText(display, formatDuration(currentElapsed(), true));
  };

  const loop = () => {
    render();
    if (running) frame = window.requestAnimationFrame(loop);
  };

  startButton?.addEventListener('click', () => {
    if (running) {
      elapsed = currentElapsed();
      running = false;
      window.cancelAnimationFrame(frame);
      safeText(startButton, 'Start');
      safeText(status, 'Paused');
      render();
      return;
    }

    running = true;
    startedAt = Date.now();
    safeText(startButton, 'Pause');
    safeText(status, 'Running');
    loop();
  });

  lapButton?.addEventListener('click', () => {
    const lapTime = currentElapsed();
    if (!lapList || lapTime <= 0) return;
    const item = document.createElement('li');
    const lapNumber = lapList.children.length + 1;
    item.innerHTML = `<span>Lap ${lapNumber}</span><strong>${formatDuration(lapTime, true)}</strong>`;
    lapList.prepend(item);
  });

  resetButton?.addEventListener('click', () => {
    running = false;
    elapsed = 0;
    startedAt = 0;
    window.cancelAnimationFrame(frame);
    safeText(startButton, 'Start');
    safeText(status, 'Idle');
    if (lapList) lapList.innerHTML = '';
    render();
  });

  render();
}

function initRandomGenerator() {
  const minInput = $('#random-min');
  const maxInput = $('#random-max');
  const countInput = $('#random-count');
  const uniqueInput = $('#random-unique');
  const generateButton = $('#random-generate');
  const copyButton = $('#random-copy');
  const result = $('#random-result');
  const status = $('#random-status');
  let currentResult = '42';

  const setStatus = (message) => {
    safeText(status, message);
    if (message) {
      window.setTimeout(() => safeText(status, ''), 1800);
    }
  };

  const generate = () => {
    let min = Math.trunc(Number(minInput?.value ?? 1));
    let max = Math.trunc(Number(maxInput?.value ?? 100));
    let count = clamp(Math.trunc(Number(countInput?.value ?? 1)), 1, 100);
    const unique = Boolean(uniqueInput?.checked);

    if (min > max) [min, max] = [max, min];

    const range = max - min + 1;
    if (!Number.isFinite(range) || range <= 0 || range > 0xffffffff) {
      safeText(result, 'Range is too large.');
      return;
    }

    if (unique && count > range) {
      safeText(result, 'Unique quantity exceeds the range.');
      return;
    }

    const values = [];
    const used = new Set();

    while (values.length < count) {
      const value = randomInt(min, max);
      if (unique && used.has(value)) continue;
      used.add(value);
      values.push(value);
    }

    currentResult = values.join(', ');
    safeText(result, currentResult);
    setStatus('Generated');
  };

  generateButton?.addEventListener('click', generate);
  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentResult);
      setStatus('Copied');
    } catch {
      setStatus('Clipboard unavailable');
    }
  });

  generate();
}

function initUnitConverter() {
  const categorySelect = $('#unit-category');
  const valueInput = $('#unit-value');
  const fromSelect = $('#unit-from');
  const toSelect = $('#unit-to');
  const result = $('#unit-result');

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

    result.innerHTML = `
      <strong>${readable}</strong>
      <small>${toUnit.label} from ${formatNumber(value, 6)} ${fromUnit.label.toLowerCase()}</small>
    `;
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
}

export function initToolModules() {
  initPasswordTool();
  initCaseConverter();
  initCounterTool();
  initQrGenerator();
  initSpeedTest();
  initTimezoneConverter();
  initTimerTool();
  initRandomGenerator();
  initUnitConverter();
}

function convertTextCase(text, mode) {
  const words = text.match(/[\p{L}\p{N}]+/gu) || [];

  if (mode === 'upper') return text.toUpperCase();
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

  return text.toLowerCase();
}

function createQrMatrix(text) {
  const bytes = [...new TextEncoder().encode(text)];
  const version = selectQrVersion(bytes.length);

  if (version < 1) {
    throw new Error('Text is too long.');
  }

  const dataCodewords = createQrDataCodewords(bytes, version);
  const finalCodewords = addQrErrorCorrection(dataCodewords, version);
  const dataBits = finalCodewords.flatMap((codeword) =>
    Array.from({ length: 8 }, (_, index) => getQrBit(codeword, 7 - index)),
  );
  const baseMatrix = createQrBaseMatrix(version);

  placeQrDataBits(baseMatrix, dataBits);

  let bestMatrix = null;
  let bestPenalty = Number.POSITIVE_INFINITY;

  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = cloneQrMatrix(baseMatrix);
    applyQrMask(candidate, mask);
    drawQrFormatBits(candidate, mask);

    const penalty = scoreQrMatrix(candidate.modules);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMatrix = candidate.modules;
    }
  }

  return bestMatrix;
}

function selectQrVersion(byteLength) {
  return QR_VERSION_TABLE.findIndex((entry, version) => {
    if (!entry) return false;
    const countBits = version < 10 ? 8 : 16;
    const requiredBits = 4 + countBits + (byteLength * 8);
    const capacityBits = entry.blocks.reduce((sum, blockLength) => sum + blockLength, 0) * 8;
    return requiredBits <= capacityBits;
  });
}

function createQrDataCodewords(bytes, version) {
  const metadata = QR_VERSION_TABLE[version];
  const capacityBits = metadata.blocks.reduce((sum, blockLength) => sum + blockLength, 0) * 8;
  const bits = [];

  appendQrBits(bits, 0x4, 4);
  appendQrBits(bits, bytes.length, version < 10 ? 8 : 16);
  bytes.forEach((byte) => appendQrBits(bits, byte, 8));

  if (bits.length > capacityBits) {
    throw new Error('Text is too long.');
  }

  appendQrBits(bits, 0, Math.min(4, capacityBits - bits.length));
  while (bits.length % 8 !== 0) appendQrBits(bits, 0, 1);

  const codewords = [];
  for (let index = 0; index < bits.length; index += 8) {
    codewords.push(bits.slice(index, index + 8).reduce((value, bit) => (value << 1) | Number(bit), 0));
  }

  const padBytes = [0xec, 0x11];
  let padIndex = 0;
  while (codewords.length < capacityBits / 8) {
    codewords.push(padBytes[padIndex % 2]);
    padIndex += 1;
  }

  return codewords;
}

function appendQrBits(bits, value, length) {
  for (let index = length - 1; index >= 0; index -= 1) {
    bits.push(((value >>> index) & 1) === 1);
  }
}

function addQrErrorCorrection(dataCodewords, version) {
  const metadata = QR_VERSION_TABLE[version];
  const blocks = [];
  let offset = 0;

  metadata.blocks.forEach((blockLength) => {
    const dataBlock = dataCodewords.slice(offset, offset + blockLength);
    blocks.push({
      data: dataBlock,
      error: computeReedSolomonRemainder(dataBlock, metadata.ecCodewords),
    });
    offset += blockLength;
  });

  const result = [];
  const longestDataBlock = Math.max(...blocks.map((block) => block.data.length));

  for (let index = 0; index < longestDataBlock; index += 1) {
    blocks.forEach((block) => {
      if (index < block.data.length) result.push(block.data[index]);
    });
  }

  for (let index = 0; index < metadata.ecCodewords; index += 1) {
    blocks.forEach((block) => result.push(block.error[index]));
  }

  return result;
}

function createQrBaseMatrix(version) {
  const size = (version * 4) + 17;
  const matrix = {
    version,
    size,
    modules: Array.from({ length: size }, () => Array(size).fill(false)),
    reserved: Array.from({ length: size }, () => Array(size).fill(false)),
  };

  drawQrFinderPattern(matrix, 3, 3);
  drawQrFinderPattern(matrix, size - 4, 3);
  drawQrFinderPattern(matrix, 3, size - 4);
  drawQrAlignmentPatterns(matrix, QR_VERSION_TABLE[version].alignment);
  drawQrTimingPatterns(matrix);
  drawQrFormatBits(matrix, 0);

  if (version >= 7) drawQrVersionBits(matrix);

  setQrFunctionModule(matrix, 8, (4 * version) + 9, true);

  return matrix;
}

function cloneQrMatrix(matrix) {
  return {
    version: matrix.version,
    size: matrix.size,
    modules: matrix.modules.map((row) => row.slice()),
    reserved: matrix.reserved.map((row) => row.slice()),
  };
}

function drawQrFinderPattern(matrix, centerX, centerY) {
  for (let y = -4; y <= 4; y += 1) {
    for (let x = -4; x <= 4; x += 1) {
      const distance = Math.max(Math.abs(x), Math.abs(y));
      const moduleX = centerX + x;
      const moduleY = centerY + y;

      if (moduleX < 0 || moduleY < 0 || moduleX >= matrix.size || moduleY >= matrix.size) continue;
      setQrFunctionModule(matrix, moduleX, moduleY, distance !== 2 && distance !== 4);
    }
  }
}

function drawQrAlignmentPatterns(matrix, positions) {
  positions.forEach((centerY) => {
    positions.forEach((centerX) => {
      if (matrix.reserved[centerY]?.[centerX]) return;

      for (let y = -2; y <= 2; y += 1) {
        for (let x = -2; x <= 2; x += 1) {
          const distance = Math.max(Math.abs(x), Math.abs(y));
          setQrFunctionModule(matrix, centerX + x, centerY + y, distance !== 1);
        }
      }
    });
  });
}

function drawQrTimingPatterns(matrix) {
  for (let index = 8; index < matrix.size - 8; index += 1) {
    const isDark = index % 2 === 0;
    setQrFunctionModule(matrix, index, 6, isDark);
    setQrFunctionModule(matrix, 6, index, isDark);
  }
}

function drawQrFormatBits(matrix, mask) {
  const bits = getQrFormatBits(mask);

  for (let index = 0; index <= 5; index += 1) setQrFunctionModule(matrix, 8, index, getQrBit(bits, index));
  setQrFunctionModule(matrix, 8, 7, getQrBit(bits, 6));
  setQrFunctionModule(matrix, 8, 8, getQrBit(bits, 7));
  setQrFunctionModule(matrix, 7, 8, getQrBit(bits, 8));
  for (let index = 9; index < 15; index += 1) setQrFunctionModule(matrix, 14 - index, 8, getQrBit(bits, index));

  for (let index = 0; index < 8; index += 1) setQrFunctionModule(matrix, matrix.size - 1 - index, 8, getQrBit(bits, index));
  for (let index = 8; index < 15; index += 1) setQrFunctionModule(matrix, 8, matrix.size - 15 + index, getQrBit(bits, index));
  setQrFunctionModule(matrix, 8, matrix.size - 8, true);
}

function drawQrVersionBits(matrix) {
  const bits = getQrVersionBits(matrix.version);

  for (let index = 0; index < 18; index += 1) {
    const bit = getQrBit(bits, index);
    const x = matrix.size - 11 + (index % 3);
    const y = Math.floor(index / 3);
    setQrFunctionModule(matrix, x, y, bit);
    setQrFunctionModule(matrix, y, x, bit);
  }
}

function setQrFunctionModule(matrix, x, y, isDark) {
  if (x < 0 || y < 0 || x >= matrix.size || y >= matrix.size) return;

  matrix.modules[y][x] = Boolean(isDark);
  matrix.reserved[y][x] = true;
}

function placeQrDataBits(matrix, dataBits) {
  let bitIndex = 0;
  let upward = true;

  for (let right = matrix.size - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;

    for (let vertical = 0; vertical < matrix.size; vertical += 1) {
      const y = upward ? matrix.size - 1 - vertical : vertical;

      for (let columnOffset = 0; columnOffset < 2; columnOffset += 1) {
        const x = right - columnOffset;
        if (matrix.reserved[y][x]) continue;

        matrix.modules[y][x] = bitIndex < dataBits.length ? dataBits[bitIndex] : false;
        bitIndex += 1;
      }
    }

    upward = !upward;
  }
}

function applyQrMask(matrix, mask) {
  for (let y = 0; y < matrix.size; y += 1) {
    for (let x = 0; x < matrix.size; x += 1) {
      if (!matrix.reserved[y][x] && qrMaskApplies(mask, x, y)) {
        matrix.modules[y][x] = !matrix.modules[y][x];
      }
    }
  }
}

function qrMaskApplies(mask, x, y) {
  if (mask === 0) return (x + y) % 2 === 0;
  if (mask === 1) return y % 2 === 0;
  if (mask === 2) return x % 3 === 0;
  if (mask === 3) return (x + y) % 3 === 0;
  if (mask === 4) return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
  if (mask === 5) return ((x * y) % 2) + ((x * y) % 3) === 0;
  if (mask === 6) return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
  return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
}

function scoreQrMatrix(modules) {
  const size = modules.length;
  let penalty = 0;
  let darkCount = 0;

  const scoreLine = (line) => {
    let linePenalty = 0;
    let runColor = line[0];
    let runLength = 1;

    for (let index = 1; index < line.length; index += 1) {
      if (line[index] === runColor) {
        runLength += 1;
        continue;
      }

      if (runLength >= 5) linePenalty += 3 + (runLength - 5);
      runColor = line[index];
      runLength = 1;
    }

    if (runLength >= 5) linePenalty += 3 + (runLength - 5);

    for (let index = 0; index <= line.length - 7; index += 1) {
      const hasPattern =
        line[index] &&
        !line[index + 1] &&
        line[index + 2] &&
        line[index + 3] &&
        line[index + 4] &&
        !line[index + 5] &&
        line[index + 6];
      const hasQuietBefore = index >= 4 && line.slice(index - 4, index).every((module) => !module);
      const hasQuietAfter = index + 11 <= line.length && line.slice(index + 7, index + 11).every((module) => !module);

      if (hasPattern && (hasQuietBefore || hasQuietAfter)) linePenalty += 40;
    }

    return linePenalty;
  };

  for (let y = 0; y < size; y += 1) {
    penalty += scoreLine(modules[y]);
    for (let x = 0; x < size; x += 1) {
      if (modules[y][x]) darkCount += 1;
    }
  }

  for (let x = 0; x < size; x += 1) {
    penalty += scoreLine(modules.map((row) => row[x]));
  }

  for (let y = 0; y < size - 1; y += 1) {
    for (let x = 0; x < size - 1; x += 1) {
      const color = modules[y][x];
      if (modules[y][x + 1] === color && modules[y + 1][x] === color && modules[y + 1][x + 1] === color) {
        penalty += 3;
      }
    }
  }

  penalty += Math.floor(Math.abs(((darkCount * 100) / (size * size)) - 50) / 5) * 10;
  return penalty;
}

function drawQrCanvas(canvas, modules) {
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return;

  const quietZone = 4;
  const cellSize = Math.max(6, Math.floor(768 / (modules.length + (quietZone * 2))));
  const pixelSize = (modules.length + (quietZone * 2)) * cellSize;

  canvas.width = pixelSize;
  canvas.height = pixelSize;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, pixelSize, pixelSize);
  context.fillStyle = '#101010';

  modules.forEach((row, y) => {
    row.forEach((isDark, x) => {
      if (!isDark) return;
      context.fillRect((x + quietZone) * cellSize, (y + quietZone) * cellSize, cellSize, cellSize);
    });
  });
}

function drawQrPlaceholder(canvas) {
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return;

  canvas.width = 512;
  canvas.height = 512;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#d4d7dc';
  context.lineWidth = 12;
  context.strokeRect(64, 64, 384, 384);
}

function getQrFormatBits(mask) {
  const data = mask;
  let remainder = data << 10;
  const generator = 0x537;

  for (let bit = 14; bit >= 10; bit -= 1) {
    if (((remainder >>> bit) & 1) !== 0) {
      remainder ^= generator << (bit - 10);
    }
  }

  return ((data << 10) | (remainder & 0x3ff)) ^ 0x5412;
}

function getQrVersionBits(version) {
  let remainder = version << 12;
  const generator = 0x1f25;

  for (let bit = 17; bit >= 12; bit -= 1) {
    if (((remainder >>> bit) & 1) !== 0) {
      remainder ^= generator << (bit - 12);
    }
  }

  return (version << 12) | (remainder & 0xfff);
}

function getQrBit(value, bit) {
  return ((value >>> bit) & 1) !== 0;
}

function computeReedSolomonRemainder(data, degree) {
  const divisor = computeReedSolomonDivisor(degree);
  const result = Array(degree).fill(0);

  data.forEach((byte) => {
    const factor = byte ^ result.shift();
    result.push(0);

    divisor.forEach((coefficient, index) => {
      result[index] ^= gfMultiply(coefficient, factor);
    });
  });

  return result;
}

function computeReedSolomonDivisor(degree) {
  const result = Array(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;

  for (let index = 0; index < degree; index += 1) {
    for (let coefficient = 0; coefficient < degree; coefficient += 1) {
      result[coefficient] = gfMultiply(result[coefficient], root);
      if (coefficient + 1 < degree) result[coefficient] ^= result[coefficient + 1];
    }

    root = gfMultiply(root, 0x02);
  }

  return result;
}

function gfMultiply(left, right) {
  if (left === 0 || right === 0) return 0;

  return QR_GF_EXP[QR_GF_LOG[left] + QR_GF_LOG[right]];
}

const QR_GF_EXP = Array(512);
const QR_GF_LOG = Array(256);
let qrGfValue = 1;

for (let exponent = 0; exponent < 255; exponent += 1) {
  QR_GF_EXP[exponent] = qrGfValue;
  QR_GF_LOG[qrGfValue] = exponent;
  qrGfValue <<= 1;
  if ((qrGfValue & 0x100) !== 0) qrGfValue ^= 0x11d;
}

for (let exponent = 255; exponent < QR_GF_EXP.length; exponent += 1) {
  QR_GF_EXP[exponent] = QR_GF_EXP[exponent - 255];
}

function parseDateTimeLocal(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  };
}

function getTimeZoneOffsetMs(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return asUtc - date.getTime();
}

function zonedTimeToUtc(parts, timeZone) {
  const guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  const firstOffset = getTimeZoneOffsetMs(new Date(guess), timeZone);
  let utcTime = guess - firstOffset;
  const secondOffset = getTimeZoneOffsetMs(new Date(utcTime), timeZone);

  if (firstOffset !== secondOffset) {
    utcTime = guess - secondOffset;
  }

  return new Date(utcTime);
}

function formatInTimeZone(date, timeZone, overrides = {}) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    ...overrides,
  }).format(date);
}

function randomFloat(min, max, decimals = 0) {
  const value = min + Math.random() * (max - min);
  return Number(value.toFixed(decimals));
}

function randomInt(min, max) {
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
