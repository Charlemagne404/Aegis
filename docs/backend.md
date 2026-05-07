# Aegis Backend

This repo now includes a small Node backend that:

- serves the existing site and static assets
- exposes `GET /api/health` and `GET /api/site`
- generates `GET /speed-test-config.json` dynamically
- implements the speed test endpoints the frontend already expects

## Run locally

```sh
cp .env.example .env
npm run dev
```

The default server address is `http://localhost:3000`.

## Routes

- `GET /` serves `index.html`
- `GET /api/health` returns uptime and backend readiness
- `GET /api/site` returns public site metadata and route links
- `GET /api/speedtest/config` returns the live speed test config
- `GET /speed-test-config.json` exposes the same config for the frontend
- `GET /speedtest/ping` returns a fast `204`
- `GET /speedtest/download?bytes=5000000` streams uncached bytes
- `POST /speedtest/upload` accepts and discards upload samples

## Configuration

The backend reads `.env` if present and then overlays real environment variables.

- `AEGIS_PUBLIC_BASE_URL` forces absolute API URLs behind a proxy or on production
- `AEGIS_ALLOWED_ORIGINS` controls CORS for API and speed-test routes
- `AEGIS_MAX_DOWNLOAD_BYTES` limits download test size
- `AEGIS_MAX_UPLOAD_BYTES` limits upload test size
- `AEGIS_*_TIMEOUT_MS`, `AEGIS_*_SIZES`, and `AEGIS_LATENCY_ATTEMPTS` shape the generated frontend config

## Notes

- The checked-in `speed-test-config.json` still works as a static fallback, but the backend overrides it when the site is served through Node.
- Static HTML responses are served with `no-cache`; assets use a short public cache.
