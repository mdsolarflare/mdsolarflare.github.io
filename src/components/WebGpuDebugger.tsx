import { createMemo, For, type Component } from "solid-js";
import { ScrambleText } from "@/components/ScrambleText";
import {
  evaluateAppCompatibility,
  type ApiSupportStatus,
  type GpuTelemetry,
  type PerformanceTier,
} from "@/hooks/usePerformanceTier";
import type { App } from "@/types/content";

interface Props {
  telemetry: GpuTelemetry;
  apps: App[];
}

const TIER_BADGE: Record<
  PerformanceTier,
  { label: string; style: string; dot: string }
> = {
  high: {
    label: "TIER: HIGH // HARDWARE_ACCEL",
    style: "border-live/40 bg-live/10 text-live",
    dot: "bg-live dot-pulse",
  },
  medium: {
    label: "TIER: MEDIUM // PARTIAL_ACCEL",
    style: "border-wip/40 bg-wip/10 text-wip",
    dot: "bg-wip",
  },
  low: {
    label: "TIER: LOW // SOFTWARE_FALLBACK",
    style: "border-accent/50 bg-accent/15 text-accent",
    dot: "bg-accent",
  },
};

const API_STATUS_PILL: Record<
  ApiSupportStatus,
  { text: string; className: string }
> = {
  checking: {
    text: "PROBING",
    className: "bg-muted/15 text-muted",
  },
  hardware: {
    text: "ONLINE",
    className: "bg-live/10 text-live",
  },
  software: {
    text: "CPU FALLBACK",
    className: "bg-wip/15 text-wip",
  },
  unavailable: {
    text: "OFFLINE",
    className: "bg-retired/20 text-muted",
  },
};

