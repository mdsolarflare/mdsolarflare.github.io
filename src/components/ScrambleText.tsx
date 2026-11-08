import { createSignal, onCleanup, onMount } from "solid-js";

const GLYPHS = "!<>-_\\/[]{}=+*^?#01";

interface Props {
  text: string;
  /** Decode animation runs when true (unless prefers-reduced-motion is active). */
  play?: boolean;
  /** Extra delay (ms) before the decode starts, for stagger. */
  delay?: number;
}

/**
 * ScrambleText — decode-style reveal: characters resolve left → right while
 * unresolved slots flicker through glyphs. Plays once when scrolled into view.
 * When `play` is false or `prefers-reduced-motion` is enabled, renders static text.
 */
export function ScrambleText(props: Props) {
  const shouldPlay = () =>
    (props.play ?? true) &&
    (typeof window === "undefined" ||
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const [display, setDisplay] = createSignal(
    shouldPlay() ? "" : props.text,
  );
  let el!: HTMLSpanElement;
  let raf = 0;

  const run = () => {
    const startAt = performance.now() + (props.delay ?? 0);
    const perChar = 45; // ms per resolved character

    const tick = (now: number) => {
      const elapsed = now - startAt;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const resolved = Math.floor(elapsed / perChar);
      if (resolved >= props.text.length) {
        setDisplay(props.text);
        return;
      }
      let out = props.text.slice(0, resolved);
      for (let i = resolved; i < props.text.length; i++) {
        const ch = props.text[i];
        out += ch === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      setDisplay(out);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  onMount(() => {
    if (!shouldPlay()) {
      setDisplay(props.text);
      return;
    }
    if (!("IntersectionObserver" in window)) {
      setDisplay(props.text);
      return;
    }
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      io.disconnect();
      window.clearTimeout(failSafe);
      run();
    };
    // Observe the sized parent — when playing, `el` starts empty (zero-area
    // targets never satisfy a >0 threshold) so it can't be observed directly
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) start();
      },
      { threshold: 0.5 },
    );
    io.observe(el.parentElement ?? el);
    // Fail-safe: a backgrounded tab pauses rendering frames, so IO may never
    // fire — settle to the real text instead of leaving the header blank
    const failSafe = window.setTimeout(start, 2500);
    onCleanup(() => {
      io.disconnect();
      window.clearTimeout(failSafe);
    });
  });

  onCleanup(() => cancelAnimationFrame(raf));

  return (
    <span ref={el} aria-label={props.text}>
      <span aria-hidden="true">{display()}</span>
    </span>
  );
}
