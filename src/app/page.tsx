
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { KanbanProvider } from "@/lib/store";
import { TaskModal } from "@/components/task/task-modal";
import { FilterSidebar } from "@/components/filter-sort/filter-sidebar";
import { Confetti } from "@/components/ui/confetti";
import { Toaster } from "@/components/ui/toaster";


export default function HomePage() {
  return (
    <KanbanProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex flex-col overflow-hidden">
          <KanbanBoard />
        </main>
        <Footer />
        <TaskModal />
        <FilterSidebar />
        <Confetti />
        <Toaster />
      </div>
    </KanbanProvider>
  );
}
