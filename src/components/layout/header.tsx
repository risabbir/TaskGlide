
"use client";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Search, SlidersHorizontal, LayoutDashboard, XCircle, PlusCircle } from "lucide-react";
import { useKanban } from "@/lib/store";
import React, { useState, useEffect, type ReactNode, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface HeaderProps {
  children?: ReactNode; // To accept the SheetTrigger for mobile filter
}

export function Header({ children }: HeaderProps) {
  const { dispatch, state } = useKanban();
  const filters = state.filters;
  
  const [desktopSearchTerm, setDesktopSearchTerm] = useState(filters?.searchTerm ?? "");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState(filters?.searchTerm ?? "");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local search terms if global filter changes (e.g., cleared by "Clear All Filters")
  useEffect(() => {
    if (filters?.searchTerm !== desktopSearchTerm) {
      setDesktopSearchTerm(filters?.searchTerm ?? "");
    }
    if (isSearchModalOpen && filters?.searchTerm !== modalSearchTerm) {
        setModalSearchTerm(filters?.searchTerm ?? "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.searchTerm, isSearchModalOpen]);


  // Debounced search for desktop
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      // Only dispatch if the term has actually changed from the global state
      if (desktopSearchTerm !== filters.searchTerm) {
        dispatch({ type: "SET_FILTERS", payload: { searchTerm: desktopSearchTerm } });
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [desktopSearchTerm, dispatch, filters.searchTerm]);

  // Debounced search for mobile modal
  useEffect(() => {
    if (!isSearchModalOpen) return; // Only apply when modal is open

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    // For modal, we might dispatch more directly on button click or on change if preferred.
    // Here, we'll also debounce typing in modal. The "Search" button will do an immediate dispatch.
    debounceTimeoutRef.current = setTimeout(() => {
       if (modalSearchTerm !== filters.searchTerm) {
        // This will update filters as user types in modal (debounced)
        // dispatch({ type: "SET_FILTERS", payload: { searchTerm: modalSearchTerm } });
       }
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [modalSearchTerm, dispatch, filters.searchTerm, isSearchModalOpen]);


  const handleDesktopSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDesktopSearchTerm(event.target.value);
  };

  const clearDesktopSearch = () => {
    setDesktopSearchTerm("");
    dispatch({ type: "SET_FILTERS", payload: { searchTerm: "" } });
  };

  const handleModalSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModalSearchTerm(event.target.value);
  };
  
  // Mobile modal search button explicitly dispatches and closes
  const handleModalSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (debounceTimeoutRef.current) { // Clear any pending debounce from typing
      clearTimeout(debounceTimeoutRef.current);
    }
    dispatch({ type: "SET_FILTERS", payload: { searchTerm: modalSearchTerm } });
    setIsSearchModalOpen(false);
  };
  
  const handleOpenNewTaskModal = () => {
    dispatch({ type: "OPEN_TASK_MODAL", payload: null });
  };

  const toggleFilterSidebar = () => {
    dispatch({ type: "TOGGLE_FILTER_SIDEBAR" });
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 flex h-16 items-center justify-between gap-1 sm:gap-2"> {/* Added px-4 here */}
          {/* Logo & Name - Left Aligned */}
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center space-x-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <span className="hidden sm:inline-block font-bold text-lg">{APP_NAME}</span>
            </a>
          </div>

          {/* Desktop Search Input - Center, Flexible Width */}
          <form onSubmit={(e) => e.preventDefault()} className="relative hidden md:flex flex-grow max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="pl-8 pr-8 h-9 w-full"
              value={desktopSearchTerm}
              onChange={handleDesktopSearchChange}
            />
            {desktopSearchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={clearDesktopSearch}
              >
                <XCircle className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </form>

          {/* Action Buttons - Right Aligned */}
          <div className="flex items-center space-x-1">
            {/* Mobile Search Trigger */}
            <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden" onClick={() => {
              setModalSearchTerm(filters.searchTerm ?? ""); // Sync before opening
              setIsSearchModalOpen(true);
            }}>
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>

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

      {/* Mobile Search Modal */}
      <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Tasks</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleModalSearchSubmit} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by title, description, tags..."
                className="pl-8 h-10 w-full"
                value={modalSearchTerm}
                onChange={handleModalSearchChange}
                autoFocus
              />
              {modalSearchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => {
                    setModalSearchTerm(""); 
                    // Optionally dispatch clear immediately for modal
                    // dispatch({ type: "SET_FILTERS", payload: { searchTerm: "" } });
                  }}
                >
                  <XCircle className="h-4 w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
            <DialogFooter className="sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Search</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
