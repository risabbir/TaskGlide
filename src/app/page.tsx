
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { useKanban } from "@/lib/store";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { QuickAddTask } from "@/components/kanban/quick-add-task";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
// Removed direct import of FocusBatchModalContent
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import React, { useState, Suspense } from "react";
import dynamic from 'next/dynamic';

const TaskModal = dynamic(() => import('@/components/task/task-modal').then(mod => mod.TaskModal), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50"><p>Loading task editor...</p></div>
});
const FilterSidebar = dynamic(() => import('@/components/filter-sort/filter-sidebar').then(mod => mod.FilterSidebar), { 
  ssr: false,
  loading: () => <div className="p-6 text-center"><p>Loading filters...</p></div>
});
const Confetti = dynamic(() => import('@/components/ui/confetti').then(mod => mod.Confetti), { 
  ssr: false 
});
const FocusBatchModalContent = dynamic(() => import('@/components/ai/focus-batch-modal').then(mod => mod.FocusBatchModalContent), {
  ssr: false,
  // Basic loading state, Dialog's own structure will provide some framing
  loading: () => <div className="p-6 text-center">Loading AI suggestions...</div> 
});


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
          {/* Conditionally render Suspense and FocusBatchModalContent only when dialog is open */}
          {isFocusBatchModalOpen && (
            <Suspense fallback={<div className="p-6 text-center">Loading AI suggestions...</div>}>
              <FocusBatchModalContent onClose={() => setIsFocusBatchModalOpen(false)} />
            </Suspense>
          )}
        </Dialog>
      </div>
    </div>
  );
}


function PageContent() {
  const { state, dispatch } = useKanban();
  const { isFilterSidebarOpen, isTaskModalOpen } = state;

  const toggleFilterSidebar = () => {
    dispatch({ type: "TOGGLE_FILTER_SIDEBAR" });
  };


  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <QuickActionsBar />
      <main className="flex-grow flex flex-col overflow-hidden">
        <KanbanBoard />
      </main>
      <Footer />
      {isTaskModalOpen && <Suspense fallback={<div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50"><p>Loading task editor...</p></div>}><TaskModal /></Suspense>}
      {isFilterSidebarOpen && (
        <Sheet open={isFilterSidebarOpen} onOpenChange={toggleFilterSidebar}>
          <SheetContent className="w-full sm:w-[400px] p-0 flex flex-col">
              <Suspense fallback={<div className="p-6 text-center"><p>Loading filters...</p></div>}><FilterSidebar /></Suspense>
          </SheetContent>
        </Sheet>
      )}
      <Suspense fallback={null}><Confetti /></Suspense>
    </div>
  );
}

export default function HomePage() {
  return (
      <PageContent />
  );
}
