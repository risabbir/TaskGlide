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
    <div className="fixed bottom-20 right-5 z-50 md:bottom-5">
      <Button
        variant="default"
        size="icon"
        onClick={scrollToTop}
        className={cn(
          "group h-12 w-12 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform",
          "bg-gradient-to-br from-primary/90 via-primary/80 to-primary/90 text-primary-foreground",
          "hover:scale-110 hover:shadow-xl hover:from-primary hover:to-primary/80",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
        )}
        aria-label="Go to top"
      >
        <ArrowUp className="h-6 w-6 transition-transform duration-300 group-hover:-translate-y-0.5" />
      </Button>
    </div>
  );
}
