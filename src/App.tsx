import { createSignal, For, onMount } from "solid-js";
import "./index.css";
import { ProjectCard } from "@/components/ProjectCard";
import { RotatingText } from "@/components/RotatingText";
import type { ContentData } from "@/types/content";
import { usePerformanceTier } from "@/hooks/usePerformanceTier";
import { useTheme } from "@/hooks/useTheme";

export default function App() {
  const [getTier] = usePerformanceTier();
  const [theme, toggleTheme] = useTheme();
  const [content, setContent] = createSignal<ContentData | null>(null);
  const [error, setError] = createSignal<string | null>(null);

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

  return (
    <div class="min-h-screen bg-background text-foreground">
      {/* ── Header ─────────────────────────────────────── */}
      <header class="sticky top-0 z-10 border-b border-border/60 backdrop-blur-sm bg-background/85">
        <nav class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a
            href="/"
            class="text-lg font-bold tracking-tight"
            aria-label="Home"
          >
            seeking infinite wealth
            <span class="text-accent">.</span>
          </a>

          <div class="flex items-center gap-6">
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

            <div class="h-5 w-px bg-border" />

            <a
              href="#projects"
              class="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Projects
            </a>
            <a
              href="#about"
              class="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              About
            </a>
            <a
              href="mailto:hello@example.com"
              class="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Contact
            </a>
          </div>
        </nav>
      </header>

      {/* ── Main Content ───────────────────────────────── */}
      <main class="mx-auto max-w-5xl px-6">
        {/* Hero Section */}
        <section class="py-12 md:py-16" aria-label="Introduction">
          <h1 class="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Heyy...foo.
            <br />
            <span class="text-muted">
              I build things for{" "}
              <RotatingText
                words={["the web", "games", "mobile", "embedded", "machines"]}
              />
            </span>
          </h1>
          <p class="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Wizard focused on performant design, interfaces, and scaling teams
            to villages. Currently crafting immaculately vibe coded tools and
            games for various sponsors.
          </p>

          {/* Social Links */}
          <div class="mt-8 flex gap-4">
            <a
              href="https://github.com/mdsolarflare"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/5"
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
              class="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/5"
            >
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542c0 .955.792 1.729 1.771 1.729h20.451C23.2 24 24 23.226 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
          </div>
        </section>

        {/* Projects Section */}
        <section id="projects" class="py-10" aria-label="Projects">
          <h2 class="mb-8 text-2xl font-bold tracking-tight">Projects</h2>

          {error() && (
            <div
              role="alert"
              class="rounded-lg border border-border p-4 text-sm text-muted"
            >
              Failed to load projects: {error()}
            </div>
          )}

          {!content() && !error() && (
            <div
              class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
              aria-label="Loading"
            >
              {[0, 1, 2].map(() => (
                <div class="rounded-lg border border-border p-6 animate-pulse">
                  <div class="mb-4 aspect-video rounded bg-muted/10" />
                  <div class="mb-2 h-4 w-3/4 rounded bg-muted/10" />
                  <div class="mb-1 h-3 w-full rounded bg-muted/10" />
                  <div class="h-3 w-2/3 rounded bg-muted/10" />
                </div>
              ))}
            </div>
          )}

          {content()?.projects && content()!.projects.length > 0 && (
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <For each={content()!.projects}>
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
            !error() && <p class="text-muted">No projects yet.</p>}
        </section>

        {/* About Section */}
        <section id="about" class="py-10" aria-label="About">
          <h2 class="mb-8 text-2xl font-bold tracking-tight">About</h2>
          <div class="max-w-2xl space-y-4 leading-relaxed text-muted">
            <p>
              <code class="font-mono bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                hello world
              </code>{" "}
              on a first-gen Intel Pentium in 1994. Thirty years later, I'm
              still mostly trying to figure out how to make complex systems
              simple and exploring how to get people locked in.
            </p>
            <p>
              I'm a{" "}
              <strong class="text-foreground font-semibold">
                village leader
              </strong>.{" "}
              I don't micromanage. We must match folks with problems that
              actually light them up. We know that trust and transparency beats
              {" "}
              <span class="line-through decoration-muted/50">
                corporate slop
              </span>{" "}
              every time. I work in the trenches with my peers. Being genuinely
              myself and communicating authentically are my secret to never
              burning out.
            </p>
            <p>
              I am built for reinvention, happy accidents, major detours:
              embedded systems, geospatial mapping, machine learning, defense
              tech, web-scale cloud infra, networking security, big data and
              massive real-time data pipelines; even a brief stint helping serve
              internet's "dankest" AI ads. There is only one rule:{" "}
              <span class="text-accent font-medium">
                build real things that work for real people
              </span>
              . Coffee's on me.
            </p>
            <p>
              - a self-proclaimed{" "}
              <em class="italic text-foreground">
                wizard of the pragmatic arts
              </em>
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer class="mt-16 border-t border-border py-8">
        <div class="mx-auto flex max-w-5xl items-center justify-between px-6">
          <p class="text-sm text-muted">
            &copy; {new Date().getFullYear()} Built with SolidJS + Vite.
          </p>
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
