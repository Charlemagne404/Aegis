# Aegis

Aegis is a static utility toolkit website built in the Continental project style.

Included tools:

- Password generator with strength checking and clipboard copy
- Hash generator for text and local files with MD5 and SHA output
- Text case converter
- Character, word, and sentence counter
- JSON formatter and validator with minify/export controls
- Base64 and URL encoder-decoder
- QR code generator with PNG download
- Connection speed test shell, timezone converter, date/timestamp tools, timer, random number generator, UUID generator, and unit converter
- Tool search, favorites, recent tools, shareable stateful links, and saved presets/history for repeatable tools
- Timer alerts with browser notifications, sound, and vibration

## Structure

- `index.html` contains the single page shell and tool panels.
- `styles.css` contains the responsive Continental-inspired UI system.
- `js/app.js` handles navigation, theme, search, filtering, and tool activation.
- `js/tools.js` contains the tool registry and each tool module.
- `speed-test-config.json` controls the live speed test endpoints and keeps the UI disabled until the feature is configured.

## Speed test setup

The connection speed test frontend is ready, but it still needs host-side endpoints before it can run live measurements:

- `GET /speedtest/ping` for low-latency round trips
- `GET /speedtest/download?bytes=...` to return uncached binary payloads
- `POST /speedtest/upload` to accept and discard uploaded sample data

After those endpoints exist, update `speed-test-config.json` with your real URLs and set `enabled` to `true`.

Run locally with any static server, for example:

```sh
python3 -m http.server 5173
```

## Web essentials included

This project now includes:

- `robots.txt` and `sitemap.xml`
- `manifest.json`, `favicon.svg`, `favicon.png`, and `apple-touch-icon.png`
- `404.html`
- `privacy-policy.html` and `terms-of-service.html`
- `data.json` for structured site metadata
- `.htaccess` for Apache error handling and security headers

Deployment-sensitive files currently assume the GitHub Pages project URL `https://charlemagne404.github.io/Aegis/`. If you deploy elsewhere, update:

- `index.html`
- `privacy-policy.html`
- `terms-of-service.html`
- `robots.txt`
- `sitemap.xml`
- `data.json`
