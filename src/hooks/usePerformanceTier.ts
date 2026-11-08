import { Accessor, createSignal, onMount } from "solid-js";
import type { App } from "@/types/content";

export type PerformanceTier = "high" | "medium" | "low";

export type ApiSupportStatus =
  | "checking"
  | "hardware"
  | "software"
  | "unavailable";

export interface GpuTelemetry {
  tier: PerformanceTier;
  tierReason: string;
  probing: boolean;
  /** True when WebGL2/WebGPU is backed by a real hardware GPU rather than a CPU rasterizer. */
  isHardwareAccelerated: boolean;
  /** True when a known software rasterizer (SwiftShader, LLVMpipe, Basic Render Driver) is active. */
  isSoftwareRenderer: boolean;
  webgl: {
    status: ApiSupportStatus;
    version: "WebGL 2.0" | "WebGL 1.0" | "None";
    vendor: string;
    renderer: string;
    maxTextureSize: number | null;
    maxSamples: number | null;
  };
  webgpu: {
    status: ApiSupportStatus;
    available: boolean;
    adapterInfo: string;
    isFallbackAdapter: boolean;
  };
  frameBudget: {
    measured: boolean;
    avgFrameMs: number | null;
    estimatedFps: number | null;
    slowFrameRatio: number | null;
  };
  runtime: {
    crossOriginIsolated: boolean;
    sharedArrayBuffer: boolean;
    hardwareConcurrency: number | null;
    deviceMemoryGb: number | null;
  };
}

export interface AppCompatibilityReport {
  app: App;
  engineLabel: string;
  gpuRequirement: "webgpu" | "webgl2" | "wasm-cpu";
  status: "optimal" | "warning" | "critical";
  badgeText: string;
  detail: string;
}

const SOFTWARE_RENDERER_PATTERN =
  /swiftshader|llvmpipe|softpipe|software|microsoft basic render|mesa offscreen/i;

const INITIAL_TELEMETRY: GpuTelemetry = {
  tier: "high",
  tierReason: "Probing graphics subsystem…",
  probing: true,
  isHardwareAccelerated: true,
  isSoftwareRenderer: false,
  webgl: {
    status: "checking",
    version: "None",
    vendor: "Probing…",
    renderer: "Probing…",
    maxTextureSize: null,
    maxSamples: null,
  },
  webgpu: {
    status: "checking",
    available: false,
    adapterInfo: "Probing…",
    isFallbackAdapter: false,
  },
  frameBudget: {
    measured: false,
    avgFrameMs: null,
    estimatedFps: null,
    slowFrameRatio: null,
  },
  runtime: {
    crossOriginIsolated: false,
    sharedArrayBuffer: false,
    hardwareConcurrency: null,
    deviceMemoryGb: null,
  },
};

/**
 * Probes WebGL2/WebGL1, WebGPU, runtime isolation, and frame-rate budget
 * using standard browser APIs to power the WebGPU Debugger and per-app
 * GPU compatibility warnings.
 */
export function usePerformanceTier(): [Accessor<GpuTelemetry>] {
  const [telemetry, setTelemetry] =
    createSignal<GpuTelemetry>(INITIAL_TELEMETRY);

  onMount(async () => {
    const webgl = probeWebGl();
    const runtime = probeRuntime();

    // Start with synchronous WebGL + runtime results while async probes run
    const initialTier = computeTier(webgl, INITIAL_TELEMETRY.webgpu, INITIAL_TELEMETRY.frameBudget);
    setTelemetry((prev) => ({
      ...prev,
      webgl,
      runtime,
      isHardwareAccelerated: initialTier.isHardwareAccelerated,
      isSoftwareRenderer: initialTier.isSoftwareRenderer,
      tier: initialTier.tier,
      tierReason: initialTier.reason,
    }));

    const [webgpu, frameBudget] = await Promise.all([
      probeWebGpu(),
      measureFrameBudget(),
    ]);

    const finalResult = computeTier(webgl, webgpu, frameBudget);

    setTelemetry({
      tier: finalResult.tier,
      tierReason: finalResult.reason,
      probing: false,
      isHardwareAccelerated: finalResult.isHardwareAccelerated,
      isSoftwareRenderer: finalResult.isSoftwareRenderer,
      webgl,
      webgpu,
      frameBudget,
      runtime,
    });
  });

  return [telemetry];
}

