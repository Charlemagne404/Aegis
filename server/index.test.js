import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';

import { createServer } from './index.js';

async function startServer(overrides = {}) {
  const server = createServer({
    host: '127.0.0.1',
    port: 0,
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
    assert.match(html, /Aegis Utility Toolkit/u);
  } finally {
    await app.close();
  }
});
