import { type Component, createSignal, onMount } from "solid-js";
import type { Project } from "@/types/content";
import type { PerformanceTier } from "@/hooks/usePerformanceTier";

interface Props {
  project: Project;
  tier: PerformanceTier;
  index: number;
}

/**
 * ProjectCard with tier-aware animations.
 *
 * - high: staggered fade-in + slide-up via CSS transitions
 * - medium: simple fade-in, shorter duration
 * - low: static layout, zero animation
 */
export const ProjectCard: Component<Props> = (props) => {
  const [visible, setVisible] = createSignal(false);

  onMount(() => {
    if (props.tier === "low") {
      setVisible(true);
      return;
    }

    // Stagger delay based on index and tier
    const delay = props.tier === "high" ? props.index * 80 : props.index * 40;
    setTimeout(() => setVisible(true), delay);
  });

  return (
    <article
      class="card-shadow rounded-lg bg-surface border overflow-hidden transition-all duration-300 ease-out"
      style={{
        "background-color": "var(--color-surface)",
        "border-color": "var(--color-border)",
        opacity: visible() ? 1 : 0,
        transform: props.tier === "high" && !visible()
          ? "translateY(16px)"
          : "translateY(0)",
      }}
    >
      {/* Image placeholder */}
      {props.project.imageUrl && (
        <div
          class="aspect-video w-full"
          style={{
            background:
              "linear-gradient(135deg, var(--color-accent)/10, var(--color-surface))",
          }}
        >
          <div class="flex h-full items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-12 w-12 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width={1.5}
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
        </div>
      )}

      <div class="p-6">
        {/* Date */}
        <time
          dateTime={props.project.date}
          class="text-xs font-medium"
          style={{ color: "var(--color-muted)" }}
        >
          {new Date(props.project.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
          })}
        </time>

        {/* Title */}
        <h3 class="mt-2 text-xl font-semibold leading-tight">
          {props.project.title}
        </h3>

        {/* Description */}
        <p
          class="mt-2 text-sm leading-relaxed"
          style={{ color: "var(--color-muted)" }}
        >
          {props.project.description}
        </p>

        {/* Tags */}
        <div class="mt-4 flex flex-wrap gap-2">
          {props.project.tags.map((tag) => (
            <span
              class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
              style={{
                background: "var(--color-accent)",
                color: "#ffffff",
                opacity: 0.12,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Links */}
        <div class="mt-4 flex gap-4">
          {props.project.liveUrl && (
            <a
              href={props.project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm font-medium underline-offset-4 hover:underline"
              style={{ color: "var(--color-accent)" }}
            >
              Live Demo →
            </a>
          )}
          {props.project.repoUrl && (
            <a
              href={props.project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm font-medium underline-offset-4 hover:underline"
              style={{ color: "var(--color-muted)" }}
            >
              Source →
            </a>
          )}
        </div>
      </div>
    </article>
  );
};
