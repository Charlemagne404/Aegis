import { SPEED_HISTORY_STORAGE_KEY } from './constants.js';
import { $, clamp, formatHistoryTimestamp, formatMetric, readLocalJson, safeText, writeLocalJson } from './shared.js';

export function initSpeedTest() {
  const startButton = $('#speed-start');
  const resetButton = $('#speed-reset');
  const reloadButton = $('#speed-reload');
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
  const gradeNode = $('#speed-grade');
  const summaryNode = $('#speed-summary');
  const historyNode = $('#speed-history');
  let controller = null;
  let config = null;
  let history = readLocalJson(SPEED_HISTORY_STORAGE_KEY, []);

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
    safeText(gradeNode, 'Waiting');
    safeText(summaryNode, 'Run a test to classify the current connection and keep a short local history.');
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

  const renderHistory = () => {
    if (!historyNode) return;
    historyNode.innerHTML = history.length
      ? history.map((entry) => buildSpeedHistoryMarkup(entry)).join('')
      : '<p class="context-empty">No speed tests yet.</p>';
  };

  const saveRun = (result) => {
    history = [result, ...history].slice(0, 5);
    writeLocalJson(SPEED_HISTORY_STORAGE_KEY, history);
    renderHistory();
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
    safeText(gradeNode, 'Testing');
    safeText(summaryNode, 'Latency, download, and upload measurements are in progress.');
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

      const summary = classifySpeedTestResult({
        ping: latency.ping,
        jitter: latency.jitter,
        downloadMbps: download.mbps,
        uploadMbps: upload.mbps,
      });
      setProgress(100);
      safeText(phaseNode, 'Test complete');
      safeText(gradeNode, summary.grade);
      safeText(summaryNode, summary.summary);
      showStatus('Latest run completed successfully. Run it again to compare conditions.', 'Complete');
      saveRun({
        id: globalThis.crypto?.randomUUID?.() || `speed-${Date.now()}`,
        createdAt: Date.now(),
        ping: latency.ping,
        jitter: latency.jitter,
        downloadMbps: download.mbps,
        uploadMbps: upload.mbps,
        grade: summary.grade,
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        safeText(phaseNode, 'Test cancelled');
        safeText(gradeNode, 'Cancelled');
        safeText(summaryNode, 'The current test was cancelled before enough data was collected.');
        showStatus('The test was cancelled before completion.', 'Cancelled');
      } else {
        safeText(phaseNode, 'Test failed');
        safeText(gradeNode, 'Error');
        safeText(summaryNode, error.message || 'The speed test could not complete.');
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
  reloadButton?.addEventListener('click', loadConfig);

  resetMetrics();
  renderHistory();
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

function classifySpeedTestResult({ ping, jitter, downloadMbps, uploadMbps }) {
  let score = 0;

  if (downloadMbps >= 200) score += 4;
  else if (downloadMbps >= 100) score += 3;
  else if (downloadMbps >= 25) score += 2;
  else if (downloadMbps >= 10) score += 1;

  if (uploadMbps >= 50) score += 3;
  else if (uploadMbps >= 20) score += 2;
  else if (uploadMbps >= 5) score += 1;

  if (ping <= 20) score += 3;
  else if (ping <= 40) score += 2;
  else if (ping <= 80) score += 1;

  if (jitter <= 5) score += 2;
  else if (jitter <= 15) score += 1;

  if (score >= 10) {
    return { grade: 'Excellent', summary: 'Strong download, solid upload, and low latency for demanding work, streaming, and calls.' };
  }
  if (score >= 7) {
    return { grade: 'Good', summary: 'Comfortable for everyday browsing, meetings, and most media or cloud workflows.' };
  }
  if (score >= 4) {
    return { grade: 'Fair', summary: 'Usable for general tasks, but large uploads, 4K streaming, or low-latency workloads may vary.' };
  }
  return { grade: 'Limited', summary: 'Basic browsing should work, but the connection may feel constrained under heavier traffic.' };
}

function buildSpeedHistoryMarkup(entry) {
  return `
    <article class="stack-card">
      <div class="stack-card-head">
        <strong>${entry.grade}</strong>
        <span>${formatHistoryTimestamp(entry.createdAt)}</span>
      </div>
      <p>Down ${formatMetric(entry.downloadMbps)} Mbps · Up ${formatMetric(entry.uploadMbps)} Mbps · Ping ${formatMetric(entry.ping)} ms · Jitter ${formatMetric(entry.jitter)} ms</p>
    </article>
  `;
}
