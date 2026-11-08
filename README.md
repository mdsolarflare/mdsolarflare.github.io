# heyy.x.carnietech — App Launcher

Pure client-side app launcher built with **SolidJS**, **Vite**, and **Tailwind CSS v4**. Zero SSR, zero hydration, zero islands. Designed for static CDN hosting (Cloudflare Pages / GitHub Pages / S3+CloudFront).

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

Each app entry has: `id`, `name`, `tagline`, `category`, `status` (`live` / `wip` / `retired`), `size` (`featured` / `standard` / `small`), `icon`, `accent` (hex, tints the icon plate), optional `tags`, and URLs. Live apps link their `launchUrl`; WIP apps link their `repoUrl`; retired tiles render inert and dimmed. Shelf order follows first-seen `category` order in the JSON.

### WebGPU Debugger & Hardware Telemetry
`src/hooks/usePerformanceTier.ts` and `src/components/WebGpuDebugger.tsx` probe client GPU capabilities using standard browser APIs (`navigator.gpu`, `WebGL2RenderingContext` + `WEBGL_debug_renderer_info`, `requestAnimationFrame` pacing, and `crossOriginIsolated`) to inform users which apps or games may struggle when hardware acceleration is unavailable:

| Tier | Detection | Diagnostic Impact |
|---|---|---|
| `high` | Hardware GPU verified across WebGL 2.0 & WebGPU + 60 FPS frame budget | All apps report nominal hardware acceleration |
| `medium` | Hardware WebGL 2.0 active, but WebGPU unavailable, 3G network, or >30% frame-budget misses | Flags WebGPU-only experiments or frame pacing warnings |
| `low` | Software rasterizer (`SwiftShader` / `LLVMpipe` / `Basic Render Driver`), no GPU contexts, or save-data | Displays warning chips on GPU-dependent app tiles linking to `#webgpu-debugger` remediation steps |

### Design System
- **Fonts**: Inter for body (Google Fonts, weights 400–700); JetBrains Mono for terminal-flavored UI (shelf headers, status chips, tags, search, WebGPU Debugger)
- **Palette**: green-forward dark theme (phosphor-on-forest) and warm off-white light theme, orange accent — all CSS custom properties in `src/index.css`
- **Neon Noir layer (dark theme only)**: blueprint grid + phosphor glow backdrop, per-app accent tile glow on hover, scanline sweep, HUD corner brackets on featured tiles and the WebGPU Debugger panel, ghost wordmark in the empty canvas. The light theme intentionally stays clean.
- **Motion**: shelf headers decode (scramble) into view — IntersectionObserver-triggered with a fail-safe settle; LIVE dots pulse and prompt carets blink; all decorative animation is killed for `prefers-reduced-motion`
- **Theming**: `[data-theme]` attribute + manual light/dark toggle (`useTheme`) persisted to `localStorage` with `prefers-color-scheme` fallback; inline script in `index.html` prevents flash of wrong theme
- **Search**: `/` focuses the filter from anywhere; `Esc` clears
- **Accessibility**: Visible `:focus-visible` states, semantic HTML, ARIA labels

### Bundle Targets
| Metric | Actual (gzipped) | Target |
|---|---|---|
| Initial JS | ~12 KB | < 30 KB ✅ |
| CSS | ~6 KB | < 15 KB ✅ |

## Project Structure

```
├── .github/
│   └── workflows/
│       └── static.yml            # GitHub Pages deploy on push to main
├── public/
│   ├── content.json              # Site content (hand-edited, committed)
│   ├── icons/                    # Favicon + per-app SVG icons
│   └── images/                   # Screenshots / art
├── src/
│   ├── components/
│   │   ├── AppTile.tsx           # Launcher tile (bento width, status + GPU warning chips)
│   │   ├── ScrambleText.tsx      # Decode-in-view shelf headers
│   │   └── WebGpuDebugger.tsx    # Bottom cyberpunk GPU & compatibility telemetry panel
│   ├── hooks/
│   │   ├── usePerformanceTier.ts # WebGL2, WebGPU, frame budget & per-app compatibility probe
│   │   └── useTheme.ts
│   ├── types/
│   │   └── content.ts
│   ├── globals.d.ts              # __CONTENT_VERSION define
│   ├── App.tsx                   # Main layout + content fetching + search + WebGPU Debugger
│   ├── index.css                 # Tailwind v4 + design tokens
│   └── index.tsx                 # Entry point (render → #app)
├── index.html                    # Shell (no hydration, pure CSR) + theme bootstrap script
├── vite.config.ts                # Vite + Solid + Tailwind + content version stamp
└── tsconfig.json                 # Strict TS + @/ alias
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
