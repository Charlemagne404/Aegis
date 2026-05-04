# Aegis

Aegis is a static utility toolkit website built in the Continental project style.

Included tools:

- Password generator with strength checking and clipboard copy
- Text case converter
- Character, word, and sentence counter
- QR code generator with PNG download
- Speed test mockup, timezone converter, timer, random number generator, and unit converter

## Structure

- `index.html` contains the single page shell and tool panels.
- `styles.css` contains the responsive Continental-inspired UI system.
- `js/app.js` handles navigation, theme, search, filtering, and tool activation.
- `js/tools.js` contains the tool registry and each tool module.

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
