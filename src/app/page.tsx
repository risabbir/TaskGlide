
"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { KanbanProvider, useKanban } from "@/lib/store";
import { TaskModal } from "@/components/task/task-modal";
import { FilterSidebar } from "@/components/filter-sort/filter-sidebar";
import { Confetti } from "@/components/ui/confetti";
import { Toaster } from "@/components/ui/toaster";
import { Sheet, SheetContent } from "@/components/ui/sheet";

function PageContent() {
  const { state, dispatch } = useKanban();
  const { isFilterSidebarOpen } = state;

  return (
    <Sheet open={isFilterSidebarOpen} onOpenChange={() => dispatch({ type: "TOGGLE_FILTER_SIDEBAR" })}>
      <div className="flex flex-col min-h-screen">
        <Header />
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
