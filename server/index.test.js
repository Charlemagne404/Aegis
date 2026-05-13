import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

import { createServer } from './index.js';

async function startServer(overrides = {}) {
  const server = createServer({
    host: '127.0.0.1',
    port: 0,
    publicBaseUrl: '',
    ...overrides,
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    async close() {
      server.close();
      await once(server, 'close');
    },
  };
}

test('health endpoint exposes backend status', async () => {
  const app = await startServer();

  try {
    const response = await fetch(`${app.baseUrl}/api/health`);
    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.equal(payload.status, 'ok');
    assert.equal(payload.speedTest.enabled, true);
    assert.match(payload.timestamp, /^\d{4}-\d{2}-\d{2}T/u);
  } finally {
    await app.close();
  }
});

test('dynamic speed test config points to local backend routes', async () => {
  const app = await startServer({
    speedTestServerLabel: 'Stockholm Edge',
  });

  try {
    const response = await fetch(`${app.baseUrl}/speed-test-config.json`);
    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.equal(payload.enabled, true);
    assert.equal(payload.serverLabel, 'Stockholm Edge');
    assert.equal(payload.latencyUrl, `${app.baseUrl}/speedtest/ping`);
    assert.equal(payload.downloadUrl, `${app.baseUrl}/speedtest/download?bytes={bytes}`);
    assert.equal(payload.uploadUrl, `${app.baseUrl}/speedtest/upload`);
  } finally {
    await app.close();
  }
});

test('download endpoint returns requested byte count', async () => {
  const app = await startServer();

  try {
    const response = await fetch(`${app.baseUrl}/speedtest/download?bytes=1024`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/octet-stream');

    const body = new Uint8Array(await response.arrayBuffer());
    assert.equal(body.byteLength, 1024);
  } finally {
    await app.close();
  }
});

test('upload endpoint accepts and discards payloads', async () => {
  const app = await startServer();

  try {
    const response = await fetch(`${app.baseUrl}/speedtest/upload`, {
      method: 'POST',
      body: Buffer.alloc(512, 'B'),
    });

    assert.equal(response.status, 204);
    assert.equal(response.headers.get('x-aegis-received-bytes'), '512');
  } finally {
    await app.close();
  }
});

test('site root serves the existing frontend', async () => {
  const app = await startServer();

  try {
    const response = await fetch(`${app.baseUrl}/`);
    assert.equal(response.status, 200);

    const html = await response.text();
    assert.match(html, /Utility tools, finally in one clean workspace\./u);
  } finally {
    await app.close();
  }
});

test('frontend assets are served with no-cache headers', async () => {
  const app = await startServer();

  try {
    const [cssResponse, appResponse, dataResponse] = await Promise.all([
      fetch(`${app.baseUrl}/styles.css`, { method: 'HEAD' }),
      fetch(`${app.baseUrl}/js/app.js`, { method: 'HEAD' }),
      fetch(`${app.baseUrl}/data.json`, { method: 'HEAD' }),
    ]);

    assert.equal(cssResponse.status, 200);
    assert.equal(appResponse.status, 200);
    assert.equal(dataResponse.status, 200);
    assert.equal(cssResponse.headers.get('cache-control'), 'no-cache');
    assert.equal(appResponse.headers.get('cache-control'), 'no-cache');
    assert.equal(dataResponse.headers.get('cache-control'), 'no-cache');
  } finally {
    await app.close();
  }
});
