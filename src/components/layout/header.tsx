
"use client";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Search, SlidersHorizontal, LayoutDashboard, XCircle } from "lucide-react"; // Changed Sparkles to LayoutDashboard
import { useKanban } from "@/lib/store";
import React, { useState, useEffect } from "react";

export function Header() {
  const { dispatch, state: { filters } } = useKanban(); // Ensure state is destructured correctly
  const [searchTerm, setSearchTerm] = useState(filters?.searchTerm ?? "");

  useEffect(() => {
    if (filters?.searchTerm !== searchTerm) {
      setSearchTerm(filters?.searchTerm ?? "");
    }
  }, [filters?.searchTerm]); // Removed searchTerm from deps to avoid loop, it's updated by onChange

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: "SET_FILTERS", payload: { searchTerm } });
  };

  const clearSearch = () => {
    setSearchTerm("");
    dispatch({ type: "SET_FILTERS", payload: { searchTerm: "" } });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <a href="/" className="flex items-center space-x-2">
            <LayoutDashboard className="h-6 w-6 text-primary" /> {/* Changed Icon */}
            <span className="inline-block font-bold text-lg">{APP_NAME}</span>
          </a>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          {/* Removed "Suggest Focus Batch" button and its Dialog */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="pl-8 pr-8 h-9"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={clearSearch}
              >
                <XCircle className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </form>

          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters & Sort
            </Button>
          </SheetTrigger>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
