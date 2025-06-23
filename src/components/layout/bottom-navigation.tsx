
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, SlidersHorizontal, Plus, Search, User as GuestIcon, LogIn, XCircle } from "lucide-react";
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

// NavLink component for individual items
interface NavLinkProps {
  href?: string;
  action?: () => void;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ href, action, icon: Icon, label, isActive }) => {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-lg transition-colors duration-200",
        isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
      )}
    >
      <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
      <span className={cn("text-xs", isActive && "font-bold")}>{label}</span>
    </div>
  );

  const buttonContent = <button className="w-full h-full">{content}</button>;

  if (href) {
    return (
      <Link href={href} legacyBehavior>
        <a onClick={action}>{buttonContent}</a>
      </Link>
    );
  }
  return <div onClick={action}>{buttonContent}</div>;
};


export function BottomNavigation() {
  const { dispatch, state: kanbanState } = useKanban();
  const { isGuest, loading: authLoading } = useAuth();
  const pathname = usePathname();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState("");

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
    dispatch({ type: "SET_FILTERS", payload: { searchTerm: modalSearchTerm } });
    setIsSearchModalOpen(false);
  };

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-transparent z-40">
        {/* Raised Central Button */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <Button
            onClick={handleOpenNewTaskModal}
            className="h-20 w-20 rounded-full shadow-lg"
            aria-label="Add new task"
          >
            <Plus className="h-14 w-14" />
          </Button>
        </div>
        
        {/* Navigation Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[72px] bg-background/90 backdrop-blur-lg border-t border-border/80 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
          <nav className="flex h-full items-center justify-around">
            {/* Left Side Items */}
            <div className="flex items-center justify-around w-full">
              <NavLink
                href="/"
                icon={Home}
                label="Board"
                isActive={pathname === "/"}
              />
              <NavLink
                action={() => setIsSearchModalOpen(true)}
                icon={Search}
                label="Search"
                isActive={isSearchModalOpen || (!!filters.searchTerm && filters.searchTerm.length > 0)}
              />
            </div>

            {/* Spacer for central button */}
            <div className="w-24 shrink-0"></div>

            {/* Right Side Items */}
            <div className="flex items-center justify-around w-full">
              <NavLink
                action={handleToggleFilterSidebar}
                icon={SlidersHorizontal}
                label="Filters"
                isActive={kanbanState.isFilterSidebarOpen}
              />
              
              {authLoading ? (
                 <div className="flex flex-col items-center justify-center gap-1 w-16 h-14 text-muted-foreground/50">
                    <GuestIcon className="h-6 w-6" />
                    <span className="text-xs">Guest</span>
                 </div>
              ) : isGuest ? (
                 <NavLink
                  href="/profile"
                  icon={GuestIcon}
                  label="Guest"
                  isActive={pathname === "/profile"}
                />
              ) : (
                <NavLink
                  href="/auth/signin"
                  icon={LogIn}
                  label="Start"
                  isActive={pathname.startsWith("/auth")}
                />
              )}
            </div>
          </nav>
        </div>
      </div>

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
