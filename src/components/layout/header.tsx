
"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Search, LayoutDashboard, XCircle, PlusCircle, LogOut, UserCircle2, SlidersHorizontal, User as GuestIcon, LogIn } from "lucide-react"; 
import { useKanban } from "@/lib/store";
import React, { useState, useEffect, type ReactNode, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { APP_NAME } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

interface HeaderProps {
  children?: ReactNode; 
}

export function Header({ children }: HeaderProps) {
  const { dispatch, state } = useKanban();
  const { filters } = state;
  const { user, signOut, loading: authLoading, guestId, isGuest } = useAuth();
  
  const [desktopSearchTerm, setDesktopSearchTerm] = useState(filters.searchTerm ?? "");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState(filters.searchTerm ?? "");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (filters.searchTerm !== desktopSearchTerm) {
      setDesktopSearchTerm(filters.searchTerm ?? "");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.searchTerm]);

  useEffect(() => {
    if (isSearchModalOpen) {
      if (filters.searchTerm !== modalSearchTerm) {
        setModalSearchTerm(filters.searchTerm ?? "");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.searchTerm, isSearchModalOpen]);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      if (desktopSearchTerm !== filters.searchTerm) {
        dispatch({ type: "SET_FILTERS", payload: { searchTerm: desktopSearchTerm } });
      }
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktopSearchTerm, dispatch]);


  const handleDesktopSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDesktopSearchTerm(event.target.value);
  };

  const clearDesktopSearch = () => {
    setDesktopSearchTerm(""); 
    dispatch({ type: "SET_FILTERS", payload: { searchTerm: "" } }); 
    if (debounceTimeoutRef.current) { 
      clearTimeout(debounceTimeoutRef.current);
    }
  };

  const handleModalSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setModalSearchTerm(event.target.value);
  };
  
  const handleModalSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (debounceTimeoutRef.current) { 
      clearTimeout(debounceTimeoutRef.current);
    }
    if (modalSearchTerm !== filters.searchTerm) {
      dispatch({ type: "SET_FILTERS", payload: { searchTerm: modalSearchTerm } });
    }
    setIsSearchModalOpen(false);
  };
  
  const handleOpenNewTaskModal = () => {
    dispatch({ type: "OPEN_TASK_MODAL", payload: null });
  };

  const toggleFilterSidebar = () => {
    dispatch({ type: "TOGGLE_FILTER_SIDEBAR" });
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    }
    if (email) {
        const parts = email.split("@")[0];
        if (parts) {
            return parts.substring(0, 2).toUpperCase();
        }
        return email.substring(0,1).toUpperCase();
    }
    return "G"; // Guest User fallback
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 shadow-sm">
        <div className="container px-2 sm:px-4 flex h-16 items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-2 group">
              <LayoutDashboard className="h-7 w-7 text-primary transition-transform group-hover:rotate-[-5deg] group-hover:scale-105" />
              <span className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">{APP_NAME}</span>
            </Link>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="relative hidden md:flex flex-grow max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="pl-10 pr-8 h-9 w-full rounded-lg text-sm"
              value={desktopSearchTerm}
              onChange={handleDesktopSearchChange}
            />
            {desktopSearchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                onClick={clearDesktopSearch}
                aria-label="Clear search"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </form>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button variant="ghost" size="icon" onClick={() => {
                setModalSearchTerm(filters.searchTerm ?? ""); 
                setIsSearchModalOpen(true);
            }} className="md:hidden h-9 w-9 text-muted-foreground hover:text-primary">
                <Search className="h-5 w-5" />
                <span className="sr-only">Search Tasks</span>
            </Button>
            
            <Button size="sm" onClick={handleOpenNewTaskModal} className="px-2.5 sm:px-3 hidden md:inline-flex text-sm">
              <PlusCircle className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">New Task</span>
            </Button>
            
            <Button variant="outline" size="icon" className="h-9 w-9 hidden md:inline-flex text-muted-foreground hover:text-primary hover:border-primary/50" onClick={toggleFilterSidebar}>
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only">Filters & Sort</span>
            </Button>
            
            <ThemeToggle />

            <div className="flex items-center">
              {authLoading ? (
                <Skeleton className="h-9 w-9 rounded-full" />
              ) : user ? (
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                      <Avatar className="h-8 w-8 border-2 border-primary/30 hover:border-primary transition-colors">
                         <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
                         <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">{getInitials(user.displayName, user.email)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate">{user.displayName || user.email || "User"}</p>
                        {user.displayName && <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <UserCircle2 className="mr-2 h-4 w-4" />
                        Profile & Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : isGuest && guestId ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                      <Avatar className="h-8 w-8 border-2 border-muted hover:border-primary/50 transition-colors">
                         <AvatarFallback className="bg-muted text-muted-foreground"><GuestIcon className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-60" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Guest Session</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          ID: {guestId}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <UserCircle2 className="mr-2 h-4 w-4" />
                        Guest Info & Options
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="p-1 space-y-1">
                        <Button asChild size="sm" className="w-full justify-start text-sm">
                           <Link href="/auth/signup">
                                <PlusCircle className="mr-2 h-4 w-4" /> Sign Up to Save Data
                           </Link>
                        </Button>
                        <Button variant="outline" asChild size="sm" className="w-full justify-start text-sm">
                           <Link href="/auth/signin">
                                <LogIn className="mr-2 h-4 w-4" /> Log In to Existing Account
                           </Link>
                        </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" asChild className="px-2 sm:px-3 text-sm">
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button size="sm" asChild className="px-2 sm:px-3 text-sm">
                    <Link href="/auth/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <Dialog open={isSearchModalOpen} onOpenChange={setIsSearchModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Tasks</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleModalSearchSubmit} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tasks..."
                className="pl-10 h-10 w-full text-base rounded-md"
                value={modalSearchTerm}
                onChange={handleModalSearchChange}
                autoFocus
              />
              {modalSearchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    setModalSearchTerm(""); 
                    dispatch({ type: "SET_FILTERS", payload: { searchTerm: "" } });
                  }}
                  aria-label="Clear search"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
            <DialogFooter className="sm:justify-end gap-2">
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
