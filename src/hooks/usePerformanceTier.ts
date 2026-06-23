import { Accessor, createSignal, onMount } from "solid-js";

export type PerformanceTier = "high" | "medium" | "low";

/**
 * Detects device performance tier using only standard browser APIs.
 *
 * Detection order (first match wins):
 * 1. `prefers-reduced-motion: reduce` → always "low"
 * 2. WebGL renderer string → software renderers (SwiftShader/LLVMpipe) → "low"
 * 3. Network info (`navigator.connection`) → slow/save-data → "medium"/"low"
 * 4. Frame-rate budget monitoring → fallback measurement
 */
export function usePerformanceTier(): [Accessor<PerformanceTier>] {
  const [tier, setTier] = createSignal<PerformanceTier>("high");

  onMount(() => {
    // 1. Respect user's motion preference first
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTier("low");
      return;
    }

    // 2. Check for software WebGL renderers
    const renderer = getWebGlRenderer();
    if (renderer && /swiftshader|llvmpipe|software/i.test(renderer)) {
      setTier("low");
      return;
    }

    // 3. Network-based detection (only available when API exists)
    const conn = (navigator as Navigator & { connection?: any }).connection;
    if (conn) {
      if (
        conn.saveData || conn.effectiveType === "slow-2g" ||
        conn.effectiveType === "2g"
      ) {
        setTier("low");
        return;
      }
      if (conn.effectiveType === "3g") {
        setTier("medium");
        return;
      }
    }

    // 4. Frame-rate budget monitoring as final fallback
    measureFrameBudget(setTier);
  });

  return [tier];
}

/** Attempt to read the WebGL renderer string. Returns null on failure. */
function getWebGlRenderer(): string | null {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    if (!gl) return null;

    const ext = (gl as WebGLRenderingContext).getExtension(
      "WEBGL_debug_renderer_info",
    );
    if (!ext) return null;

    return (gl as WebGLRenderingContext).getParameter(
      ext.UNMASKED_RENDERER_WEBGL,
    ) as string;
  } catch {
    return null;
  }
}

/**
 * Measures actual frame budget over a short window.
 * If >30% of frames exceed the budget, downgrade to "medium".
 */
function measureFrameBudget(setTier: (t: PerformanceTier) => void): void {
  // Default to high if measurement can't run
  setTier("high");

  if (!window.performance || !performance.now) return;

  const FRAME_BUDGET = 16.67; // 60fps target in ms
  const SAMPLE_COUNT = 30;
  let samples = 0;
  let slowFrames = 0;
  let lastTime = performance.now();

  function tick(now: number) {
    const delta = now - lastTime;
    lastTime = now;

    if (delta > FRAME_BUDGET * 1.5) {
      slowFrames++;
    }

    samples++;

    if (samples >= SAMPLE_COUNT) {
      const ratio = slowFrames / samples;
      if (ratio > 0.3) {
        setTier("medium");
      } else {
        setTier("high");
      }
      return; // stop monitoring after sample window
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
