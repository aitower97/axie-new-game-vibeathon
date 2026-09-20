# Security notes

Axie Tactics Dice is a **static, client-only** web app: no backend, no database, no accounts, no wallet and no user data collected. This keeps the attack surface small. This page records what was checked and what is configured.

## What was checked (Sept 2026)

- **Dependencies:** `npm audit` reports 0 vulnerabilities (production and development).
- **Secrets:** no keys, tokens or credential files in the working tree or in git history.
- **Code:** no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `postMessage` or `document.write`. Route names from the URL hash are validated against a fixed list.
- **Storage:** only two harmless `localStorage` flags (music mute, tutorial seen). No cookies.
- **Network:** the game only requests its own static files. Fonts are self-hosted (`public/fonts`), so no third-party requests are made.
- **Build:** no source maps are published; `.env`, `.git`, `package.json` and similar paths are not served.
- **Third-party code:** the vendored 3D mixer (`vendor/`) has no install scripts.

## Headers (`vercel.json`)

`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy` are enforced. A `Content-Security-Policy` is shipped in **report-only** mode first, because the game relies on WebGL, `blob:` and `data:` resources; it can be promoted to an enforced policy once the browser console shows no violations during a full match.

`X-Frame-Options` / `frame-ancestors` are intentionally not set, so the game can still be embedded by the Vibeathon gallery. There is nothing to hijack (no login or actions), so clickjacking impact is negligible.

## Recommended repository settings (GitHub / Vercel)

- Protect `main` (require pull requests, block force pushes) so the deployed build always matches a reviewed commit.
- Give collaborators the minimum permission they need.
- Enable two-factor authentication on GitHub and Vercel.
- Never commit `.env` files (they are git-ignored).
