# Portfolio — Cyril

Pure client-side portfolio built with **SolidJS**, **Vite**, and **Tailwind CSS v4**. Zero SSR, zero hydration, zero islands. Designed for static CDN hosting (Cloudflare Pages / GitHub Pages / S3+CloudFront).

Live at [mdsolarflare.github.io](https://mdsolarflare.github.io) — deployed automatically by GitHub Actions on every push to `main`.

## Requirements

- **Node.js** ≥ 20 (CI runs 24)
- **pnpm** ≥ 9 (CI runs 11; `npm i -g pnpm`)

## Quick Start

```bash
# Install dependencies
pnpm install

# Dev server (port 3000)
pnpm dev

# Production build
pnpm build

# Preview production build locally
pnpm preview
```

## Architecture

### Content Pipeline
Site content lives in a single hand-edited JSON file, `public/content.json`, committed to the repo — no markdown sources, no build-time transform. Edit the JSON and push.

The client fetches it on mount with a version-stamped URL (`/content.json?v=...`). The stamp is generated at build time in `vite.config.ts`, so every deploy busts CDN/browser caches while staying stable within one deployment. **Zero markdown parsing in the browser.**

### Hardware-Aware Rendering
`src/hooks/usePerformanceTier.ts` detects device capability using only standard APIs:

| Tier | Detection | Behavior |
|---|---|---|
| `high` | Default (good GPU, fast network) | Web Animations API, staggered transitions |
| `medium` | 3G network or frame-budget miss | CSS-only transforms, shorter duration |
| `low` | `prefers-reduced-motion`, software renderer, save-data | Static layout, zero JS animation loops |

### Design System
- **Font**: Inter (single variable font via Google Fonts)
- **Spacing**: 8px scale (`--space-*` tokens)
- **Theming**: CSS custom properties, manual light/dark toggle (`useTheme`) persisted to `localStorage` with `prefers-color-scheme` fallback; inline script in `index.html` prevents flash of wrong theme
- **Accessibility**: Visible `:focus-visible` states, semantic HTML, ARIA labels

### Bundle Targets
| Metric | Actual (gzipped) | Target |
|---|---|---|
| Initial JS | ~8 KB | < 30 KB ✅ |
| CSS | ~4 KB | < 15 KB ✅ |

## Project Structure

```
├── .github/
│   └── workflows/
│       └── static.yml        # GitHub Pages deploy on push to main
├── public/
│   ├── content.json          # Site content (hand-edited, committed)
│   ├── favicon.svg
│   └── images/               # Project screenshots
├── src/
│   ├── components/       # UI components
│   │   └── ProjectCard.tsx
│   │   └── RotatingText.tsx
│   ├── hooks/
│   │   └── usePerformanceTier.ts
│   │   └── useTheme.ts
│   ├── types/
│   │   └── content.ts
│   ├── App.tsx           # Main layout + content fetching
│   ├── index.css         # Tailwind v4 + design tokens
│   └── index.tsx         # Entry point (render → #app)
├── index.html            # Shell (no hydration, pure CSR) + theme bootstrap script
├── vite.config.ts        # Vite + Solid + Tailwind + content version stamp
└── tsconfig.json         # Strict TS + @/ alias
```

## Deployment

### GitHub Pages (current setup)
`.github/workflows/static.yml` deploys to GitHub Pages automatically on every push to `main` (also runnable manually from the Actions tab):

1. `pnpm install --frozen-lockfile` (Node 24, pnpm 11)
2. `pnpm build`
3. Uploads `dist/` and deploys via `actions/deploy-pages`

One-time repo setup: **Settings → Pages → Source: GitHub Actions**. This is a user site (`mdsolarflare.github.io`) served at the root, so no Vite `base` config is needed.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with HMR |
| `pnpm build` | TypeScript check + Vite production build |
| `pnpm preview` | Serve production build locally |

## Quality Gates

- ✅ Lighthouse targets: Performance ≥95, Accessibility ≥90, Best Practices ≥100
- ✅ Zero console warnings/errors in production build
- ✅ Respects `prefers-reduced-motion` and `prefers-color-scheme` natively
- ✅ Graceful degradation on low-end devices without layout breakage
- ✅ All interactive elements have keyboard/focus states
- ✅ Initial JS bundle < 30KB gzipped, CSS < 15KB
- ✅ No deprecated or non-standard browser APIs used for hardware detection
