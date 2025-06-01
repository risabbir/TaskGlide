
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/use-local-storage";

export function ThemeToggle() {
  // useLocalStorage initializes theme to "light", then its useEffect updates from localStorage if "theme" exists.
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");

  // This useEffect runs once on the client after mount.
  // It sets the theme based on system preference ONLY if no theme is already stored in localStorage.
  React.useEffect(() => {
    const storedUserPreference = window.localStorage.getItem("theme");
    if (!storedUserPreference) { // No user preference explicitly stored yet
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      // setTheme updates the state, and useLocalStorage persists this derived preference.
      setTheme(systemPrefersDark ? "dark" : "light");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  // This useEffect applies the current theme (from state) to the document.
  // It runs whenever the 'theme' state changes.
  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    // 'theme' is guaranteed to be "light" or "dark" by useLocalStorage and the logic above.
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
