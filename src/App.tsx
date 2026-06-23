import { createSignal, For, onMount } from "solid-js";
import "./index.css";
import { ProjectCard } from "@/components/ProjectCard";
import type { ContentData } from "@/types/content";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";

export default function App() {
  const [getTier] = usePerformanceTier();
  const [content, setContent] = createSignal<ContentData | null>(null);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      // Pre-compiled JSON — zero markdown parsing in the browser
      const res = await fetch("/content.json", { cache: "force-cache" });
      if (!res.ok) throw new Error(`Failed to load content: ${res.status}`);
      setContent(await res.json());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unknown error loading content",
      );
      console.error("Content fetch failed:", e);
    }
  });

  return (
    <div
      class="min-h-screen"
      style={{
        background: "var(--color-background)",
        color: "var(--color-foreground)",
      }}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <header
        class="sticky top-0 z-10 backdrop-blur-sm border-b"
        style={{
          background:
            "color-mix(in srgb, var(--color-background) 85%, transparent)",
          "border-color": "var(--color-border)",
        }}
      >
        <nav class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a
            href="/"
            class="text-lg font-bold tracking-tight"
            aria-label="Home"
          >
            Cyril<span style={{ color: "var(--color-accent)" }}>.</span>
          </a>

          <div class="flex items-center gap-6">
            <a
              href="#projects"
              class="text-sm font-medium text-muted hover:text-foreground transition-colors"
              style={{ color: "var(--color-muted)" }}
            >
              Projects
            </a>
            <a
              href="#about"
              class="text-sm font-medium text-muted hover:text-foreground transition-colors"
              style={{ color: "var(--color-muted)" }}
            >
              About
            </a>
            <a
              href="mailto:hello@example.com"
              class="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--color-accent)" }}
            >
              Contact
            </a>
          </div>
        </nav>
      </header>

      {/* ── Main Content ───────────────────────────────── */}
      <main class="mx-auto max-w-5xl px-6">
        {/* Hero Section */}
        <section class="py-20 md:py-32" aria-label="Introduction">
          <h1 class="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Heyy...foo.
            <br />
            <span style={{ color: "var(--color-muted)" }}>
              I build things for the web.
            </span>
          </h1>
          <p
            class="mt-6 max-w-2xl text-lg leading-relaxed"
            style={{ color: "var(--color-muted)" }}
          >
            Software engineer focused on performant, accessible interfaces.
            Currently crafting delightful experiences with modern frontend
            tooling.
          </p>

          {/* Social / Status Links */}
          <div class="mt-8 flex gap-4">
            <a
              href="https://github.com/mdsolarflare"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium border transition-colors hover:bg-muted/5"
              style={{
                "border-color": "var(--color-border)",
                color: "var(--color-foreground)",
              }}
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/lets-meet-up-at-the-world-tree-and-do-quarterly-planning"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium border transition-colors hover:bg-muted/5"
              style={{
                "border-color": "var(--color-border)",
                color: "var(--color-foreground)",
              }}
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542c0 .955.792 1.729 1.771 1.729h20.451C23.2 24 24 23.226 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
          </div>

          {/* Performance tier indicator (dev-only visual) */}
          <div
            class="mt-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-mono"
            style={{
              "border-color": "var(--color-border)",
              color: "var(--color-muted)",
            }}
          >
            <span>tier:</span>
            <span
              class={getTier() === "high"
                ? "text-green-500"
                : getTier() === "medium"
                ? "text-yellow-500"
                : "text-red-500"}
            >
              {getTier()}
            </span>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" class="py-16" aria-label="Projects">
          <div class="mx-auto max-w-5xl">
            <h2 class="mb-8 text-2xl font-bold tracking-tight">Projects</h2>

            {error() && (
              <div
                role="alert"
                class="rounded-lg border p-4 text-sm"
                style={{
                  "border-color": "var(--color-border)",
                  color: "var(--color-muted)",
                }}
              >
                Failed to load projects: {error()}
              </div>
            )}

            {!content() && !error() && (
              <div
                class="project-grid"
                aria-label="Loading"
              >
                {(() => {
                  const skeletons = [];
                  for (let i = 0; i < 3; i++) {
                    skeletons.push(
                      <div
                        class="rounded-lg border p-6 animate-pulse"
                        style={{ "border-color": "var(--color-border)" }}
                      >
                        <div
                          class="aspect-video rounded mb-4"
                          style={{
                            background: "var(--color-muted)",
                            opacity: 0.1,
                          }}
                        />
                        <div
                          class="h-4 rounded w-3/4 mb-2"
                          style={{
                            background: "var(--color-muted)",
                            opacity: 0.1,
                          }}
                        />
                        <div
                          class="h-3 rounded w-full mb-1"
                          style={{
                            background: "var(--color-muted)",
                            opacity: 0.1,
                          }}
                        />
                        <div
                          class="h-3 rounded w-2/3"
                          style={{
                            background: "var(--color-muted)",
                            opacity: 0.1,
                          }}
                        />
                      </div>,
                    );
                  }
                  return skeletons;
                })()}
              </div>
            )}

            {content()?.projects && content()!.projects.length > 0 && (
              <div class="project-grid">
                <For
                  each={content()!.projects}
                  fallback={
                    <p style={{ color: "var(--color-muted)" }}>Loading...</p>
                  }
                >
                  {(project, index) => (
                    <ProjectCard
                      project={project}
                      tier={getTier()}
                      index={index()}
                    />
                  )}
                </For>
              </div>
            )}

            {content()?.projects && content()!.projects.length === 0 &&
              !error() && (
              <p class="text-muted" style={{ color: "var(--color-muted)" }}>
                No projects yet.
              </p>
            )}
          </div>
        </section>

        {/* About Section */}
        <section id="about" class="py-16" aria-label="About">
          <h2 class="mb-8 text-2xl font-bold tracking-tight">About</h2>
          <div
            class="max-w-2xl space-y-4 leading-relaxed"
            style={{ color: "var(--color-muted)" }}
          >
            <p>
              I'm a software engineer with a passion for building fast,
              accessible web applications. My focus is on the intersection of
              performance engineering and design systems — creating interfaces
              that feel instant while remaining inclusive to all users.
            </p>
            <p>
              Currently working with SolidJS, TypeScript, and modern CSS to push
              the boundaries of what's possible in client-side rendering without
              sacrificing bundle size or accessibility.
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer
        class="mt-16 border-t py-8"
        style={{ "border-color": "var(--color-border)" }}
      >
        <div class="mx-auto flex max-w-5xl items-center justify-between px-6">
          <p class="text-sm" style={{ color: "var(--color-muted)" }}>
            © {new Date().getFullYear()} Built with SolidJS + Vite.
          </p>
          <div
            class="flex gap-4 text-sm"
            style={{ color: "var(--color-muted)" }}
          >
            <a
              href="/content.json"
              class="hover:text-foreground transition-colors"
            >
              Content API
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
