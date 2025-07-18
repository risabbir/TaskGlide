
"use client";

import React, { useState, Suspense, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { useKanban } from "@/lib/store";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { QuickAddTask } from "@/components/kanban/quick-add-task";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { APP_NAME } from "@/lib/constants";

// Dynamic imports for components that might be heavy or not immediately needed
const TaskModal = dynamic(() => import('@/components/task/task-modal').then(mod => mod.TaskModal), {
  ssr: false,
  loading: () => <TaskModalSkeleton />
});
const FilterSidebar = dynamic(() => import('@/components/filter-sort/filter-sidebar').then(mod => mod.FilterSidebar), { 
  ssr: false,
  loading: () => <SidebarSkeleton />
});
const Confetti = dynamic(() => import('@/components/ui/confetti').then(mod => mod.Confetti), { 
  ssr: false,
  loading: () => null // No specific loader for confetti, it's okay if it loads slightly delayed
});
const FocusBatchModalContent = dynamic(() => import('@/components/ai/focus-batch-modal').then(mod => mod.FocusBatchModalContent), {
  ssr: false,
  loading: () => <FocusBatchModalSkeleton />
});

// Skeletons for dynamic components
const TaskModalSkeleton = () => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-card p-6 rounded-lg shadow-xl w-full max-w-md text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
      <p className="text-muted-foreground">Loading Task Editor...</p>
    </div>
  </div>
);

const SidebarSkeleton = () => (
  <div className="p-6 space-y-6">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-5 w-1/3 bg-muted rounded animate-pulse"></div>
        <div className="h-8 w-full bg-muted rounded animate-pulse"></div>
        <div className="h-8 w-2/3 bg-muted rounded animate-pulse mt-1"></div>
      </div>
    ))}
    <div className="h-10 w-full bg-muted rounded animate-pulse mt-8"></div>
  </div>
);

const FocusBatchModalSkeleton = () => (
  <div className="p-6 text-center min-h-[200px] flex flex-col items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
    <p className="text-muted-foreground">Loading AI Suggestions...</p>
  </div>
);

function QuickActionsBar() {
  const [isFocusBatchModalOpen, setIsFocusBatchModalOpen] = useState(false);
  return (
    <div className="container mx-auto px-4 py-3">
      <div className="bg-card p-3 sm:p-4 rounded-xl shadow-lg border flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-grow">
          <QuickAddTask />
        </div>
        <Dialog open={isFocusBatchModalOpen} onOpenChange={setIsFocusBatchModalOpen}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 flex items-center gap-2.5"
            >
              <Sparkles className="h-5 w-5" />
              Suggest Focus Batch
            </Button>
          </DialogTrigger>
          {isFocusBatchModalOpen && ( // Conditionally render content to ensure loading state is used by Suspense
            <Suspense fallback={<FocusBatchModalSkeleton />}>
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

  useEffect(() => {
    document.title = `Kanban Board | ${APP_NAME}`;
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <h1 className="sr-only">TaskGlide Kanban Board</h1>
      <Header />
      <QuickActionsBar />
      <main className="flex-grow flex flex-col overflow-hidden">
        <KanbanBoard />
      </main>
      <Footer />
      
      {/* Conditionally render TaskModal with Suspense */}
      {isTaskModalOpen && (
        <Suspense fallback={<TaskModalSkeleton />}>
          <TaskModal />
        </Suspense>
      )}

      {/* Filter Sidebar Sheet */}
      <Sheet open={isFilterSidebarOpen} onOpenChange={toggleFilterSidebar}>
        <SheetContent className="w-full sm:w-[400px] p-0 flex flex-col border-l shadow-xl">
          <SheetHeader className="p-6 pb-4 border-b flex-shrink-0">
            <SheetTitle className="text-xl">Filters & Sort</SheetTitle>
            <SheetDescription>
              Refine your view of tasks on the board.
            </SheetDescription>
          </SheetHeader>
          <Suspense fallback={<SidebarSkeleton />}>
            <FilterSidebar />
          </Suspense>
        </SheetContent>
      </Sheet>
      
      <Suspense fallback={null}>
        <Confetti />
      </Suspense>
    </div>
  );
}

export default function HomePage() {
  return <PageContent />;
}
