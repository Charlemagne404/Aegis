# Speed Test Setup

The frontend now supports a live browser-based speed test, but it depends on host-side endpoints that you still need to provide.

## Files already prepared

- `js/tools.js` loads `speed-test-config.json`, runs latency/download/upload samples, and handles setup mode vs live mode.
- `index.html` exposes the tool UI, setup messaging, and status states.
- `speed-test-config.json` is the file you will edit with your real endpoint URLs.

## Required endpoints

### 1. Latency endpoint

- Method: `GET`
- Example: `/speedtest/ping`
- Expected behavior:
  - Return quickly with a small body or `204 No Content`
  - Disable caching
  - Allow browser access from the site origin

Recommended response headers:

- `Cache-Control: no-store, no-cache, must-revalidate`
- `Access-Control-Allow-Origin: https://your-site.example`

### 2. Download endpoint

- Method: `GET`
- Example: `/speedtest/download?bytes=5000000`
- Expected behavior:
  - Return the requested number of bytes
  - Send binary content
  - Disable compression and caching
  - Allow browser access from the site origin

Recommended response headers:

- `Content-Type: application/octet-stream`
- `Cache-Control: no-store, no-cache, must-revalidate`
- `Content-Encoding: identity` or equivalent no-compression behavior
- `Access-Control-Allow-Origin: https://your-site.example`

## 3. Upload endpoint

- Method: `POST`
- Example: `/speedtest/upload`
- Expected behavior:
  - Accept the request body
  - Discard it server-side
  - Return `204 No Content` or a tiny `200` response
  - Disable caching
  - Allow browser access from the site origin

Recommended response headers:

- `Cache-Control: no-store, no-cache, must-revalidate`
- `Access-Control-Allow-Origin: https://your-site.example`
- `Access-Control-Allow-Methods: POST, OPTIONS`

If your upload endpoint is cross-origin and the browser sends a preflight request, also support:

- `OPTIONS /speedtest/upload`
- `Access-Control-Allow-Headers` for any headers your platform injects

## Config values

Edit `speed-test-config.json` and replace the placeholders:

```json
{
  "enabled": true,
  "serverLabel": "Stockholm Edge",
  "latencyUrl": "https://speed.example.com/speedtest/ping",
  "downloadUrl": "https://speed.example.com/speedtest/download?bytes={bytes}",
  "uploadUrl": "https://speed.example.com/speedtest/upload",
  "latencyAttempts": 5,
  "downloadSizes": [250000, 1000000, 5000000, 10000000],
  "uploadSizes": [250000, 1000000, 4000000],
  "latencyTimeoutMs": 4000,
  "downloadTimeoutMs": 20000,
  "uploadTimeoutMs": 20000
}
```

Notes:

- `{bytes}` in `downloadUrl` is optional. If you omit it, the frontend appends `?bytes=...` automatically.
- Keep download payloads uncached. The frontend already adds a cache-busting query param.
- Results are approximate and browser-limited. They are suitable for a consumer-facing utility tool, not formal benchmarking.

## Practical deployment options

- Cloudflare Workers
- Vercel Functions
- Netlify Functions
- A small Node/Express service behind the same domain

Using the same origin is the simplest option because it reduces CORS complexity.
