# Portfolio — Cyril

Pure client-side portfolio built with **SolidJS**, **Vite**, and **Tailwind CSS v4**. Zero SSR, zero hydration, zero islands. Designed for static CDN hosting (Cloudflare Pages / GitHub Pages / S3+CloudFront).

## Requirements

- **Node.js** ≥ 20 (tested on 26.x)
- **pnpm** ≥ 9 (`npm i -g pnpm`)

## Quick Start

```bash
# Install dependencies
pnpm install

# Build content from markdown → JSON
pnpm build:content

# Dev server (port 3000)
pnpm dev

# Production build
pnpm build

# Preview production build locally
pnpm preview
```

## Architecture

### Content Pipeline
Markdown files in `content/projects/*.md` are pre-compiled to structured JSON at build time:

```bash
pnpm build:content   # → public/content.json
```

The client fetches this JSON with `cache: "force-cache"` on mount. **Zero markdown parsing in the browser.**

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
- **Theming**: CSS custom properties + `prefers-color-scheme` native dark mode
- **Accessibility**: Visible `:focus-visible` states, semantic HTML, ARIA labels

### Bundle Targets
| Metric | Actual (gzipped) | Target |
|---|---|---|
| Initial JS | ~8 KB | < 30 KB ✅ |
| CSS | ~4 KB | < 15 KB ✅ |

## Project Structure

```
├── content/projects/     # Markdown source files (*.md)
├── public/               # Static assets + generated content.json
├── scripts/
│   └── build-content.ts  # MD → JSON transformer (Node runtime)
├── src/
│   ├── components/       # UI components
│   │   └── ProjectCard.tsx
│   ├── hooks/
│   │   └── usePerformanceTier.ts
│   ├── types/
│   │   └── content.ts
│   ├── App.tsx           # Main layout + content fetching
│   ├── index.css         # Tailwind v4 + design tokens
│   └── index.tsx         # Entry point (render → #app)
├── index.html            # Shell (no hydration, pure CSR)
├── vite.config.ts        # Vite + Tailwind + path aliases
└── tsconfig.json         # Strict TS + @/ alias
```

## Deployment

### Cloudflare Pages
```bash
pnpm build:content && pnpm build
# Upload dist/ folder or connect Git repo with:
#   Build command: pnpm build:content && pnpm build
#   Output dir: dist
```

### GitHub Pages
Add to `package.json`:
```json
{
  "scripts": {
    "predeploy": "pnpm build:content && pnpm build",
    "deploy": "gh-pages -d dist"
  }
}
```

Set `base` in `vite.config.ts` to your repo name:
```ts
export default defineConfig({
  base: "/repo-name/",
  // ...
});
```

### S3 + CloudFront
```bash
pnpm build:content && pnpm build
aws s3 sync dist/ s3://your-bucket --delete
# Invalidate CloudFront distribution
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server with HMR |
| `pnpm build:content` | Convert markdown → JSON |
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
