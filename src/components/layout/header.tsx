
"use client";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Search, SlidersHorizontal, LayoutDashboard, XCircle, PlusCircle } from "lucide-react";
import { useKanban } from "@/lib/store";
import React, { useState, useEffect } from "react";

export function Header() {
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

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Name - Left Aligned */}
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center space-x-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline-block font-bold text-lg">{APP_NAME}</span>
          </a>
        </div>

        {/* Search Input - Center, Flexible Width */}
        <form onSubmit={handleSearchSubmit} className="relative flex-grow max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-8 pr-8 h-9 w-full"
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
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Button size="sm" onClick={handleOpenNewTaskModal} className="px-2 sm:px-3">
            <PlusCircle className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">New Task</span>
          </Button>
          
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only">Filters & Sort</span>
            </Button>
          </SheetTrigger>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
