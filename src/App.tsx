import { createMemo, createSignal, For, onMount } from "solid-js";
import "./index.css";
import { AppTile } from "@/components/AppTile";
import type { App, ContentData } from "@/types/content";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import { useTheme } from "@/hooks/useTheme";

export default function App() {
  const [getTier] = usePerformanceTier();
  const [theme, toggleTheme] = useTheme();
  const [content, setContent] = createSignal<ContentData | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [query, setQuery] = createSignal("");
  const searchInput: { current: HTMLInputElement | null } = { current: null };

  onMount(async () => {
    try {
      // Version-stamped URL busts cache per deploy but stays stable within one
      const url = `/content.json?v=${__CONTENT_VERSION}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load content: ${res.status}`);
      setContent(await res.json());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unknown error loading content",
      );
      console.error("Content fetch failed:", e);
    }
  });

  // "/" focuses search from anywhere on the page
  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        e.key === "/" &&
        !(t instanceof HTMLInputElement) &&
        !(t instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchInput.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const apps = () => content()?.apps ?? [];

  // Categories in first-seen order — content.json controls the shelf order
  const categories = createMemo(() => {
    const seen: string[] = [];
    for (const app of apps()) {
      if (!seen.includes(app.category)) seen.push(app.category);
    }
    return seen;
  });

  const matchesQuery = (app: App) => {
    const q = query().trim().toLowerCase();
    if (!q) return true;
    return [app.name, app.tagline, app.category, ...(app.tags ?? [])].some(
      (field) => field.toLowerCase().includes(q),
    );
  };

  const shelves = createMemo(() =>
    categories()
      .map((category) => ({
        category,
        apps: apps().filter(
          (app) => app.category === category && matchesQuery(app),
        ),
      }))
      .filter((shelf) => shelf.apps.length > 0),
  );

  const visibleCount = () => shelves().reduce((n, s) => n + s.apps.length, 0);

  return (
    <div class="min-h-screen bg-background text-foreground">
      {/* ── Header ─────────────────────────────────────── */}
      <header class="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur-sm">
        <div class="mx-auto max-w-5xl px-6 pt-4">
          <nav class="flex items-center justify-between" aria-label="Main">
            <a
              href="/"
              class="text-lg font-bold tracking-tight"
              aria-label="Home"
            >
              heyy development
              <span class="text-accent"> . </span>
              carnietech industries
            </a>

            <div class="flex items-center gap-1.5 sm:gap-3">
              {/* GitHub */}
              <a
                href="https://github.com/mdsolarflare"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-full p-2 text-muted transition-colors hover:bg-muted/10 hover:text-foreground focus-visible:outline-none"
                aria-label="GitHub"
              >
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/lets-meet-up-at-the-world-tree-and-do-quarterly-planning"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded-full p-2 text-muted transition-colors hover:bg-muted/10 hover:text-foreground focus-visible:outline-none"
                aria-label="LinkedIn"
              >
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542c0 .955.792 1.729 1.771 1.729h20.451C23.2 24 24 23.226 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              {/* Theme Toggle */}
              <button
                type="button"
                onclick={toggleTheme}
                class="rounded-full p-2 text-muted transition-colors hover:bg-muted/10 hover:text-foreground focus-visible:outline-none"
                aria-label={`Switch to ${
                  theme() === "light" ? "dark" : "light"
                } mode`}
              >
                {/* Sun icon — visible in dark mode */}
                <svg
                  class={theme() === "dark" ? "block h-5 w-5" : "hidden"}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width={1.5}
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z"
                  />
                </svg>
                {/* Moon icon — visible in light mode */}
                <svg
                  class={theme() === "light" ? "block h-5 w-5" : "hidden"}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width={1.5}
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                  />
                </svg>
              </button>
            </div>
          </nav>

          {/* Search */}
          <div class="relative mt-4 pb-4">
            <svg
              class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width={2}
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z"
              />
            </svg>
            <input
              type="search"
              ref={(el) => (searchInput.current = el)}
              value={query()}
              onInput={(e) => setQuery(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQuery("");
              }}
              placeholder="Search apps…"
              aria-label="Search apps"
              class="w-full rounded-full border border-border bg-surface py-2.5 pl-10 pr-12 text-sm text-foreground placeholder:text-muted focus:border-accent/60 focus:outline-none"
            />
            <kbd class="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted">
              /
            </kbd>
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────── */}
      <main class="mx-auto max-w-5xl px-6">
        {/* Error state */}
        {error() && (
          <div
            role="alert"
            class="rounded-lg border border-border p-4 text-sm text-muted"
          >
            Failed to load apps: {error()}
          </div>
        )}

        {/* Loading skeleton */}
        {!content() && !error() && (
          <div class="space-y-10 py-8" aria-label="Loading">
            {[0, 1].map(() => (
              <div>
                <div class="mb-4 h-4 w-24 animate-pulse rounded bg-muted/10" />
                <div class="-mx-6 flex gap-4 overflow-hidden px-6">
                  {[0, 1, 2].map(() => (
                    <div class="h-56 w-full shrink-0 animate-pulse rounded-xl border border-border bg-surface sm:w-72" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* App shelves */}
        {content() && !error() && (
          <>
            <For each={shelves()}>
              {(shelf) => (
                <section class="py-6" aria-label={shelf.category}>
                  <div class="mb-4 flex items-baseline justify-between">
                    <h2 class="text-sm font-semibold uppercase tracking-widest text-muted">
                      {shelf.category}
                    </h2>
                    <span class="text-xs tabular-nums text-muted">
                      {shelf.apps.length}
                    </span>
                  </div>
                  <div class="-mx-6 flex snap-x gap-4 overflow-x-auto px-6 pb-2">
                    <For each={shelf.apps}>
                      {(app, index) => (
                        <AppTile app={app} tier={getTier()} index={index()} />
                      )}
                    </For>
                  </div>
                </section>
              )}
            </For>

            {shelves().length === 0 && (
              <div class="py-16 text-center" role="status">
                <p class="text-muted">
                  {query() ? `No apps match “${query()}”.` : "No apps yet."}
                </p>
                {query() && (
                  <button
                    type="button"
                    onclick={() => setQuery("")}
                    class="mt-3 text-sm font-medium text-accent underline-offset-4 hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            {/* Result count while searching */}
            {query() && shelves().length > 0 && (
              <p class="pb-4 text-center text-xs text-muted" role="status">
                {visibleCount()} {visibleCount() === 1 ? "app" : "apps"} found
              </p>
            )}
          </>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer class="mt-16 border-t border-border py-8">
        <div class="mx-auto flex max-w-5xl items-center justify-between px-6">
          <p class="text-sm text-muted">I love making.</p>
          <a
            href="/content.json"
            class="text-sm text-muted transition-colors hover:text-foreground"
          >
            Content API
          </a>
        </div>
      </footer>
    </div>
  );
}
