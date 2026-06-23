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

    const delay = props.tier === "high" ? props.index * 80 : props.index * 40;
    setTimeout(() => setVisible(true), delay);
  });

  return (
    <article
      class="rounded-lg border border-border bg-surface overflow-hidden shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md"
      style={{
        opacity: visible() ? 1 : 0,
        transform: props.tier === "high" && !visible()
          ? "translateY(16px)"
          : undefined,
      }}
    >
      {/* Project Image */}
      {props.project.imageUrl && (
        <div class="aspect-video w-full overflow-hidden">
          <img
            src={props.project.imageUrl}
            alt={props.project.title}
            class="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      <div class="p-6">
        {/* Date */}
        <time
          dateTime={props.project.date}
          class="text-xs font-medium text-muted"
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
        <p class="mt-2 text-sm leading-relaxed text-muted">
          {props.project.description}
        </p>

        {/* Tags */}
        <div class="mt-4 flex flex-wrap gap-2">
          {props.project.tags.map((tag) => (
            <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-accent/10 text-accent">
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
              class="text-sm font-medium text-accent underline-offset-4 hover:underline"
            >
              Live Demo &rarr;
            </a>
          )}
          {props.project.repoUrl && (
            <a
              href={props.project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm font-medium text-muted underline-offset-4 hover:underline"
            >
              Source &rarr;
            </a>
          )}
        </div>
      </div>
    </article>
  );
};
