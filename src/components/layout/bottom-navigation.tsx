
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, SlidersHorizontal, PlusCircle, Search, UserCircle2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKanban } from "@/lib/store";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { XCircle } from "lucide-react";

export function BottomNavigation() {
  const { dispatch, state: kanbanState } = useKanban();
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Not currently used for submit, but good for live search

  const filters = kanbanState.filters;
   
  useEffect(() => {
    // Sync modal search term if filter search term changes externally while modal is open
    if (isSearchModalOpen && filters?.searchTerm !== modalSearchTerm) {
        setModalSearchTerm(filters?.searchTerm ?? "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.searchTerm, isSearchModalOpen]);


  const handleOpenNewTaskModal = () => {
    dispatch({ type: "OPEN_TASK_MODAL", payload: null });
  };

  const handleToggleFilterSidebar = () => {
    dispatch({ type: "TOGGLE_FILTER_SIDEBAR" });
  };

  const handleModalSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModalSearchTerm(event.target.value);
  };
  
  // This function now directly applies the search and closes the modal.
  const handleModalSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (debounceTimeoutRef.current) { // Clear any pending debounce if form is submitted manually
      clearTimeout(debounceTimeoutRef.current);
    }
    dispatch({ type: "SET_FILTERS", payload: { searchTerm: modalSearchTerm } });
    setIsSearchModalOpen(false); // Close modal on submit
  };

  const navItemsBase = [
    { href: "/", label: "Board", icon: Home, isActiveOverride: pathname === "/" },
    { action: handleToggleFilterSidebar, label: "Filters", icon: SlidersHorizontal, isActiveOverride: kanbanState.isFilterSidebarOpen },
    { action: handleOpenNewTaskModal, label: "Add Task", icon: PlusCircle, isCentral: true, isActiveOverride: false }, // Central button isn't "active" in the same way
    { 
      action: () => {
        setModalSearchTerm(filters.searchTerm ?? ""); // Initialize modal with current search term
        setIsSearchModalOpen(true);
      }, 
      label: "Search", 
      icon: Search, 
      isActiveOverride: isSearchModalOpen || (!!filters.searchTerm && filters.searchTerm.length > 0) // Active if modal open OR if a search term exists
    },
  ];

  let navItems = [...navItemsBase];
  if (authLoading) {
    // Optionally show a loading indicator or skeleton item
  } else if (user) {
    navItems.push({ href: "/profile", label: "Profile", icon: UserCircle2, isActiveOverride: pathname === "/profile" });
  } else {
    navItems.push({ href: "/auth/signin", label: "Sign In", icon: LogIn, isActiveOverride: pathname.startsWith("/auth/") });
  }


  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <nav className="flex h-full items-center justify-around px-1 sm:px-2 gap-0.5 sm:gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = !!item.isActiveOverride;

            const buttonContent = (
              <>
                <Icon className={cn(
                  "h-5 w-5 mb-0.5",
                  "transition-transform duration-200 ease-in-out",
                  isActive && !item.isCentral && "scale-110 text-primary" // Scale active icon and make it primary color
                )} />
                <span className={cn(
                  "text-[10px] leading-tight tracking-tight", // Added tracking-tight for better fit
                  isActive && !item.isCentral && "font-semibold text-primary" // Bold active label and make it primary
                )}>{item.label}</span>
              </>
            );
            
            const centralButtonContent = <Icon className="h-7 w-7" />;


            if (item.isCentral) {
              return (
                <Button
                  key={item.label}
                  variant="ghost" // Ghost variant to remove default button background
                  className={cn(
                    "flex flex-col items-center justify-center text-xs p-0", // Remove padding, text-xs for consistency if label was shown
                    "relative -top-3 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg",
                    "transition-all duration-200 ease-in-out hover:bg-primary/90 active:bg-primary/80 transform hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                  onClick={item.action}
                  aria-label={item.label}
                >
                  {centralButtonContent}
                </Button>
              );
            }
            
            const baseItemClasses = "flex flex-col items-center justify-center h-full w-full text-xs p-0.5 sm:p-1 rounded-md"; // Adjusted padding
            const transitionClasses = "transition-all duration-200 ease-in-out";
            const interactionClasses = "active:scale-90"; 

            // More distinct active state for non-central items
            const activeStateClasses = isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent/50";

            if (item.href) {
              return (
                <Link key={item.label} href={item.href} passHref legacyBehavior>
                  <Button
                    as="a" 
                    variant="ghost" // Use ghost for consistent background behavior
                    className={cn(baseItemClasses, transitionClasses, interactionClasses, activeStateClasses)}
                    aria-label={item.label}
                  >
                    {buttonContent}
                  </Button>
                </Link>
              );
            }

            return (
              <Button
                key={item.label}
                variant="ghost" // Use ghost for consistent background behavior
                className={cn(baseItemClasses, transitionClasses, interactionClasses, activeStateClasses)}
                onClick={item.action}
                aria-label={item.label}
              >
                {buttonContent}
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Search Modal for Bottom Navigation */}
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
                    // Optionally dispatch clear search here if desired for immediate effect,
                    // or let submit handle it. For now, only clears modal input.
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
