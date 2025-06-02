
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, SlidersHorizontal, Plus, Search, UserCircle2, LogIn } from "lucide-react";
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
  } else if (user) {
    navItems.push({ href: "/profile", label: "Profile", icon: UserCircle2, isActiveOverride: pathname === "/profile" });
  } else {
    navItems.push({ href: "/auth/signin", label: "Sign In", icon: LogIn, isActiveOverride: pathname.startsWith("/auth/") });
  }


  return (
    <>
      <div className="fixed md:hidden bottom-3 left-3 right-3 z-40 h-16 rounded-2xl bg-background/80 backdrop-blur-md shadow-lg border">
        <nav className="flex h-full items-center justify-around px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = !!item.isActiveOverride;

            if (item.isCentral) {
              return (
                <Button
                  key={item.label}
                  variant="default"
                  className={cn(
                    "relative -top-3.5 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center",
                    "transition-all duration-200 ease-in-out hover:bg-primary/90 active:bg-primary/80 transform hover:scale-105 active:scale-95",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                  onClick={item.action}
                  aria-label={item.label}
                >
                  <Icon className="h-7 w-7" />
                </Button>
              );
            }
            
            const itemWrapperClasses = cn(
              "group flex flex-col items-center justify-center h-full w-full p-1 rounded-lg", 
              "transition-all duration-150 ease-in-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-background",
              isActive ? "bg-primary/10" : "hover:bg-muted/20 active:bg-muted/30 active:scale-95"
            );

            const iconClasses = cn(
                "h-5 w-5 mb-0.5 transition-all duration-150 ease-in-out group-hover:scale-110",
                isActive ? "text-primary scale-105" : "text-muted-foreground group-hover:text-primary/90"
            );
            
            const labelClasses = cn(
                "text-[11px] leading-tight tracking-tight transition-colors duration-150 ease-in-out",
                isActive ? "text-primary font-semibold" : "text-muted-foreground group-hover:text-primary/90"
            );

            const buttonContent = (
              <>
                <Icon className={iconClasses} />
                <span className={labelClasses}>{item.label}</span>
              </>
            );


            if (item.href) {
              return (
                <Link key={item.label} href={item.href} passHref legacyBehavior>
                  <Button
                    as="a" 
                    variant="ghost" 
                    className={itemWrapperClasses}
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
                variant="ghost" 
                className={itemWrapperClasses}
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
