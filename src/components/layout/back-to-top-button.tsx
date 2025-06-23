"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
      <Button
        variant="outline"
        size="icon"
        onClick={scrollToTop}
        className={cn(
          "h-12 w-12 rounded-full shadow-lg transition-opacity duration-300 bg-background/80 hover:bg-accent/90 backdrop-blur-sm",
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        aria-label="Go to top"
      >
        <ArrowUp className="h-6 w-6" />
      </Button>
    </div>
  );
}
