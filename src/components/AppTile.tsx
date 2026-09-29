import { type Component, createSignal, onMount } from "solid-js";
import type { App, AppStatus } from "@/types/content";
import type { PerformanceTier } from "@/hooks/usePerformanceTier";

interface Props {
  app: App;
  tier: PerformanceTier;
  index: number;
}

const STATUS_STYLES: Record<AppStatus, string> = {
  live: "bg-live/10 text-live",
  wip: "bg-wip/10 text-wip",
  retired: "bg-retired/15 text-retired",
};

/** Bento widths — full-bleed on mobile, fixed in the bento flow from sm up. */
const SIZE_STYLES: Record<NonNullable<App["size"]>, string> = {
  featured: "w-full sm:w-[21rem] lg:w-[25rem]",
  standard: "w-full sm:w-72",
  small: "w-full sm:w-56",
};

/** Shared tile body, rendered inside either the launchable <a> or inert <article>. */
const TileContent: Component<{ app: App }> = (props) => {
  const size = () => props.app.size ?? "standard";
  const isLaunchable = () =>
    props.app.status === "live"
      ? !!props.app.launchUrl
      : props.app.status === "wip"
        ? !!props.app.repoUrl
        : false;

  return (
    <>
      {/* Icon plate + status chip */}
      <div class="flex items-start justify-between">
        <span
          class={
            size() === "featured"
              ? "flex h-14 w-14 items-center justify-center rounded-xl"
              : "flex h-12 w-12 items-center justify-center rounded-xl"
          }
          style={{ background: `${props.app.accent}1a` }}
        >
          <img
            src={props.app.icon}
            alt=""
            class={size() === "featured" ? "h-8 w-8" : "h-7 w-7"}
            loading="lazy"
            decoding="async"
          />
        </span>
        <span
          class={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[props.app.status]}`}
        >
          <span class="h-1.5 w-1.5 rounded-full bg-current" />
          {props.app.status}
        </span>
      </div>

      {/* Name + tagline */}
      <h3
        class={
          size() === "featured"
            ? "mt-4 text-xl font-semibold leading-tight"
            : "mt-4 text-base font-semibold leading-tight"
        }
      >
        {props.app.name}
      </h3>
      <p class="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted">
        {props.app.tagline}
      </p>

      {/* Tags — featured tiles only, keeps small tiles quiet */}
      {size() === "featured" && props.app.tags && (
        <div class="mt-3 flex flex-wrap gap-2">
          {props.app.tags.map((tag) => (
            <span class="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: category + action hint */}
      <div class="mt-auto flex items-center justify-between pt-4">
        <span class="text-xs font-medium uppercase tracking-wide text-muted">
          {props.app.category}
        </span>
        {isLaunchable() ? (
          <span class="text-xs font-medium text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {props.app.status === "live" ? "Open ↗" : "Source ↗"}
          </span>
        ) : (
          <span class="text-xs text-muted">
            {props.app.status === "wip" ? "In the works" : "Retired"}
          </span>
        )}
      </div>
    </>
  );
};

/**
 * AppTile — one app in the launcher grid.
 *
 - Live apps open their launch URL; WIP apps open their repo (if any);
   retired tiles are inert and dimmed.
 - `size` drives bento width: featured / standard / small.
 - Entrance animation is tier-aware: high → staggered fade + slide-up,
   medium → quick fade, low → static.
 */
export const AppTile: Component<Props> = (props) => {
  const [visible, setVisible] = createSignal(false);

  onMount(() => {
    if (props.tier === "low") {
      setVisible(true);
      return;
    }
    const delay = props.tier === "high" ? props.index * 80 : props.index * 40;
    setTimeout(() => setVisible(true), delay);
  });

  const target = (): string | undefined => {
    if (props.app.status === "live") return props.app.launchUrl;
    if (props.app.status === "wip") return props.app.repoUrl;
    return undefined;
  };

  const classes = () =>
    [
      "group relative flex min-h-[13.5rem] shrink-0 snap-start flex-col rounded-xl border bg-surface p-5 text-left",
      SIZE_STYLES[props.app.size ?? "standard"],
      target()
        ? "cursor-pointer border-border transition-all duration-300 ease-out hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
        : "border-border",
    ].join(" ");

  const style = () => ({
    opacity: visible() ? (props.app.status === "retired" ? 0.55 : 1) : 0,
    transform:
      props.tier === "high" && !visible() ? "translateY(16px)" : undefined,
  });

  return target() ? (
    <a
      href={target()}
      target="_blank"
      rel="noopener noreferrer"
      class={classes()}
      style={style()}
    >
      <TileContent app={props.app} />
    </a>
  ) : (
    <article class={classes()} style={style()}>
      <TileContent app={props.app} />
    </article>
  );
};
