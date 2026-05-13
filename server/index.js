import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadConfig } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const STATIC_ROOT = ROOT_DIR;
const RANDOM_CHUNK = Buffer.alloc(64 * 1024, 'A');
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

export function createServer(overrides = {}) {
  const config = { ...loadConfig(ROOT_DIR), ...overrides };
  const siteMetadata = loadSiteMetadata(path.join(ROOT_DIR, 'data.json'));
  const startedAt = Date.now();

  const server = createHttpServer(async (req, res) => {
    const requestStartedAt = performance.now();
    const finishLog = () => {
      logRequest(req, res, requestStartedAt);
    };

    res.on('finish', finishLog);
    res.on('close', finishLog);

    try {
      await handleRequest(req, res, { config, siteMetadata, startedAt });
    } catch (error) {
      if (!res.headersSent) {
        sendJson(res, 500, {
          error: 'internal_server_error',
          message: error instanceof Error ? error.message : 'Unexpected server error.',
        });
      } else {
        res.destroy(error);
      }
    }
  });

  return server;
}

async function handleRequest(req, res, context) {
  const url = new URL(req.url || '/', getRequestBaseUrl(req, context.config));
  const pathname = url.pathname;

  applySecurityHeaders(res);

  if (pathname.startsWith('/api/') || pathname.startsWith('/speedtest/') || pathname === '/speed-test-config.json') {
    applyCorsHeaders(req, res, context.config);
  }

  if (req.method === 'OPTIONS' && pathname === '/speedtest/upload') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, buildHealthPayload(context));
    return;
  }

  if (req.method === 'GET' && pathname === '/api/site') {
    sendJson(res, 200, buildSitePayload(req, context));
    return;
  }

  if (req.method === 'GET' && pathname === '/api/speedtest/config') {
    sendJson(res, 200, buildSpeedTestConfig(req, context.config));
    return;
  }

  if (req.method === 'GET' && pathname === '/speed-test-config.json') {
    sendJson(res, 200, buildSpeedTestConfig(req, context.config));
    return;
  }

  if (req.method === 'GET' && pathname === '/speedtest/ping') {
    sendNoContent(res);
    return;
  }

  if (req.method === 'GET' && pathname === '/speedtest/download') {
    await handleSpeedTestDownload(url, res, context.config);
    return;
  }

  if (req.method === 'POST' && pathname === '/speedtest/upload') {
    await handleSpeedTestUpload(req, res, context.config);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendJson(res, 405, {
      error: 'method_not_allowed',
      message: `The ${req.method} method is not supported for ${pathname}.`,
    }, {
      Allow: allowedMethodsForPath(pathname),
    });
    return;
  }

  await serveStaticAsset(req, res, pathname);
}

async function handleSpeedTestDownload(url, res, config) {
  const bytes = Number.parseInt(url.searchParams.get('bytes') || '', 10);
  if (!Number.isFinite(bytes) || bytes <= 0) {
    sendJson(res, 400, {
      error: 'invalid_bytes',
      message: 'Provide a positive integer `bytes` query parameter.',
    });
    return;
  }

  if (bytes > config.maxDownloadBytes) {
    sendJson(res, 413, {
      error: 'download_limit_exceeded',
      message: `Requested download exceeds the ${config.maxDownloadBytes}-byte limit.`,
    });
    return;
  }

  res.writeHead(200, {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Content-Encoding': 'identity',
    'Content-Length': String(bytes),
    'Content-Type': 'application/octet-stream',
  });

  let remainingBytes = bytes;
  while (remainingBytes > 0) {
    const chunk = remainingBytes >= RANDOM_CHUNK.length
      ? RANDOM_CHUNK
      : RANDOM_CHUNK.subarray(0, remainingBytes);
    remainingBytes -= chunk.length;

    if (!res.write(chunk)) {
      await once(res, 'drain');
    }
  }

  res.end();
}

async function handleSpeedTestUpload(req, res, config) {
  let receivedBytes = 0;

  for await (const chunk of req) {
    receivedBytes += chunk.length;
    if (receivedBytes > config.maxUploadBytes) {
      sendJson(res, 413, {
        error: 'upload_limit_exceeded',
        message: `Uploaded body exceeds the ${config.maxUploadBytes}-byte limit.`,
      });
      return;
    }
  }

  res.writeHead(204, {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Aegis-Received-Bytes': String(receivedBytes),
  });
  res.end();
}

async function serveStaticAsset(req, res, pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const filePath = safeResolvePath(STATIC_ROOT, requestedPath);

  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    await serveNotFound(req, res);
    return;
  }

  streamFile(res, filePath, pathname === '/');
}

async function serveNotFound(req, res) {
  const notFoundPath = path.join(STATIC_ROOT, '404.html');
  if (existsSync(notFoundPath)) {
    streamFile(res, notFoundPath, true, 404);
    return;
  }

  sendJson(res, 404, {
    error: 'not_found',
    message: `${req.url || '/'} was not found.`,
  });
}

