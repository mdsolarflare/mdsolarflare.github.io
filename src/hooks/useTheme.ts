import { createSignal, onMount } from "solid-js";

type Theme = "light" | "dark";

/**
 * Detects the user's preferred color scheme.
 * Returns null if no preference is set (browser default).
 */
function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Theme hook with localStorage persistence and system preference detection.
 * Priority: localStorage override > system preference
 */
export function useTheme() {
  const [theme, setTheme] = createSignal<Theme>("light");

  onMount(() => {
    // Check for saved preference first
    const saved = localStorage.getItem("theme") as Theme | null;

    if (saved && (saved === "light" || saved === "dark")) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      // Fall back to system preference
      const system = getSystemTheme();
      setTheme(system);
      document.documentElement.setAttribute("data-theme", system);
    }

    // Listen for system theme changes (only if no manual override)
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (!localStorage.getItem("theme")) {
        const newTheme = getSystemTheme();
        setTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
      }
    };
    mq.addEventListener("change", handler);

    return () => mq.removeEventListener("change", handler);
  });

  const toggle = () => {
    const next = theme() === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  return [theme, toggle] as const;
}
