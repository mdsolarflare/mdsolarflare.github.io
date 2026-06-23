import { type Component, createEffect, createSignal, onMount } from "solid-js";

interface Props {
  words: string[];
  intervalMs?: number;
}

/**
 * Lightweight rotating text with fade + slide.
 * Zero dependencies — CSS transitions driven by SolidJS signals.
 */
export const RotatingText: Component<Props> = (props) => {
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [isExiting, setIsExiting] = createSignal(false);

  onMount(() => {
    setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setCurrentIndex((i) => (i + 1) % props.words.length);
        setIsExiting(false);
      }, 200); // half the transition duration for crossfade feel
    }, props.intervalMs ?? 1500);
  });

  return (
    <span class="relative inline-block align-bottom">
      <span
        class="transition-all duration-400 ease-out"
        style={{
          opacity: isExiting() ? 0 : 1,
          transform: isExiting() ? "translateY(-8px)" : "translateY(0)",
          display: "inline-block",
        }}
      >
        {props.words[currentIndex()]}
      </span>
    </span>
  );
};
