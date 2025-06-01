
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";

export function ThemeToggle() {
  // 1. `theme` state from localStorage.
  //    - `useLocalStorage` initially sets `theme` to "light" for SSR and initial client render.
  //    - Its `useEffect` then loads from localStorage. If "theme" exists, `theme` state updates.
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");

  // 2. Effect to set initial theme based on system preference IF no theme was found in localStorage.
  //    This runs ONCE on the client after the component mounts.
  React.useEffect(() => {
    // Check if a theme preference was already loaded from localStorage by the useLocalStorage hook.
    // We do this by checking localStorage directly, as the `theme` state might still be the initial "light"
    // if `useLocalStorage`'s effect hasn't run yet OR if localStorage was indeed empty.
    const storedUserPreference = window.localStorage.getItem("theme");

    if (!storedUserPreference) { // No user preference explicitly stored in localStorage yet
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      // `setTheme` (from `useLocalStorage`) updates the `theme` state AND persists
      // this system-derived preference into localStorage for subsequent loads.
      setTheme(systemPrefersDark ? "dark" : "light");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount to initialize.

  // 3. Effect to apply the current theme (from `theme` state) to the document.
  //    This runs whenever the `theme` state changes (e.g., from toggle, or from initial load).
  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    // The `theme` state will be either "light" or "dark" after the above logic.
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
