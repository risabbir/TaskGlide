
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useKanban } from "@/lib/store";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, XCircle, LayoutGrid, SlidersHorizontal } from "lucide-react"; // For search modal

// NavItem component for individual items, handles Link vs Button
interface NavItemProps {
  href?: string;
  action?: () => void;
  children: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, action, children, label, isActive }) => {
  const commonClasses = cn(
    "flex flex-col items-center transition-colors duration-200 w-full",
    isActive ? "text-primary" : "text-muted-foreground",
    !isActive ? "hover:text-primary" : ""
  );

  const content = (
    <>
      {children}
      <span className="text-xs font-medium">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} legacyBehavior>
        <a className={commonClasses}>{content}</a>
      </Link>
    );
  }

  return (
    <button onClick={action} className={commonClasses}>
      {content}
    </button>
  );
};


export function BottomNavigation() {
  const { dispatch, state: kanbanState } = useKanban();
  const { isGuest } = useAuth();
  const pathname = usePathname();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState(kanbanState.filters?.searchTerm ?? "");
  
  useEffect(() => {
    if (kanbanState.filters?.searchTerm !== modalSearchTerm) {
      setModalSearchTerm(kanbanState.filters?.searchTerm ?? "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kanbanState.filters?.searchTerm]);

  const handleOpenNewTaskModal = () => {
    dispatch({ type: "OPEN_TASK_MODAL", payload: null });
  };

  const handleModalSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModalSearchTerm(event.target.value);
  };
  
  const handleModalSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    dispatch({ type: "SET_FILTERS", payload: { searchTerm: modalSearchTerm } });
    setIsSearchModalOpen(false);
  };

  const toggleFilterSidebar = () => {
    dispatch({ type: "TOGGLE_FILTER_SIDEBAR" });
  };
  
  // Hide bottom navigation on authentication pages
  if (pathname.includes("/auth/")) {
    return null;
  }
  
  return (
    <>
      {/* New Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl bg-background px-4 pt-3 pb-6 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] sm:hidden">
        <div className="relative grid grid-cols-5 items-center text-center max-w-md mx-auto">
          
          <NavItem href="/" label="Board" isActive={pathname === "/"}>
            <LayoutGrid className="w-6 h-6 mb-1" />
          </NavItem>

          <NavItem 
            action={() => setIsSearchModalOpen(true)} 
            label="Search" 
            isActive={isSearchModalOpen || (!!kanbanState.filters.searchTerm && kanbanState.filters.searchTerm.length > 0)}
          >
            <svg className="w-6 h-6 mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
            </svg>
          </NavItem>
          
          {/* Center Plus Button Placeholder & Button */}
          <div className="relative">
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
              <button
                onClick={handleOpenNewTaskModal}
                className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl flex items-center justify-center hover:bg-primary/90 transition"
                aria-label="Add new task"
              >
                <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>
          
          <NavItem 
            action={toggleFilterSidebar} 
            label="Filter" 
            isActive={kanbanState.isFilterSidebarOpen}
          >
            <SlidersHorizontal className="w-6 h-6 mb-1" />
          </NavItem>

          <NavItem href="/profile" label="Guest" isActive={pathname === "/profile"}>
            <svg className="w-6 h-6 mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a8.25 8.25 0 0115 0" />
            </svg>
          </NavItem>

        </div>
      </div>
      
      {/* Search Modal (remains unchanged) */}
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
