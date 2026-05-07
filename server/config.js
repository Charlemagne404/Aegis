import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_SPEED_TEST_DOWNLOAD_SIZES = [250000, 1000000, 5000000, 10000000];
const DEFAULT_SPEED_TEST_UPLOAD_SIZES = [250000, 1000000, 4000000];

export function loadConfig(rootDir) {
  const envFile = readEnvFile(path.join(rootDir, '.env'));
  const env = { ...envFile, ...process.env };

  return {
    appName: env.AEGIS_APP_NAME || 'Aegis',
    environment: env.NODE_ENV || 'development',
    host: env.HOST || '0.0.0.0',
    port: toPositiveInteger(env.PORT, 3000),
    publicBaseUrl: String(env.AEGIS_PUBLIC_BASE_URL || '').trim(),
    speedTestEnabled: toBoolean(env.AEGIS_ENABLE_SPEED_TEST, true),
    speedTestServerLabel: env.AEGIS_SPEED_TEST_SERVER_LABEL || 'Local speed test server',
    allowedOrigins: parseOrigins(env.AEGIS_ALLOWED_ORIGINS || '*'),
    maxDownloadBytes: toPositiveInteger(env.AEGIS_MAX_DOWNLOAD_BYTES, 25_000_000),
    maxUploadBytes: toPositiveInteger(env.AEGIS_MAX_UPLOAD_BYTES, 10_000_000),
    latencyAttempts: toPositiveInteger(env.AEGIS_LATENCY_ATTEMPTS, 5),
    latencyTimeoutMs: toPositiveInteger(env.AEGIS_LATENCY_TIMEOUT_MS, 4000),
    downloadTimeoutMs: toPositiveInteger(env.AEGIS_DOWNLOAD_TIMEOUT_MS, 20000),
    uploadTimeoutMs: toPositiveInteger(env.AEGIS_UPLOAD_TIMEOUT_MS, 20000),
    downloadSizes: parseIntegerList(env.AEGIS_DOWNLOAD_SIZES, DEFAULT_SPEED_TEST_DOWNLOAD_SIZES),
    uploadSizes: parseIntegerList(env.AEGIS_UPLOAD_SIZES, DEFAULT_SPEED_TEST_UPLOAD_SIZES),
    rootDir,
  };
}

function readEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const env = {};
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/u);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = stripQuotes(line.slice(separatorIndex + 1).trim());
    env[key] = value;
  }

  return env;
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function toBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseIntegerList(value, fallback) {
  if (!value) {
    return fallback;
  }

  const parsed = String(value)
    .split(',')
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((entry) => Number.isFinite(entry) && entry > 0);

  return parsed.length ? parsed : fallback;
}

function parseOrigins(value) {
  const entries = String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!entries.length || entries.includes('*')) {
    return ['*'];
  }

  return entries;
}
