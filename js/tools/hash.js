import { $, downloadTextFile, formatNumber, safeText, setTemporaryStatus } from './shared.js';

const textEncoder = new TextEncoder();
const HASH_LABELS = {
  md5: 'MD5',
  sha1: 'SHA-1',
  sha256: 'SHA-256',
  sha384: 'SHA-384',
  sha512: 'SHA-512',
};

const MD5_SHIFTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const MD5_K = Array.from(
  { length: 64 },
  (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0,
);

function leftRotate(value, shift) {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

function computeMd5(bytes) {
  const bitLength = BigInt(bytes.length) * 8n;
  const totalLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(totalLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  for (let index = 0; index < 8; index += 1) {
    padded[padded.length - 8 + index] = Number((bitLength >> BigInt(index * 8)) & 0xffn);
  }

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let offset = 0; offset < padded.length; offset += 64) {
    const words = new Uint32Array(16);

    for (let index = 0; index < 16; index += 1) {
      const base = offset + (index * 4);
      words[index] = padded[base]
        | (padded[base + 1] << 8)
        | (padded[base + 2] << 16)
        | (padded[base + 3] << 24);
    }

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let index = 0; index < 64; index += 1) {
      let f = 0;
      let g = 0;

      if (index < 16) {
        f = (b & c) | (~b & d);
        g = index;
      } else if (index < 32) {
        f = (d & b) | (~d & c);
        g = (5 * index + 1) % 16;
      } else if (index < 48) {
        f = b ^ c ^ d;
        g = (3 * index + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * index) % 16;
      }

      const next = (a + f + MD5_K[index] + words[g]) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + leftRotate(next, MD5_SHIFTS[index])) >>> 0;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const digest = new Uint8Array(16);
  [a0, b0, c0, d0].forEach((word, index) => {
    digest[index * 4] = word & 0xff;
    digest[index * 4 + 1] = (word >>> 8) & 0xff;
    digest[index * 4 + 2] = (word >>> 16) & 0xff;
    digest[index * 4 + 3] = (word >>> 24) & 0xff;
  });

  return digest;
}

function toHex(bytes) {
  return [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return '--';
  if (bytes < 1024) return `${formatNumber(bytes, 0)} B`;
  if (bytes < 1024 ** 2) return `${formatNumber(bytes / 1024, 1)} KB`;
  if (bytes < 1024 ** 3) return `${formatNumber(bytes / (1024 ** 2), 1)} MB`;
  return `${formatNumber(bytes / (1024 ** 3), 1)} GB`;
}

async function digestBytes(bytes, algorithm) {
  if (algorithm === 'md5') {
    return computeMd5(bytes);
  }

  const subtleAlgorithm = {
    sha1: 'SHA-1',
    sha256: 'SHA-256',
    sha384: 'SHA-384',
    sha512: 'SHA-512',
  }[algorithm];

  if (!subtleAlgorithm || !crypto.subtle) {
    throw new Error('This browser context does not expose the selected hashing algorithm.');
  }

  const digest = await crypto.subtle.digest(subtleAlgorithm, bytes);
  return new Uint8Array(digest);
}

export function initHashGenerator() {
  const sourceSelect = $('#hash-source');
  const algorithmSelect = $('#hash-algorithm');
  const textPanel = $('#hash-text-panel');
  const filePanel = $('#hash-file-panel');
  const textInput = $('#hash-input');
  const fileInput = $('#hash-file');
  const fileMeta = $('#hash-file-meta');
  const output = $('#hash-output');
  const status = $('#hash-status');
  const detail = $('#hash-detail');
  const sourceNode = $('#hash-source-label');
  const algorithmNode = $('#hash-algorithm-label');
  const sizeNode = $('#hash-size');
  const digestNode = $('#hash-digest-size');
  const copyButton = $('#hash-copy');
  const downloadButton = $('#hash-download');
  const actionStatus = $('#hash-action-status');
  let currentDigest = '';
  let activeJob = 0;

  const setActionsEnabled = (enabled) => {
    if (copyButton) copyButton.disabled = !enabled;
    if (downloadButton) downloadButton.disabled = !enabled;
  };

  const syncSourceVisibility = () => {
    const useFile = sourceSelect?.value === 'file';
    if (textPanel) textPanel.hidden = useFile;
    if (filePanel) filePanel.hidden = !useFile;
    safeText(sourceNode, useFile ? 'File' : 'Text');
  };

  const setOutput = (value) => {
    currentDigest = value;
    safeText(output, value || 'Select text or a local file to generate a checksum.');
    setActionsEnabled(Boolean(value));
  };

  const updateStats = (byteLength = '--', digestLength = '--') => {
    safeText(sizeNode, byteLength);
    safeText(digestNode, digestLength);
    safeText(algorithmNode, HASH_LABELS[algorithmSelect?.value || 'sha256'] || 'SHA-256');
  };

  const render = async () => {
    syncSourceVisibility();
    const jobId = ++activeJob;
    const source = sourceSelect?.value || 'text';
    const algorithm = algorithmSelect?.value || 'sha256';

    try {
      let bytes = null;
      let detailMessage = '';

      if (source === 'file') {
        const file = fileInput?.files?.[0];
        if (!file) {
          setOutput('');
          safeText(status, 'Ready');
          safeText(detail, 'Choose a local file to hash it entirely in the browser.');
          safeText(fileMeta, 'No file selected yet.');
          updateStats();
          return;
        }

        safeText(fileMeta, `${file.name} · ${formatFileSize(file.size)}`);
        bytes = new Uint8Array(await file.arrayBuffer());
        detailMessage = `Computed locally from ${file.name}.`;
      } else {
        const text = textInput?.value || '';
        if (!text) {
          setOutput('');
          safeText(status, 'Ready');
          safeText(detail, 'Enter text to calculate a checksum without sending it anywhere.');
          safeText(fileMeta, 'No file selected yet.');
          updateStats();
          return;
        }

        bytes = textEncoder.encode(text);
        detailMessage = 'Text is encoded as UTF-8 before hashing.';
        safeText(fileMeta, 'No file selected yet.');
      }

      safeText(status, 'Hashing...');
      const digest = await digestBytes(bytes, algorithm);
      if (jobId !== activeJob) return;

      setOutput(toHex(digest));
      safeText(status, 'Checksum ready');
      safeText(detail, detailMessage);
      updateStats(formatFileSize(bytes.byteLength), `${formatNumber(digest.byteLength * 8, 0)} bits`);
    } catch (error) {
      if (jobId !== activeJob) return;
      setOutput('');
      safeText(status, 'Unable to hash');
      safeText(detail, error instanceof Error ? error.message : 'The checksum could not be generated.');
      updateStats('--', '--');
    }
  };

  [sourceSelect, algorithmSelect, textInput, fileInput].forEach((element) => {
    element?.addEventListener('input', render);
    element?.addEventListener('change', render);
  });

  copyButton?.addEventListener('click', async () => {
    if (!currentDigest) return;

    try {
      await navigator.clipboard.writeText(currentDigest);
      setTemporaryStatus(actionStatus, 'Copied');
    } catch {
      setTemporaryStatus(actionStatus, 'Clipboard unavailable');
    }
  });

  downloadButton?.addEventListener('click', () => {
    if (!currentDigest) return;
    const algorithm = algorithmSelect?.value || 'sha256';
    downloadTextFile(`checksum-${algorithm}.txt`, currentDigest, 'text/plain;charset=utf-8');
    setTemporaryStatus(actionStatus, 'Downloaded');
  });

  setActionsEnabled(false);
  syncSourceVisibility();
  setOutput('');
  render();
}
