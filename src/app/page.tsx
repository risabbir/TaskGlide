
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { KanbanProvider, useKanban } from "@/lib/store";
import { TaskModal } from "@/components/task/task-modal";
import { FilterSidebar } from "@/components/filter-sort/filter-sidebar";
import { Confetti } from "@/components/ui/confetti";
import { Toaster } from "@/components/ui/toaster";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { QuickAddTask } from "@/components/kanban/quick-add-task";
import { Button } from "@/components/ui/button";
import { Sparkles, SlidersHorizontal } from "lucide-react";
import { FocusBatchModalContent } from "@/components/ai/focus-batch-modal";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import React, { useState } from "react";


function QuickActionsBar() {
  const [isFocusBatchModalOpen, setIsFocusBatchModalOpen] = useState(false);
  return (
    <div className="container mx-auto px-4 py-3">
      <div className="bg-card p-3 sm:p-4 rounded-lg shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-grow">
          <QuickAddTask />
        </div>
        <Dialog open={isFocusBatchModalOpen} onOpenChange={setIsFocusBatchModalOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              Suggest Focus Batch
            </Button>
          </DialogTrigger>
          <FocusBatchModalContent onClose={() => setIsFocusBatchModalOpen(false)} />
        </Dialog>
      </div>
    </div>
  );
}


function PageContent() {
  const { state, dispatch } = useKanban();
  const { isFilterSidebarOpen } = state;

  const toggleFilterSidebar = () => {
    dispatch({ type: "TOGGLE_FILTER_SIDEBAR" });
  };


  return (
    <Sheet open={isFilterSidebarOpen} onOpenChange={toggleFilterSidebar}>
      <div className="flex flex-col min-h-screen">
        <Header>
          {/* Desktop Filter Trigger (conditionally rendered in Header itself) */}
          {/* Mobile Filter Trigger */}
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 md:hidden"> {/* Show only on mobile for filter trigger */}
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only">Filters & Sort</span>
            </Button>
          </SheetTrigger>
        </Header>
        <QuickActionsBar />
        <main className="flex-grow flex flex-col overflow-hidden">
          <KanbanBoard />
        </main>
        <Footer />
        <TaskModal />
        <SheetContent className="w-full sm:w-[400px] p-0 flex flex-col">
            <FilterSidebar />
        </SheetContent>
        <Confetti />
        <Toaster />
      </div>
    </Sheet>
  );
}

export default function HomePage() {
  return (
    <KanbanProvider>
      <PageContent />
    </KanbanProvider>
  );
}