function computeTier(
  webgl: GpuTelemetry["webgl"],
  webgpu: GpuTelemetry["webgpu"],
  frameBudget: GpuTelemetry["frameBudget"],
): {
  tier: PerformanceTier;
  reason: string;
  isHardwareAccelerated: boolean;
  isSoftwareRenderer: boolean;
} {
  const isSoftware =
    webgl.status === "software" ||
    webgpu.status === "software" ||
    SOFTWARE_RENDERER_PATTERN.test(webgl.renderer);

  const hasHardwareWebGl = webgl.status === "hardware";
  const hasHardwareWebGpu = webgpu.status === "hardware";
  const isHardwareAccelerated = !isSoftware && (hasHardwareWebGl || hasHardwareWebGpu);

  if (isSoftware) {
    return {
      tier: "low",
      reason: `Software rasterizer detected (${webgl.renderer}). Browser cannot see hardware GPU.`,
      isHardwareAccelerated: false,
      isSoftwareRenderer: true,
    };
  }

  if (webgl.status === "unavailable" && webgpu.status === "unavailable") {
    return {
      tier: "low",
      reason: "Neither WebGL nor WebGPU contexts could be initialized.",
      isHardwareAccelerated: false,
      isSoftwareRenderer: false,
    };
  }

  // Check network constraints if available
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn) {
    if (conn.saveData || conn.effectiveType === "slow-2g" || conn.effectiveType === "2g") {
      return {
        tier: "low",
        reason: "Data-saver or 2G connection constraint active.",
        isHardwareAccelerated,
        isSoftwareRenderer: false,
      };
    }
    if (conn.effectiveType === "3g") {
      return {
        tier: "medium",
        reason: "Hardware GPU active, but constrained by 3G network bandwidth.",
        isHardwareAccelerated,
        isSoftwareRenderer: false,
      };
    }
  }

  if (frameBudget.measured && (frameBudget.slowFrameRatio ?? 0) > 0.3) {
    return {
      tier: "medium",
      reason: `Hardware GPU active, but ${(frameBudget.slowFrameRatio! * 100).toFixed(0)}% of sampled frames missed the 16.7ms (60fps) budget.`,
      isHardwareAccelerated,
      isSoftwareRenderer: false,
    };
  }

  if (webgpu.status === "unavailable" && hasHardwareWebGl) {
    return {
      tier: "medium",
      reason: "Hardware WebGL 2.0 active; WebGPU API unavailable in this browser.",
      isHardwareAccelerated: true,
      isSoftwareRenderer: false,
    };
  }

  return {
    tier: "high",
    reason: "Hardware GPU acceleration verified across graphics pipelines.",
    isHardwareAccelerated: true,
    isSoftwareRenderer: false,
  };
}

function probeRuntime(): GpuTelemetry["runtime"] {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    crossOriginIsolated: Boolean(window.crossOriginIsolated),
    sharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",
    hardwareConcurrency: nav.hardwareConcurrency ?? null,
    deviceMemoryGb: nav.deviceMemory ?? null,
  };
}

