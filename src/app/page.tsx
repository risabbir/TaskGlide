
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { KanbanProvider, useKanban } from "@/lib/store"; // KanbanProvider already here
import { TaskModal } from "@/components/task/task-modal";
import { FilterSidebar } from "@/components/filter-sort/filter-sidebar";
import { Confetti } from "@/components/ui/confetti";
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
    // Removed Sheet for filter sidebar from here as BottomNav will control it globally
    // The FilterSidebar component itself will be rendered based on isFilterSidebarOpen from context
    <div className="flex flex-col min-h-screen">
      <Header>
        {/* Mobile Filter Trigger in Header can be removed if BottomNav handles it, or kept for md screens if desired */}
        {/* For now, let's remove it from here as BottomNav has a dedicated filter button. */}
      </Header>
      <QuickActionsBar />
      <main className="flex-grow flex flex-col overflow-hidden">
        <KanbanBoard />
      </main>
      <Footer />
      <TaskModal />
      {/* FilterSidebar is now controlled by BottomNavigation and KanbanContext state */}
      {isFilterSidebarOpen && (
        <Sheet open={isFilterSidebarOpen} onOpenChange={toggleFilterSidebar}>
          <SheetContent className="w-full sm:w-[400px] p-0 flex flex-col">
              <FilterSidebar />
          </SheetContent>
        </Sheet>
      )}
      <Confetti />
    </div>
  );
}

export default function HomePage() {
  // KanbanProvider is already at RootLayout level now
  return (
      <PageContent />
  );
}