export const WebGpuDebugger: Component<Props> = (props) => {
  const tierMeta = () => TIER_BADGE[props.telemetry.tier];

  // Order apps so GPU-dependent games & WebGPU experiments appear first
  const appReports = createMemo(() => {
    const reports = props.apps.map((app) =>
      evaluateAppCompatibility(app, props.telemetry),
    );
    const weight = { webgl2: 0, webgpu: 1, "wasm-cpu": 2 } as const;
    return reports.sort(
      (a, b) => weight[a.gpuRequirement] - weight[b.gpuRequirement],
    );
  });

  const affectedCount = createMemo(
    () => appReports().filter((r) => r.status !== "optimal").length,
  );

  return (
    <section
      id="webgpu-debugger"
      class="py-8 scroll-mt-24"
      aria-label="WebGPU Debugger"
    >
      {/* Terminal Shelf Header */}
      <div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="font-mono text-sm font-semibold tracking-widest text-muted">
          <span class="text-live">~</span>/
          <ScrambleText text="WebGPU Debugger" play={true} delay={120} />
          <span class="text-accent">{" $"}</span>
          <span class="caret-blink ml-1 text-accent" aria-hidden="true">
            █
          </span>
        </h2>
        <span class="font-mono text-xs text-muted">
          sys.gpu.telemetry // read-only
        </span>
      </div>

      {/* Main Cyberpunk Diagnostic Panel */}
      <div
        class="tile-featured relative overflow-hidden rounded-xl border border-border bg-surface p-5 sm:p-6"
        style={{ "--tile-accent": "#34d399" }}
      >
        {/* Top Status Bar */}
        <div class="flex flex-col justify-between gap-3 border-b border-border/80 pb-4 sm:flex-row sm:items-center">
          <div>
            <div class="flex flex-wrap items-center gap-2.5">
              <span
                class={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs font-semibold tracking-wider ${tierMeta().style}`}
              >
                <span class={`h-2 w-2 rounded-full ${tierMeta().dot}`} />
                {tierMeta().label}
              </span>
              {!props.telemetry.probing && (
                <span
                  class={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium ${
                    affectedCount() > 0
                      ? "bg-wip/15 text-wip"
                      : "bg-live/10 text-live"
                  }`}
                >
                  {affectedCount() === 0
                    ? "ALL APPS NOMINAL"
                    : `${affectedCount()} ${affectedCount() === 1 ? "APP" : "APPS"} MAY STRUGGLE`}
                </span>
              )}
            </div>
            <p class="mt-2 font-mono text-xs leading-relaxed text-muted">
              {props.telemetry.tierReason}
            </p>
          </div>

          <div class="shrink-0 text-left sm:text-right font-mono text-[11px] text-muted">
            <div>
              ACCEL:{" "}
              <span
                class={
                  props.telemetry.isHardwareAccelerated
                    ? "font-semibold text-live"
                    : "font-semibold text-wip"
                }
              >
                {props.telemetry.isHardwareAccelerated
                  ? "HARDWARE GPU"
                  : "SOFTWARE / CPU"}
              </span>
            </div>
            <div>
              THREADS:{" "}
              <span class="text-foreground">
                {props.telemetry.runtime.hardwareConcurrency
                  ? `${props.telemetry.runtime.hardwareConcurrency} logical cores`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* 4-Column Hardware Probe Matrix */}
        <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* 01: GPU Renderer */}
          <div class="rounded-lg border border-border/80 bg-background/60 p-3.5">
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
                01 // GPU_RENDERER
              </span>
              <span
                class={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                  props.telemetry.isSoftwareRenderer
                    ? "bg-wip/15 text-wip"
                    : props.telemetry.isHardwareAccelerated
                      ? "bg-live/10 text-live"
                      : "bg-retired/20 text-muted"
                }`}
              >
                {props.telemetry.isSoftwareRenderer
                  ? "SW RASTER"
                  : props.telemetry.isHardwareAccelerated
                    ? "HW GPU"
                    : "UNVERIFIED"}
              </span>
            </div>
            <p
              class="mt-2 line-clamp-2 font-mono text-xs font-semibold text-foreground"
              title={props.telemetry.webgl.renderer}
            >
              {props.telemetry.webgl.renderer}
            </p>
            <p class="mt-1 truncate font-mono text-[11px] text-muted">
              Vendor: {props.telemetry.webgl.vendor}
            </p>
          </div>

          {/* 02: WebGPU API */}
          <div class="rounded-lg border border-border/80 bg-background/60 p-3.5">
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
                02 // WEBGPU_API
              </span>
              <span
                class={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${API_STATUS_PILL[props.telemetry.webgpu.status].className}`}
              >
                {API_STATUS_PILL[props.telemetry.webgpu.status].text}
              </span>
            </div>
            <p
              class="mt-2 line-clamp-2 font-mono text-xs font-semibold text-foreground"
              title={props.telemetry.webgpu.adapterInfo}
            >
              {props.telemetry.webgpu.adapterInfo}
            </p>
            <p class="mt-1 font-mono text-[11px] text-muted">
              navigator.gpu:{" "}
              {props.telemetry.webgpu.status === "hardware"
                ? "Adapter ready"
                : props.telemetry.webgpu.isFallbackAdapter
                  ? "Fallback adapter only"
                  : "No hardware adapter"}
            </p>
          </div>

          {/* 03: WebGL 2.0 (Godot 4 Compatibility) */}
          <div class="rounded-lg border border-border/80 bg-background/60 p-3.5">
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
                03 // WEBGL2_GODOT
              </span>
              <span
                class={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${API_STATUS_PILL[props.telemetry.webgl.status].className}`}
              >
                {props.telemetry.webgl.version}
              </span>
            </div>
            <p class="mt-2 font-mono text-xs font-semibold text-foreground">
              {props.telemetry.webgl.maxSamples
                ? `MSAA: up to ${props.telemetry.webgl.maxSamples}x`
                : "MSAA: unavailable"}
            </p>
            <p class="mt-1 font-mono text-[11px] text-muted">
              Max Texture:{" "}
              {props.telemetry.webgl.maxTextureSize
                ? `${props.telemetry.webgl.maxTextureSize}px`
                : "N/A"}
            </p>
          </div>

          {/* 04: Frame Budget & WASM Threads */}
          <div class="rounded-lg border border-border/80 bg-background/60 p-3.5">
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">
                04 // FRAME_BUDGET
              </span>
              <span
                class={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                  !props.telemetry.frameBudget.measured
                    ? "bg-muted/15 text-muted"
                    : (props.telemetry.frameBudget.slowFrameRatio ?? 0) > 0.3
                      ? "bg-wip/15 text-wip"
                      : "bg-live/10 text-live"
                }`}
              >
                {props.telemetry.frameBudget.measured
                  ? `~${props.telemetry.frameBudget.estimatedFps} FPS`
                  : "SAMPLING"}
              </span>
            </div>
            <p class="mt-2 font-mono text-xs font-semibold text-foreground">
              {props.telemetry.frameBudget.avgFrameMs
                ? `${props.telemetry.frameBudget.avgFrameMs.toFixed(1)} ms / frame avg`
                : "Measuring frame pacing…"}
            </p>
            <p class="mt-1 font-mono text-[11px] text-muted">
              COOP/COEP Threads:{" "}
              {props.telemetry.runtime.crossOriginIsolated
                ? "Isolated (SAB Ready)"
                : "Single-thread WASM"}
            </p>
          </div>
        </div>

        {/* Per-App Compatibility Matrix */}
        <div class="mt-5">
          <div class="mb-2.5 flex items-center justify-between">
            <h3 class="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
              App GPU Compatibility Matrix
            </h3>
            <span class="font-mono text-[11px] text-muted">
              games &amp; experiments prioritized
            </span>
          </div>

          <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <For each={appReports()}>
              {(report) => (
                <div class="flex items-start justify-between gap-3 rounded-lg border border-border/80 bg-background/40 p-3">
                  <div class="flex items-start gap-2.5 min-w-0">
                    <span
                      class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${report.app.accent}1a` }}
                    >
                      <img
                        src={report.app.icon}
                        alt=""
                        class="h-4 w-4"
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-1.5">
                        <span class="font-semibold text-sm text-foreground">
                          {report.app.name}
                        </span>
                        <span class="font-mono text-[10px] text-muted">
                          [{report.engineLabel}]
                        </span>
                      </div>
                      <p class="mt-0.5 text-xs leading-relaxed text-muted">
                        {report.detail}
                      </p>
                    </div>
                  </div>

                  <span
                    class={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                      report.status === "optimal"
                        ? "bg-live/10 text-live"
                        : "border border-wip/40 bg-wip/10 text-wip"
                    }`}
                  >
                    {report.badgeText}
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Browser & Godot GPU Remediation Terminal */}
        <div class="mt-5 rounded-lg border border-border/80 bg-background/70 p-4">
          <div class="flex items-center gap-2 font-mono text-xs font-semibold text-accent">
            <span aria-hidden="true">{">"}</span>
            <span>
              WHY GAMES LAG WITHOUT GPU VISIBILITY &amp; HOW TO FIX IT
            </span>
          </div>
          <p class="mt-1.5 text-xs leading-relaxed text-muted">
            Godot 4 web builds (like{" "}
            <strong class="font-medium text-foreground">Vector Chess</strong>)
            compile to WebAssembly and render via{" "}
            <code class="rounded bg-surface px-1 py-0.5 font-mono text-[11px] text-foreground">
              WebGL 2.0 (gl_compatibility)
            </code>{" "}
            with procedural vector polygon draw calls and 4x 2D MSAA. When your
            browser has hardware acceleration disabled or blocks the GPU driver,
            it silently falls back to a CPU software rasterizer (
            <code class="rounded bg-surface px-1 py-0.5 font-mono text-[11px] text-foreground">
              SwiftShader
            </code>{" "}
            or{" "}
            <code class="rounded bg-surface px-1 py-0.5 font-mono text-[11px] text-foreground">
              LLVMpipe
            </code>
            ), dropping framerates from 60 FPS to single digits.
          </p>

          <div class="mt-3 grid grid-cols-1 gap-2.5 font-mono text-[11px] sm:grid-cols-3">
            <div class="rounded border border-border/60 bg-surface/70 p-2.5">
              <div class="font-semibold text-foreground">
                Chrome / Edge / Brave
              </div>
              <p class="mt-1 text-muted leading-normal">
                Open{" "}
                <span class="text-accent">chrome://settings/system</span>,
                enable{" "}
                <em>&ldquo;Use graphics acceleration when available&rdquo;</em>,
                and relaunch. Inspect{" "}
                <span class="text-live">chrome://gpu</span> to verify.
              </p>
            </div>
            <div class="rounded border border-border/60 bg-surface/70 p-2.5">
              <div class="font-semibold text-foreground">Firefox</div>
              <p class="mt-1 text-muted leading-normal">
                Open{" "}
                <span class="text-accent">about:preferences#general</span> →{" "}
                <em>Performance</em> and enable{" "}
                <em>&ldquo;Use hardware acceleration when available&rdquo;</em>.
                Check <span class="text-live">about:support</span>.
              </p>
            </div>
            <div class="rounded border border-border/60 bg-surface/70 p-2.5">
              <div class="font-semibold text-foreground">
                Linux / Dual-GPU Laptops
              </div>
              <p class="mt-1 text-muted leading-normal">
                Force discrete GPU execution and ensure Vulkan/ANGLE drivers are
                enabled (in Chromium:{" "}
                <span class="text-accent">
                  chrome://flags/#enable-unsafe-webgpu
                </span>
                ).
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
