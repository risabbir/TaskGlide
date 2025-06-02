
"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Search, LayoutDashboard, XCircle, PlusCircle, LogOut, UserCircle2, SlidersHorizontal } from "lucide-react"; 
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
import { LanguageSwitcher } from "./language-switcher"; // Added import
import { useTranslations } from "next-intl"; // Added import

interface HeaderProps {
  children?: ReactNode; 
}

export function Header({ children }: HeaderProps) {
  const t = useTranslations('Header'); // Initialize translation hook
  const tApp = useTranslations('App');
  const { dispatch, state } = useKanban();
  const filters = state.filters;
  const { user, signOut, loading: authLoading } = useAuth();
  
  const [desktopSearchTerm, setDesktopSearchTerm] = useState(filters?.searchTerm ?? "");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [modalSearchTerm, setModalSearchTerm] = useState(filters?.searchTerm ?? "");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (filters?.searchTerm !== desktopSearchTerm) {
      setDesktopSearchTerm(filters?.searchTerm ?? "");
    }
    if (isSearchModalOpen && filters?.searchTerm !== modalSearchTerm) {
        setModalSearchTerm(filters?.searchTerm ?? "");
    }
  }, [filters?.searchTerm, isSearchModalOpen, desktopSearchTerm]);


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
  }, [desktopSearchTerm, dispatch, filters.searchTerm]);

  useEffect(() => {
    if (!isSearchModalOpen) return; 

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
       if (modalSearchTerm !== filters.searchTerm) {
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
  
  const handleModalSearchSubmit = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (debounceTimeoutRef.current) { 
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
    return "??";
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-2 sm:px-4 flex h-16 items-center justify-between gap-1 sm:gap-2">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center space-x-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <span className="hidden sm:inline-block font-bold text-lg">{tApp('name')}</span>
            </Link>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="relative hidden md:flex flex-grow max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('searchTasks')}
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

          <div className="flex items-center space-x-1">
            <Button size="sm" onClick={handleOpenNewTaskModal} className="px-2 sm:px-3 hidden md:inline-flex">
              <PlusCircle className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">{t('newTask')}</span>
            </Button>
            
            <Button variant="outline" size="icon" className="h-9 w-9 hidden md:inline-flex" onClick={toggleFilterSidebar}>
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only">{t('filtersSort')}</span>
            </Button>
            
            <ThemeToggle />
            <LanguageSwitcher /> 

            <div className="hidden md:flex items-center space-x-1">
              {!authLoading && user ? (
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-8 w-8">
                         <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} />
                         <AvatarFallback>{getInitials(user.displayName, user.email)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <UserCircle2 className="mr-2 h-4 w-4" />
                        {t('profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {t('signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : !authLoading && (
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" asChild className="px-2 sm:px-3">
                    <Link href="/auth/signin">{t('signIn')}</Link>
                  </Button>
                  <Button size="sm" asChild className="px-2 sm:px-3">
                    <Link href="/auth/signup">{t('signUp')}</Link>
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
            <DialogTitle>{t('searchTasks')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleModalSearchSubmit} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t('searchTasks')}
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
