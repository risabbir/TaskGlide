
"use client";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogTrigger,
} from "@/components/ui/dialog";
import { SheetTrigger } from "@/components/ui/sheet"; // Keep SheetTrigger for FilterSidebar
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Search, SlidersHorizontal, LayoutDashboard, XCircle, Sparkles, PlusCircle } from "lucide-react";
import { useKanban } from "@/lib/store";
import React, { useState, useEffect } from "react";
import { FocusBatchModalContent } from "@/components/ai/focus-batch-modal"; 

export function Header() {
  const { dispatch, state: { filters } } = useKanban();
  const [searchTerm, setSearchTerm] = useState(filters?.searchTerm ?? "");
  const [isFocusBatchModalOpen, setIsFocusBatchModalOpen] = useState(false);

  useEffect(() => {
    if (filters?.searchTerm !== searchTerm) {
      setSearchTerm(filters?.searchTerm ?? "");
    }
  }, [filters?.searchTerm, searchTerm]);

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

  const handleOpenNewTaskModal = () => {
    dispatch({ type: "OPEN_TASK_MODAL", payload: null });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 md:gap-6"> {/* Adjusted gap */}
        {/* Logo & Name - Left Aligned */}
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center space-x-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <span className="inline-block font-bold text-lg">{APP_NAME}</span>
          </a>
        </div>

        {/* Search Input - Center, Flexible Width */}
        <form onSubmit={handleSearchSubmit} className="relative flex-grow max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"> {/* Responsive max-width */}
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-8 pr-8 h-9 w-full" // Ensure w-full for flex-grow
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

        {/* Action Buttons - Right Aligned */}
        <div className="flex items-center space-x-2">
          <Button size="sm" onClick={handleOpenNewTaskModal}> {/* Default (filled) style */}
            <PlusCircle className="mr-2 h-4 w-4" />
            New Task
          </Button>
          
          <Dialog open={isFocusBatchModalOpen} onOpenChange={setIsFocusBatchModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="sm:inline-flex"> {/* Changed from hidden md:inline-flex */}
                <Sparkles className="mr-2 h-4 w-4" />
                Focus Batch
              </Button>
            </DialogTrigger>
            <FocusBatchModalContent onClose={() => setIsFocusBatchModalOpen(false)} />
          </Dialog>
          
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only">Filters & Sort</span>
            </Button>
          </SheetTrigger>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

    