function probeWebGl(): GpuTelemetry["webgl"] {
  try {
    const canvas = document.createElement("canvas");
    const gl2 = canvas.getContext("webgl2") as WebGL2RenderingContext | null;
    const gl =
      gl2 ??
      ((canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null);

    if (!gl) {
      return {
        status: "unavailable",
        version: "None",
        vendor: "Unavailable",
        renderer: "No WebGL context available",
        maxTextureSize: null,
        maxSamples: null,
      };
    }

    const version = gl2 ? "WebGL 2.0" : "WebGL 1.0";
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const vendor = debugInfo
      ? (gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string)
      : (gl.getParameter(gl.VENDOR) as string);
    const renderer = debugInfo
      ? (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string)
      : (gl.getParameter(gl.RENDERER) as string);

    const maxTextureSize = (gl.getParameter(gl.MAX_TEXTURE_SIZE) as number) ?? null;
    const maxSamples = gl2
      ? ((gl2.getParameter(gl2.MAX_SAMPLES) as number) ?? null)
      : null;

    const isSoftware = SOFTWARE_RENDERER_PATTERN.test(renderer);

    return {
      status: isSoftware ? "software" : "hardware",
      version,
      vendor: vendor || "Unknown Vendor",
      renderer: renderer || "Masked WebGL Renderer",
      maxTextureSize,
      maxSamples,
    };
  } catch {
    return {
      status: "unavailable",
      version: "None",
      vendor: "Error",
      renderer: "WebGL probe blocked",
      maxTextureSize: null,
      maxSamples: null,
    };
  }
}

async function probeWebGpu(): Promise<GpuTelemetry["webgpu"]> {
  const nav = navigator as Navigator & {
    gpu?: {
      requestAdapter: (options?: {
        powerPreference?: "high-performance" | "low-power";
      }) => Promise<{
        info?: {
          vendor?: string;
          architecture?: string;
          device?: string;
          description?: string;
          isFallbackAdapter?: boolean;
        };
        isFallbackAdapter?: boolean;
      } | null>;
    };
  };

  if (!nav.gpu || typeof nav.gpu.requestAdapter !== "function") {
    return {
      status: "unavailable",
      available: false,
      adapterInfo: "navigator.gpu not exposed by browser",
      isFallbackAdapter: false,
    };
  }

  try {
    const adapter = await nav.gpu.requestAdapter({
      powerPreference: "high-performance",
    });

    if (!adapter) {
      return {
        status: "unavailable",
        available: false,
        adapterInfo: "No WebGPU adapter returned (GPU may be blocklisted)",
        isFallbackAdapter: false,
      };
    }

    const info = adapter.info;
    const isFallback = Boolean(
      info?.isFallbackAdapter ?? adapter.isFallbackAdapter,
    );
    const parts = [
      info?.description,
      info?.device,
      info?.vendor,
      info?.architecture ? `(${info.architecture})` : undefined,
    ].filter(Boolean);

    const adapterLabel =
      parts.length > 0 ? parts.join(" · ") : "WebGPU Hardware Adapter";
    const isSoftware =
      isFallback || SOFTWARE_RENDERER_PATTERN.test(adapterLabel);

    return {
      status: isSoftware ? "software" : "hardware",
      available: !isSoftware,
      adapterInfo: adapterLabel,
      isFallbackAdapter: isSoftware,
    };
  } catch {
    return {
      status: "unavailable",
      available: false,
      adapterInfo: "Adapter request rejected",
      isFallbackAdapter: false,
    };
  }
}

function measureFrameBudget(): Promise<GpuTelemetry["frameBudget"]> {
  return new Promise((resolve) => {
    if (!window.performance || !performance.now || document.hidden) {
      resolve({
        measured: false,
        avgFrameMs: null,
        estimatedFps: null,
        slowFrameRatio: null,
      });
      return;
    }

    const FRAME_BUDGET = 16.67; // 60fps target in ms
    const SAMPLE_COUNT = 24;
    let samples = 0;
    let slowFrames = 0;
    let totalDelta = 0;
    let lastTime = performance.now();

    const failSafe = window.setTimeout(() => {
      resolve({
        measured: false,
        avgFrameMs: null,
        estimatedFps: null,
        slowFrameRatio: null,
      });
    }, 1500);

    function tick(now: number) {
      const delta = now - lastTime;
      lastTime = now;

      if (samples > 0) {
        totalDelta += delta;
        if (delta > FRAME_BUDGET * 1.5) {
          slowFrames++;
        }
      }

      samples++;

      if (samples > SAMPLE_COUNT) {
        window.clearTimeout(failSafe);
        const avgFrameMs = totalDelta / SAMPLE_COUNT;
        const estimatedFps = Math.min(144, Math.round(1000 / Math.max(1, avgFrameMs)));
        const slowFrameRatio = slowFrames / SAMPLE_COUNT;
        resolve({
          measured: true,
          avgFrameMs,
          estimatedFps,
          slowFrameRatio,
        });
        return;
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  });
}

/**
 * Evaluates how a given app from `content.json` will perform on the user's
 * current browser & GPU setup.
 */
export function evaluateAppCompatibility(
  app: App,
  telemetry: GpuTelemetry,
): AppCompatibilityReport {
  const tags = (app.tags ?? []).map((t) => t.toLowerCase());
  const isGodot = tags.includes("godot");
  const isWebGpu = tags.includes("webgpu");
  const isWebGl = tags.includes("webgl") || isGodot || app.category === "games";

  if (isWebGpu) {
    if (telemetry.webgpu.status === "hardware") {
      return {
        app,
        engineLabel: "WebGPU Pipeline",
        gpuRequirement: "webgpu",
        status: "optimal",
        badgeText: "WebGPU Ready",
        detail: "Hardware WebGPU adapter verified.",
      };
    }
    if (telemetry.webgpu.status === "software") {
      return {
        app,
        engineLabel: "WebGPU Pipeline",
        gpuRequirement: "webgpu",
        status: "critical",
        badgeText: "CPU Fallback",
        detail:
          "WebGPU is running on a software fallback adapter. Enable hardware acceleration.",
      };
    }
    return {
      app,
      engineLabel: "WebGPU Pipeline",
      gpuRequirement: "webgpu",
      status: "critical",
      badgeText: "No WebGPU",
      detail:
        "navigator.gpu adapter unavailable. Requires a WebGPU-enabled browser with GPU acceleration.",
    };
  }

  if (isWebGl) {
    const engineLabel = isGodot
      ? "Godot 4 · WebGL 2.0 + 4x MSAA"
      : "WebGL 2.0 Pipeline";

    if (
      telemetry.webgl.status === "software" ||
      telemetry.isSoftwareRenderer
    ) {
      return {
        app,
        engineLabel,
        gpuRequirement: "webgl2",
        status: "critical",
        badgeText: "CPU Fallback",
        detail:
          "Browser is using a CPU software rasterizer (SwiftShader/LLVMpipe). Godot procedural polygon draw calls + 4x MSAA will severely lag.",
      };
    }

    if (
      telemetry.webgl.status === "unavailable" ||
      telemetry.webgl.version !== "WebGL 2.0"
    ) {
      return {
        app,
        engineLabel,
        gpuRequirement: "webgl2",
        status: "critical",
        badgeText: "No WebGL 2.0",
        detail:
          "Godot 4 Compatibility exports require a hardware-accelerated WebGL 2.0 context.",
      };
    }

    if (telemetry.tier === "medium" && (telemetry.frameBudget.slowFrameRatio ?? 0) > 0.3) {
      return {
        app,
        engineLabel,
        gpuRequirement: "webgl2",
        status: "warning",
        badgeText: "Frame Drops",
        detail:
          "Hardware WebGL 2.0 detected, but main-thread frame pacing is below 60 FPS.",
      };
    }

    return {
      app,
      engineLabel,
      gpuRequirement: "webgl2",
      status: "optimal",
      badgeText: "GPU Ready",
      detail: "Hardware WebGL 2.0 + MSAA acceleration verified for Godot 4.",
    };
  }

  // Non-GPU intensive apps (e.g. React + Rust/WASM tools)
  return {
    app,
    engineLabel: tags.includes("wasm") ? "Rust / WASM + DOM" : "Standard Web",
    gpuRequirement: "wasm-cpu",
    status: "optimal",
    badgeText: "Nominal",
    detail: "CPU/WASM bound — runs smoothly even without dedicated GPU acceleration.",
  };
}
