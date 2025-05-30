
"use client";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Search, SlidersHorizontal, LayoutDashboard, XCircle, PlusCircle, Sparkles } from "lucide-react";
import { useKanban } from "@/lib/store";
import React, { useState, useEffect, type ReactNode } from "react";

interface HeaderProps {
  children?: ReactNode; // To accept the SheetTrigger for mobile filter
}

export function Header({ children }: HeaderProps) {
  const { dispatch, state } = useKanban();
  const filters = state.filters;
  const [searchTerm, setSearchTerm] = useState(filters?.searchTerm ?? "");

  useEffect(() => {
    if (filters?.searchTerm !== searchTerm) {
      setSearchTerm(filters?.searchTerm ?? "");
    }
  }, [filters?.searchTerm, searchTerm]);

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

  const handleOpenNewTaskModal = () => {
    dispatch({ type: "OPEN_TASK_MODAL", payload: null });
  };

  const toggleFilterSidebar = () => {
    dispatch({ type: "TOGGLE_FILTER_SIDEBAR" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-1 sm:gap-2">
        {/* Logo & Name - Left Aligned */}
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center space-x-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline-block font-bold text-lg">{APP_NAME}</span>
          </a>
        </div>

        {/* Search Input - Center, Flexible Width */}
        <form onSubmit={handleSearchSubmit} className="relative flex-grow max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-8 pr-8 h-9 w-full" // Ensure input is full width of its parent form
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

        {/* Action Buttons - Right Aligned */}
        <div className="flex items-center space-x-1">
          <Button size="sm" onClick={handleOpenNewTaskModal} className="px-2 sm:px-3">
            <PlusCircle className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">New Task</span>
          </Button>
          
          {/* Desktop Filter Trigger */}
          <Button variant="outline" size="icon" className="h-9 w-9 hidden md:inline-flex" onClick={toggleFilterSidebar}>
            <SlidersHorizontal className="h-4 w-4" />
            <span className="sr-only">Filters & Sort</span>
          </Button>
          {/* Mobile Filter Trigger (passed as child from page.tsx) */}
          {children} 
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
