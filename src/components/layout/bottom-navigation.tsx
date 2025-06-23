
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, SlidersHorizontal, Plus, Search, User as GuestIcon, LogIn, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKanban } from "@/lib/store";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useRef } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function BottomNavigation() {
  const { dispatch, state: kanbanState } = useKanban();
  const { isGuest, loading: authLoading } = useAuth();
  const pathname = usePathname();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const filters = kanbanState.filters;

  useEffect(() => {
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
  
  const handleModalSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    dispatch({ type: "SET_FILTERS", payload: { searchTerm: modalSearchTerm } });
    setIsSearchModalOpen(false);
  };

  const navItemsBase = [
    { href: "/", label: "Board", icon: Home, isActiveOverride: pathname === "/" },
    { action: handleToggleFilterSidebar, label: "Filters", icon: SlidersHorizontal, isActiveOverride: kanbanState.isFilterSidebarOpen },
    { action: handleOpenNewTaskModal, label: "Add Task", icon: Plus, isCentral: true, isActiveOverride: false },
    { 
      action: () => {
        setModalSearchTerm(filters.searchTerm ?? ""); 
        setIsSearchModalOpen(true);
      }, 
      label: "Search", 
      icon: Search, 
      isActiveOverride: isSearchModalOpen || (!!filters.searchTerm && filters.searchTerm.length > 0) 
    },
  ];

  let navItems = [...navItemsBase];
  if (authLoading) {
    // Placeholder for loading state if needed
  } else if (isGuest) { // Always show Guest/Profile icon if guest mode is active or potentially active
    navItems.push({ href: "/profile", label: "Guest", icon: GuestIcon, isActiveOverride: pathname === "/profile" });
  } else { // If not loading and not a guest (e.g. no guestId yet), link to sign-in to start guest session
    navItems.push({ href: "/auth/signin", label: "Start", icon: LogIn, isActiveOverride: pathname.startsWith("/auth") });
  }


  return (
    <>
      <TooltipProvider delayDuration={0}>
        <div className="fixed md:hidden bottom-4 inset-x-0 z-40 w-auto mx-auto">
          <nav className="flex h-14 items-center justify-center gap-2 rounded-full bg-background/80 backdrop-blur-md shadow-lg border p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const label = item.label;
              
              let isActive = item.isActiveOverride;
              if (item.isActiveOverride === undefined && item.href && !item.isCentral) {
                  isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              }

              const buttonProps = {
                variant: isActive ? "secondary" : item.isCentral ? "default" : "ghost" as any,
                size: "icon" as any,
                className: cn(
                  "rounded-full h-10 w-10 transition-all duration-300",
                  isActive && "text-primary shadow-inner scale-110",
                  item.isCentral && "h-11 w-11 text-primary-foreground hover:bg-primary/90 scale-110 shadow-md",
                  !isActive && !item.isCentral && "text-muted-foreground"
                ),
                'aria-label': label,
              };

              const iconProps = {
                className: cn("h-5 w-5", item.isCentral && "h-6 w-6")
              };

              const buttonContent = (
                <Button {...buttonProps} onClick={item.href ? undefined : item.action}>
                  <Icon {...iconProps} />
                </Button>
              );

              return (
                <Tooltip key={label}>
                  <TooltipTrigger asChild>
                    {item.href ? <Link href={item.href}>{buttonContent}</Link> : buttonContent}
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={10}>
                    <p>{label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </div>
      </TooltipProvider>

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
                placeholder="Search tasks..."
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
