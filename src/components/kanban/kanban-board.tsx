
"use client";

import { useKanban } from "@/lib/store";
import type { Task, Column as ColumnType, FilterState, SortState } from "@/lib/types";
import { KanbanColumn } from "./kanban-column";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ActiveFilterPills } from "@/components/filter-sort/active-filter-pills";
import { isPast, isToday, isThisISOWeek, parseISO, startOfDay, endOfDay, isWithinInterval, isSameDay, isAfter, isBefore } from "date-fns";
import React from "react";
import { ClipboardList, PlusCircle, SearchX } from "lucide-react";
import { DEFAULT_COLUMNS } from "@/lib/constants";

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
    // Status filter: If no status filters are selected, it defaults to showing all.
    // But if some are selected, the task's columnId must be in the selected list.
    if (filters.status && filters.status.length > 0 && !filters.status.includes(task.columnId)) {
      return false;
    }

    // Priority filter
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }

    // Due date filter
    const taskDueDate = task.dueDate ? (task.dueDate instanceof Date ? task.dueDate : parseISO(task.dueDate as unknown as string)) : null;

    if (filters.dueDate) { // Predefined range filter
      if (!taskDueDate) {
        if (filters.dueDate !== "none") return false;
      } else {
        if (filters.dueDate === "none") return false;
        if (filters.dueDate === "overdue" && !(isPast(taskDueDate) && !isToday(taskDueDate))) return false;
        if (filters.dueDate === "today" && !isToday(taskDueDate)) return false;
        if (filters.dueDate === "thisWeek" && !isThisISOWeek(taskDueDate)) return false;
      }
    } else if (filters.dueDateStart || filters.dueDateEnd) { // Specific date range filter
      if (!taskDueDate) return false; // Tasks without due dates don't match specific ranges

      const startDate = filters.dueDateStart ? startOfDay(filters.dueDateStart) : null;
      const endDate = filters.dueDateEnd ? endOfDay(filters.dueDateEnd) : null;
      
      if (startDate && endDate) {
        if (!isWithinInterval(taskDueDate, { start: startDate, end: endDate })) return false;
      } else if (startDate) {
        if (!(isAfter(taskDueDate, startDate) || isSameDay(taskDueDate, startDate))) return false;
      } else if (endDate) {
        if (!(isBefore(taskDueDate, endDate) || isSameDay(taskDueDate, endDate))) return false;
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

  const filteredAndSortedTasks = filterTasks(tasks, filters);
  const visibleColumns = columns.filter(col => filters.status.includes(col.id));

  if (tasks.length === 0 && !filters.searchTerm && !filters.dueDateStart && !filters.dueDateEnd && !filters.dueDate && !filters.priority && filters.status.length === DEFAULT_COLUMNS.length) {
    return (
      <div className="flex flex-col flex-grow p-4 space-y-4 items-center justify-center text-center">
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


  return (
    <div className="flex flex-col flex-grow p-4 space-y-4 overflow-hidden">
      <ActiveFilterPills />
      {/* On mobile, columns stack and the page scrolls. On md+, columns are in a row and scroll horizontally */}
      <ScrollArea className="flex-grow w-full md:h-auto"> {/* md:h-auto allows natural height for horizontal scroll */}
        <div className="flex flex-col md:flex-row gap-4 pb-4 md:whitespace-nowrap h-full"> {/* md:whitespace-nowrap for horizontal scroll */}
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
           {visibleColumns.length === 0 && (filteredAndSortedTasks.length === 0 && tasks.length > 0) && (
            <div className="flex flex-col items-center justify-center h-full w-full text-muted-foreground p-8 text-center flex-grow bg-muted/30 rounded-lg">
              <SearchX className="h-16 w-16 text-muted-foreground mb-4" data-ai-hint="search magnifying glass" />
              <p className="text-lg font-medium text-foreground">No tasks match your current filters.</p>
              <p className="text-sm">Try adjusting your filter settings or clearing them.</p>
            </div>
          )}
        </div>
        {/* Horizontal scrollbar wrapper for spacing, only visible on md+ screens */}
        <div className="hidden md:block mt-3">
          <ScrollBar orientation="horizontal" forceMount />
        </div>
      </ScrollArea>
    </div>
  );
}

