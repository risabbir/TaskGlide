
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
  const { dispatch } = useKanban();
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { state: kanbanState } = useKanban();
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

  const navItems = [
    { href: "/", label: "Board", icon: Home, isActive: pathname === "/" },
    { action: handleToggleFilterSidebar, label: "Filters", icon: SlidersHorizontal, isActive: kanbanState.isFilterSidebarOpen },
    { action: handleOpenNewTaskModal, label: "Add Task", icon: PlusCircle, isCentral: true },
    { action: () => setIsSearchModalOpen(true), label: "Search", icon: Search, isActive: isSearchModalOpen },
  ];

  // Add Profile/Login item conditionally
  if (authLoading) {
    // Optionally show a placeholder or skip during auth loading
  } else if (user) {
    navItems.push({ href: "/profile", label: "Profile", icon: UserCircle2, isActive: pathname === "/profile" });
  } else {
    navItems.push({ href: "/auth/signin", label: "Sign In", icon: LogIn, isActive: pathname === "/auth/signin" });
  }


  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <nav className="flex h-full items-center justify-around px-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const commonButtonClasses = "flex flex-col items-center justify-center h-full w-full rounded-none text-xs";
            const activeClasses = item.isActive ? "text-primary" : "text-muted-foreground";

            if (item.isCentral) {
              return (
                <Button
                  key={item.label}
                  variant="ghost"
                  className={cn(commonButtonClasses, "relative -top-3 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90")}
                  onClick={item.action}
                  aria-label={item.label}
                >
                  <Icon className="h-7 w-7" />
                </Button>
              );
            }
            
            const buttonContent = (
                <>
                  <Icon className={cn("h-5 w-5 mb-0.5", item.isActive && "text-primary")} />
                  <span className={cn("text-[10px] leading-tight", item.isActive && "text-primary font-medium")}>{item.label}</span>
                </>
            );

            if (item.href) {
              return (
                <Link key={item.label} href={item.href} passHref legacyBehavior>
                  <Button
                    variant="ghost"
                    className={cn(commonButtonClasses, activeClasses)}
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
                className={cn(commonButtonClasses, activeClasses)}
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
                    dispatch({ type: "SET_FILTERS", payload: { searchTerm: "" } });
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
