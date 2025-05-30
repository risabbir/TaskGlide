
"use client";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Search, SlidersHorizontal, LayoutDashboard, XCircle, Sparkles } from "lucide-react";
import { useKanban } from "@/lib/store";
import React, { useState, useEffect } from "react";
import { FocusBatchModalContent } from "@/components/ai/focus-batch-modal"; // Placeholder modal content

export function Header() {
  const { dispatch, state: { filters } } = useKanban();
  const [searchTerm, setSearchTerm] = useState(filters?.searchTerm ?? "");
  const [isFocusBatchModalOpen, setIsFocusBatchModalOpen] = useState(false);

  useEffect(() => {
    if (filters?.searchTerm !== searchTerm) {
      setSearchTerm(filters?.searchTerm ?? "");
    }
  }, [filters?.searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch({ type: "SET_FILTERS", payload: { searchTerm } });
  };

  const clearSearch = () => {
    setSearchTerm("");
    dispatch({ type: "SET_FILTERS", payload: { searchTerm: "" } });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <a href="/" className="flex items-center space-x-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <span className="inline-block font-bold text-lg">{APP_NAME}</span>
          </a>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          <Dialog open={isFocusBatchModalOpen} onOpenChange={setIsFocusBatchModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="hidden md:inline-flex">
                <Sparkles className="mr-2 h-4 w-4" />
                Suggest Focus Batch
              </Button>
            </DialogTrigger>
            <FocusBatchModalContent onClose={() => setIsFocusBatchModalOpen(false)} />
          </Dialog>
          
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="pl-8 pr-8 h-9"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={clearSearch}
              >
                <XCircle className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </form>

          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters & Sort
            </Button>
          </SheetTrigger>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
