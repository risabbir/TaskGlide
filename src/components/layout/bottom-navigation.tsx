
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, SlidersHorizontal, User as ProfileIcon, LogIn, XCircle } from "lucide-react";
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
  className?: string;
  disabled?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ href, action, icon: Icon, label, isActive, className, disabled = false }) => {
  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 w-full h-full rounded-lg transition-colors duration-200",
        isActive ? "text-primary" : "text-muted-foreground",
        !isActive && !disabled && "hover:text-primary",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
      <span className={cn("text-xs", isActive && "font-bold")}>{label}</span>
    </div>
  );

  if (disabled) {
    return <div className="flex-1 h-full">{content}</div>;
  }

  const buttonContent = <button className="w-full h-full">{content}</button>;

  if (href) {
    return (
      <Link href={href} legacyBehavior>
        <a onClick={action} className="flex-1 h-full">{buttonContent}</a>
      </Link>
    );
  }
  return <div onClick={action} className="flex-1 h-full">{buttonContent}</div>;
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

  return (
    <>
      <div className="md:hidden fixed bottom-4 left-4 right-4 h-[72px] z-40 pointer-events-none">
        
        {/* Floating Navigation Bar */}
        <div className="relative h-full w-full pointer-events-auto bg-background/80 backdrop-blur-lg rounded-2xl border border-border/80 shadow-lg">
          <nav className="flex h-full items-center justify-around">
            {/* Left Side Items */}
            <div className="flex items-center justify-around w-full h-full">
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
            <div className="w-[88px] shrink-0"></div>

            {/* Right Side Items */}
            <div className="flex items-center justify-around w-full h-full">
              <NavLink
                action={toggleFilterSidebar}
                icon={SlidersHorizontal}
                label="Filter"
                isActive={kanbanState.isFilterSidebarOpen}
              />
              
              {authLoading ? (
                 <div className="flex flex-1 h-full flex-col items-center justify-center gap-1 w-16 text-muted-foreground/50">
                    <ProfileIcon className="h-6 w-6" />
                    <span className="text-xs">Profile</span>
                 </div>
              ) : isGuest ? (
                 <NavLink
                  href="/profile"
                  icon={ProfileIcon}
                  label="Profile"
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
        
        {/* Notch for the central button */}
        <div
          className="absolute left-1/2 top-0 h-[34px] w-[88px] -translate-x-1/2 transform"
          style={{ clipPath: 'path("M 0 34 C 4.5 34 4.5 0 8 0 L 80 0 C 83.5 0 83.5 34 88 34 L 0 34 Z")' }}
        >
          <div className="h-full w-full bg-background" />
        </div>

        {/* Raised Central Button */}
        <div className="absolute left-1/2 top-[-28px] -translate-x-1/2 transform">
          <Button
            onClick={handleOpenNewTaskModal}
            className="h-[64px] w-[64px] rounded-full shadow-lg"
            aria-label="Add new task"
          >
            <Plus className="h-9 w-9 text-primary-foreground" />
          </Button>
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