function streamFile(res, filePath, isHtml = false, statusCode = 200) {
  const extension = path.extname(filePath).toLowerCase();
  const stat = statSync(filePath);
  const headers = {
    'Content-Length': String(stat.size),
    'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
  };

  if (shouldDisableCache(extension, isHtml)) {
    headers['Cache-Control'] = 'no-cache';
  } else {
    headers['Cache-Control'] = 'public, max-age=3600';
  }

  res.writeHead(statusCode, headers);
  createReadStream(filePath).pipe(res);
}

function shouldDisableCache(extension, isHtml) {
  if (isHtml || extension === '.html') {
    return true;
  }

  return ['.css', '.js', '.json', '.xml', '.webmanifest'].includes(extension);
}

function buildHealthPayload({ config, siteMetadata, startedAt }) {
  return {
    status: 'ok',
    app: config.appName,
    environment: config.environment,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    speedTest: {
      enabled: config.speedTestEnabled,
      maxDownloadBytes: config.maxDownloadBytes,
      maxUploadBytes: config.maxUploadBytes,
    },
    site: {
      name: extractSiteName(siteMetadata),
      featureCount: siteMetadata?.['@graph']?.find((entry) => entry['@type'] === 'SoftwareApplication')?.featureList?.length || 0,
    },
    timestamp: new Date().toISOString(),
  };
}

function buildSitePayload(req, { config, siteMetadata }) {
  const baseUrl = getRequestBaseUrl(req, config);
  const app = siteMetadata?.['@graph']?.find((entry) => entry['@type'] === 'SoftwareApplication') || {};
  const site = siteMetadata?.['@graph']?.find((entry) => entry['@type'] === 'WebSite') || {};

  return {
    name: site.name || config.appName,
    description: site.description || app.description || '',
    baseUrl,
    featureList: Array.isArray(app.featureList) ? app.featureList : [],
    routes: {
      health: `${baseUrl}/api/health`,
      site: `${baseUrl}/api/site`,
      speedTestConfig: `${baseUrl}/speed-test-config.json`,
      speedTestPing: `${baseUrl}/speedtest/ping`,
      speedTestDownload: `${baseUrl}/speedtest/download?bytes={bytes}`,
      speedTestUpload: `${baseUrl}/speedtest/upload`,
    },
    legal: {
      privacyPolicy: `${baseUrl}/privacy-policy.html`,
      termsOfService: `${baseUrl}/terms-of-service.html`,
    },
  };
}

function buildSpeedTestConfig(req, config) {
  const baseUrl = getRequestBaseUrl(req, config);

  return {
    enabled: config.speedTestEnabled,
    serverLabel: config.speedTestServerLabel,
    latencyUrl: `${baseUrl}/speedtest/ping`,
    downloadUrl: `${baseUrl}/speedtest/download?bytes={bytes}`,
    uploadUrl: `${baseUrl}/speedtest/upload`,
    latencyAttempts: config.latencyAttempts,
    downloadSizes: config.downloadSizes,
    uploadSizes: config.uploadSizes,
    latencyTimeoutMs: config.latencyTimeoutMs,
    downloadTimeoutMs: config.downloadTimeoutMs,
    uploadTimeoutMs: config.uploadTimeoutMs,
  };
}

function allowedMethodsForPath(pathname) {
  if (pathname === '/speedtest/upload') return 'OPTIONS, POST';
  if (pathname === '/speedtest/ping' || pathname === '/speedtest/download' || pathname === '/speed-test-config.json') return 'GET';
  if (pathname.startsWith('/api/')) return 'GET';
  return 'GET, HEAD';
}

function applySecurityHeaders(res) {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function applyCorsHeaders(req, res, config) {
  const requestOrigin = req.headers.origin;
  const allowedOrigins = config.allowedOrigins;

  if (allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload, null, 2));
}

function sendNoContent(res) {
  res.writeHead(204, {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  });
  res.end();
}

function loadSiteMetadata(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function extractSiteName(siteMetadata) {
  const website = siteMetadata?.['@graph']?.find((entry) => entry['@type'] === 'WebSite');
  return website?.name || 'Aegis';
}

function safeResolvePath(rootDir, requestedPath) {
  const filePath = path.resolve(rootDir, `.${requestedPath}`);
  if (!filePath.startsWith(rootDir)) {
    return null;
  }

  return filePath;
}

function getRequestBaseUrl(req, config) {
  if (config.publicBaseUrl) {
    return config.publicBaseUrl.replace(/\/$/u, '');
  }

  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const protocol = forwardedProto || 'http';
  const host = req.headers.host || `localhost:${config.port}`;
  return `${protocol}://${host}`;
}

function logRequest(req, res, startedAt) {
  if (res.__aegisLogged) {
    return;
  }

  res.__aegisLogged = true;
  const durationMs = (performance.now() - startedAt).toFixed(1);
  console.log(`${req.method} ${req.url} ${res.statusCode} ${durationMs}ms`);
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  const config = loadConfig(ROOT_DIR);
  const server = createServer(config);

  server.listen(config.port, config.host, () => {
    console.log(`Aegis backend listening on http://${config.host}:${config.port}`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
