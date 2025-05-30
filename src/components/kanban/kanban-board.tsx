
"use client";

import { useKanban } from "@/lib/store";
import type { Task, Column as ColumnType, FilterState, SortState } from "@/lib/types";
import { KanbanColumn } from "./kanban-column";
// import { QuickAddTask } from "./quick-add-task"; // Removed this import
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ActiveFilterPills } from "@/components/filter-sort/active-filter-pills";
import { isPast, isToday, isThisISOWeek, parseISO } from "date-fns";
import React from "react";
import { ClipboardList, PlusCircle, SearchX } from "lucide-react";

// Helper function to sort tasks
const sortTasks = (tasks: Task[], sortState: SortState): Task[] => {
  const { criteria, direction } = sortState;
  return [...tasks].sort((a, b) => {
    let valA, valB;
    switch (criteria) {
      case "creationDate":
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
        break;
      case "dueDate":
        valA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        valB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        if (valA === Infinity && valB !== Infinity) return direction === 'asc' ? 1 : -1;
        if (valB === Infinity && valA !== Infinity) return direction === 'asc' ? -1 : 1;
        break;
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        valA = priorityOrder[a.priority];
        valB = priorityOrder[b.priority];
        break;
      default:
        return 0;
    }
    return direction === "asc" ? valA - valB : valB - valA;
  });
};

// Helper function to filter tasks
const filterTasks = (tasks: Task[], filters: FilterState): Task[] => {
  return tasks.filter(task => {
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(task.columnId)) {
      return false;
    }

    // Priority filter
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }

    // Due date filter
    if (filters.dueDate) {
      if (!task.dueDate) { // Task has no due date
        if (filters.dueDate !== "none") return false;
      } else { // Task has a due date
        if (filters.dueDate === "none") return false; // If filtering for "none" but task has a due date
        const dueDate = task.dueDate instanceof Date ? task.dueDate : parseISO(task.dueDate as unknown as string);
        if (filters.dueDate === "overdue" && !(isPast(dueDate) && !isToday(dueDate))) return false;
        if (filters.dueDate === "today" && !isToday(dueDate)) return false;
        if (filters.dueDate === "thisWeek" && !isThisISOWeek(dueDate)) return false;
      }
    }

    // Search term filter (applies to title, description, and tags)
    if (filters.searchTerm) {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const inTitle = task.title.toLowerCase().includes(searchTermLower);
      const inDescription = task.description?.toLowerCase().includes(searchTermLower) || false;
      const inTags = task.tags.some(tag => tag.toLowerCase().includes(searchTermLower));
      if (!(inTitle || inDescription || inTags)) {
        return false;
      }
    }
    return true; // Task passes all active filters
  });
};


export function KanbanBoard() {
  const { state, dispatch } = useKanban();
  const { tasks, columns, filters, sort } = state;

  const handleOpenNewTaskModal = () => {
    dispatch({ type: "OPEN_TASK_MODAL", payload: null });
  };

  if (tasks.length === 0 && !filters.searchTerm) {
    return (
      <div className="flex flex-col flex-grow p-4 space-y-4 items-center justify-center text-center">
        {/* QuickAddTask was here - Removed */}
        <div className="flex flex-col items-center justify-center flex-grow w-full bg-muted/30 rounded-lg p-8 mt-4">
          <ClipboardList className="h-24 w-24 text-muted-foreground mb-6" data-ai-hint="clipboard list" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">Your Task Board is Empty!</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            It looks like there are no tasks here yet. Get started by adding your first task and take control of your workflow.
          </p>
          <Button onClick={handleOpenNewTaskModal} size="lg">
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Task
          </Button>
        </div>
      </div>
    );
  }

  const filteredAndSortedTasks = filterTasks(tasks, filters);
  const visibleColumns = columns.filter(col => filters.status.includes(col.id));


  return (
    <div className="flex flex-col flex-grow p-4 space-y-4 overflow-hidden">
      {/* <QuickAddTask />  // Removed this instance */}
      <ActiveFilterPills />
      <ScrollArea className="flex-grow w-full">
        <div className="flex flex-col md:flex-row md:whitespace-nowrap gap-4 h-full pb-4">
          {visibleColumns.map((column) => {
            const columnTasks = filteredAndSortedTasks.filter((task) => task.columnId === column.id);
            const sortedColumnTasks = sortTasks(columnTasks, sort);
            return (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={sortedColumnTasks}
                allColumns={columns}
              />
            );
          })}
           {visibleColumns.length === 0 && tasks.length > 0 && (
            <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground p-8 text-center flex-grow bg-muted/30 rounded-lg">
              <SearchX className="h-16 w-16 text-muted-foreground mb-4" data-ai-hint="search magnifying glass" />
              <p className="text-lg font-medium text-foreground">No tasks match your current filters.</p>
              <p className="text-sm">Try adjusting your filter settings or clearing them.</p>
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
